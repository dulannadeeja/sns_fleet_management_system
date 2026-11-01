import { randomUUID } from 'node:crypto';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, customer, customerDocument, documentAccess, permissionGrant, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { normalNic, NIC } from '../../lib/nic';
import { realDate, todayColombo } from '../../lib/dates';
import { getFile, putFile } from '../../storage/files';
import { copyType, MAX_COPY_BYTES } from '../../storage/kinds';

// Customers (ST-08.1 to ST-08.3; system design 6). One NIC is one customer (AT-51). Saved with name, NIC, phone and
// licence number and expiry; the four copies may come later and the customer shows "copies missing" until they are in
// (AT-49). Copies are private files, opened only with customer access, each opening recorded (AT-59). "Customer access"
// is its own permission (Proposed: Dulan, 1 Nov 2026). Flags and debts come with #24 and Phase 2.

export const COPY_KINDS = ['nicFront', 'nicBack', 'licenceFront', 'licenceBack'] as const;
export type CopyKind = (typeof COPY_KINDS)[number];
export const isCopyKind = (k: string): k is CopyKind => (COPY_KINDS as readonly string[]).includes(k);
export const DETAIL_FIELDS = ['name', 'phone', 'address', 'licenceNumber', 'licenceExpires'] as const;
export type DetailField = (typeof DETAIL_FIELDS)[number];

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CustomerError = 'notAllowed' | 'notFound' | 'nameMissing' | 'nicInvalid' | 'phoneInvalid' | 'licenceNumberMissing'
  | 'licenceExpiresInvalid' | 'kindInvalid' | 'fileType' | 'fileTooBig' | 'stale';
export interface Details { name: string; phone: string; address?: string | null; licenceNumber: string; licenceExpires: string }
export interface NewCustomer extends Details { nic: string }
export interface Copy { kind: string; bytes: Uint8Array }

async function actorMay(q: Tx | typeof db, actorId: string, permission: Permission): Promise<boolean> {
  const [actor] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!actor) return false;
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(actor, granted, permission);
}

/** A phone number as typed, tidied: digits with an optional leading +, 9 to 15 digits (input check only). */
const normalPhone = (raw: string) => raw.replace(/[\s-]/g, '');
const PHONE = /^\+?\d{9,15}$/;

function readDetails(input: Details): { values: Required<Details> } | { error: CustomerError } {
  const name = (input.name ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return { error: 'nameMissing' };
  const phone = normalPhone(input.phone ?? '');
  if (!PHONE.test(phone)) return { error: 'phoneInvalid' };
  const licenceNumber = (input.licenceNumber ?? '').trim().toUpperCase();
  if (!licenceNumber) return { error: 'licenceNumberMissing' };
  if (!realDate(input.licenceExpires ?? '')) return { error: 'licenceExpiresInvalid' };
  return { values: { name, phone, address: (input.address ?? '').trim() || null, licenceNumber, licenceExpires: input.licenceExpires } };
}

function readCopy(copy: Copy): { kind: CopyKind; bytes: Uint8Array; contentType: string } | { error: CustomerError; kind?: string } {
  if (!isCopyKind(copy.kind)) return { error: 'kindInvalid' };
  if (copy.bytes.length > MAX_COPY_BYTES) return { error: 'fileTooBig', kind: copy.kind };
  const type = copyType(copy.bytes);
  if (!type) return { error: 'fileType', kind: copy.kind };
  return { kind: copy.kind, bytes: copy.bytes, contentType: type };
}

/** Stores a checked copy as a private file and returns its row values (the caller inserts the row in its transaction). */
async function store(customerId: string, copy: { kind: CopyKind; bytes: Uint8Array; contentType: string }, actorId: string) {
  const storageKey = `customers/${customerId}/${randomUUID()}`;
  await putFile(storageKey, copy.bytes, copy.contentType);
  return { customerId, kind: copy.kind, storageKey, contentType: copy.contentType, size: copy.bytes.length, createdBy: actorId };
}

export type AddResult = { ok: true; id: string } | { existing: string } | { error: CustomerError; kind?: string };

/**
 * Adds a customer with any copies already taken (ST-08.2). A NIC already recorded opens that customer instead (AT-51).
 * Needs customer access. Every file is checked before anything is saved; a refusal saves nothing. Logged.
 */
export async function addCustomer(actorId: string, input: NewCustomer, copies: Copy[] = []): Promise<AddResult> {
  const read = readDetails(input);
  if ('error' in read) return read;
  const nic = normalNic(input.nic ?? '');
  if (!NIC.test(nic)) return { error: 'nicInvalid' };
  const checked = [];
  for (const c of copies) {
    const r = readCopy(c);
    if ('error' in r) return r;
    checked.push(r);
  }
  if (!(await actorMay(db, actorId, 'customerAccess'))) return { error: 'notAllowed' };
  const [found] = await db.select({ id: customer.id }).from(customer).where(eq(customer.nic, nic));
  if (found) return { existing: found.id };
  const id = randomUUID();
  // Files first (outside the transaction): a refused save leaves at most an unreferenced private file, never a row
  // pointing at a missing file.
  const rows: Awaited<ReturnType<typeof store>>[] = [];
  for (const c of checked) rows.push(await store(id, c, actorId));
  try {
    return await db.transaction(async (tx) => {
      if (!(await actorMay(tx, actorId, 'customerAccess'))) return { error: 'notAllowed' } as const;
      await tx.insert(customer).values({ id, nic, ...read.values, createdBy: actorId });
      if (rows.length) await tx.insert(customerDocument).values(rows);
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.add', targetType: 'customer', targetId: id,
        details: { name: read.values.name, copies: rows.map((r) => r.kind) } });
      return { ok: true, id } as const;
    });
  } catch (e) {
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23505' && pg.constraint === 'customer_one_per_nic') {
      const [again] = await db.select({ id: customer.id }).from(customer).where(eq(customer.nic, nic));
      if (again) return { existing: again.id };
    }
    throw e;
  }
}

/** Adds or replaces one copy (the newest of a kind counts; older ones stay, insert-only). Needs customer access. Logged. */
export async function addCopy(actorId: string, customerId: string, kind: string, bytes: Uint8Array): Promise<{ ok: true } | { error: CustomerError; kind?: string }> {
  if (!UUID.test(customerId)) return { error: 'notFound' };
  const r = readCopy({ kind, bytes });
  if ('error' in r) return r;
  if (!(await actorMay(db, actorId, 'customerAccess'))) return { error: 'notAllowed' };
  const [c] = await db.select({ id: customer.id, name: customer.name }).from(customer).where(eq(customer.id, customerId));
  if (!c) return { error: 'notFound' };
  const row = await store(customerId, r, actorId);
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'customerAccess'))) return { error: 'notAllowed' } as const;
    await tx.insert(customerDocument).values(row);
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.copyAdd', targetType: 'customer', targetId: customerId, details: { name: c.name, kind: r.kind } });
    return { ok: true } as const;
  });
}

/**
 * Corrects a customer's details (ST-08.3), never the NIC (one NIC is one customer). `was` is what the form showed: only
 * changed fields are saved, none if someone saved one of them meanwhile. Each change logged with old and new (PR-05).
 */
export async function correctCustomer(actorId: string, customerId: string, input: Details, was: Details): Promise<{ ok: true; changed: DetailField[] } | { error: CustomerError; fields?: DetailField[] }> {
  if (!UUID.test(customerId)) return { error: 'notFound' };
  const read = readDetails(input);
  if ('error' in read) return read;
  const prev = readDetails(was);
  const before: Record<DetailField, string | null> = 'error' in prev
    ? { name: was.name, phone: was.phone, address: was.address ?? null, licenceNumber: was.licenceNumber, licenceExpires: was.licenceExpires }
    : prev.values;
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'customerAccess'))) return { error: 'notAllowed' } as const;
    const [cur] = await tx.select({ name: customer.name, phone: customer.phone, address: customer.address, licenceNumber: customer.licenceNumber, licenceExpires: customer.licenceExpires })
      .from(customer).where(eq(customer.id, customerId)).for('update');
    if (!cur) return { error: 'notFound' } as const;
    const touched = DETAIL_FIELDS.filter((f) => read.values[f] !== before[f]);
    const stale = touched.filter((f) => cur[f] !== before[f]);
    if (stale.length) return { error: 'stale', fields: stale } as const;
    const changed = touched.filter((f) => cur[f] !== read.values[f]);
    if (!changed.length) return { ok: true, changed: [] } as const;
    await tx.update(customer).set({ ...Object.fromEntries(changed.map((f) => [f, read.values[f]])), updatedAt: sql`now()` }).where(eq(customer.id, customerId));
    for (const field of changed) {
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.change', targetType: 'customer', targetId: customerId,
        details: { name: read.values.name, field, old: cur[field], new: read.values[field] } });
    }
    return { ok: true, changed } as const;
  });
}

export interface CustomerRow {
  id: string; name: string; nic: string; phone: string; licenceExpires: string; licenceExpired: boolean; copiesMissing: CopyKind[];
}
export interface CustomerDoc { id: string; kind: CopyKind; contentType: string; size: number; createdAt: Date }
export interface Customer extends CustomerRow { address: string | null; licenceNumber: string; documents: CustomerDoc[]; createdAt: Date }

const newestCopies = () => db.selectDistinctOn([customerDocument.customerId, customerDocument.kind], {
  id: customerDocument.id, customerId: customerDocument.customerId, kind: customerDocument.kind, contentType: customerDocument.contentType,
  size: customerDocument.size, createdAt: customerDocument.createdAt,
}).from(customerDocument).orderBy(customerDocument.customerId, customerDocument.kind, desc(customerDocument.createdAt), desc(customerDocument.id));

const missing = (docs: { kind: string }[]) => COPY_KINDS.filter((k) => !docs.some((d) => d.kind === k));

/**
 * Customers found by name, NIC or phone (ST-08.1); without a search, the most recent first. People with an expired licence
 * come first (a Proposed check; owing money and flags join it in Phase 2 and #24). At most 100.
 */
export async function listCustomers(search?: string): Promise<CustomerRow[]> {
  const q = (search ?? '').trim();
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const where = q ? or(ilike(customer.name, like), ilike(customer.nic, `%${normalNic(q).replace(/[%_\\]/g, '')}%`), ilike(customer.phone, `%${q.replace(/[\s-]/g, '').replace(/[%_\\]/g, '')}%`)) : undefined;
  const today = todayColombo();
  const rows = await db.select({ id: customer.id, name: customer.name, nic: customer.nic, phone: customer.phone, licenceExpires: customer.licenceExpires })
    .from(customer).where(where)
    .orderBy(sql`${customer.licenceExpires} < ${today} desc`, q ? customer.name : desc(customer.createdAt)).limit(100);
  if (!rows.length) return [];
  const docs = await newestCopies().where(sql`${customerDocument.customerId} in ${rows.map((r) => r.id)}`);
  return rows.map((r) => ({ ...r, licenceExpired: r.licenceExpires < today, copiesMissing: missing(docs.filter((d) => d.customerId === r.id)) }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (!UUID.test(id)) return null;
  const [r] = await db.select().from(customer).where(eq(customer.id, id));
  if (!r) return null;
  const docs = (await newestCopies().where(eq(customerDocument.customerId, id))).filter((d) => isCopyKind(d.kind)) as (CustomerDoc & { customerId: string })[];
  const today = todayColombo();
  return { id: r.id, name: r.name, nic: r.nic, phone: r.phone, address: r.address, licenceNumber: r.licenceNumber, licenceExpires: r.licenceExpires,
    licenceExpired: r.licenceExpires < today, createdAt: r.createdAt, copiesMissing: missing(docs),
    documents: docs.map(({ id: docId, kind, contentType, size, createdAt }) => ({ id: docId, kind, contentType, size, createdAt })) };
}

/** Opens a copy for someone with customer access, recording who opened it and when (AT-59). There is no public link. */
export async function openCopy(actorId: string, documentId: string): Promise<{ ok: true; bytes: Uint8Array; contentType: string; kind: string; customerId: string } | { error: 'notAllowed' | 'notFound' }> {
  if (!UUID.test(documentId)) return { error: 'notFound' };
  if (!(await actorMay(db, actorId, 'customerAccess'))) return { error: 'notAllowed' };
  const [d] = await db.select().from(customerDocument).where(and(eq(customerDocument.id, documentId)));
  if (!d) return { error: 'notFound' };
  const bytes = await getFile(d.storageKey);
  if (!bytes) return { error: 'notFound' };
  await db.insert(documentAccess).values({ documentId, openedBy: actorId });
  return { ok: true, bytes, contentType: d.contentType, kind: d.kind, customerId: d.customerId };
}
