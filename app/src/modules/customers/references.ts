import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, customer, permissionGrant, referenceDocument, referencePerson, user } from '../../db/schema';
import { allows } from '../../auth/permissions';
import { normalNic, NIC } from '../../lib/nic';
import { getFile, putFile } from '../../storage/files';
import { copyType, MAX_COPY_BYTES } from '../../storage/kinds';

// Reference people (ST-05.5; system design 6, Confirmed 8 Nov 2026): kept with the customer and picked again on a
// later rental; one NIC is one reference person per customer. Name, NIC and phone are needed to save; the three copies
// (NIC front and back, driving licence) may come later and the rental shows them missing (AT-07). Copies are private
// files like the customer's; every opening is in the activity log. Everything needs Customer access.

export const REF_COPY_KINDS = ['nicFront', 'nicBack', 'licence'] as const;
export type RefCopyKind = (typeof REF_COPY_KINDS)[number];
export const isRefCopyKind = (k: string): k is RefCopyKind => (REF_COPY_KINDS as readonly string[]).includes(k);
export const RELATIONSHIPS = ['family', 'friend', 'employer', 'other'] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE = /^\+?\d{9,15}$/;
const tidy = (raw: unknown) => String(raw ?? '').trim().replace(/\s+/g, ' ');

export type RefError = 'notAllowed' | 'notFound' | 'nameMissing' | 'nicInvalid' | 'phoneInvalid' | 'relationshipInvalid' | 'kindInvalid' | 'fileType' | 'fileTooBig' | 'tooLong';

async function hasCustomerAccess(q: Tx | typeof db, actorId: string): Promise<boolean> {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!a) return false;
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(a, granted, 'customerAccess');
}

function readCopy(c: { kind: string; bytes: Uint8Array }): { kind: RefCopyKind; bytes: Uint8Array; contentType: string } | { error: RefError; kind?: string } {
  if (!isRefCopyKind(c.kind)) return { error: 'kindInvalid' };
  if (c.bytes.length > MAX_COPY_BYTES) return { error: 'fileTooBig', kind: c.kind };
  const type = copyType(c.bytes);
  if (!type) return { error: 'fileType', kind: c.kind };
  return { kind: c.kind, bytes: c.bytes, contentType: type };
}

async function store(referenceId: string, c: { kind: RefCopyKind; bytes: Uint8Array; contentType: string }, actorId: string) {
  const storageKey = `references/${referenceId}/${randomUUID()}`;
  await putFile(storageKey, c.bytes, c.contentType);
  return { referencePersonId: referenceId, kind: c.kind, storageKey, contentType: c.contentType, size: c.bytes.length, createdBy: actorId };
}

export type AddRefResult = { ok: true; id: string } | { existing: string } | { error: RefError; kind?: string };

/** Adds a reference person to a customer, with any copies already taken. Their NIC already recorded for this customer
 *  returns that person instead. Logged as customer.referenceAdd. */
export async function addReference(actorId: string, customerId: string, input: { name: string; nic: string; phone: string; relationship?: string | null },
  copies: { kind: string; bytes: Uint8Array }[] = []): Promise<AddRefResult> {
  if (!UUID.test(customerId)) return { error: 'notFound' };
  const nic = normalNic(input.nic ?? '');
  if (!NIC.test(nic)) return { error: 'nicInvalid' };
  if (!(await hasCustomerAccess(db, actorId))) return { error: 'notAllowed' };
  const [known] = await db.select({ id: referencePerson.id }).from(referencePerson).where(and(eq(referencePerson.customerId, customerId), eq(referencePerson.nic, nic)));
  if (known) return { existing: known.id };
  const name = tidy(input.name);
  if (!name) return { error: 'nameMissing' };
  const phone = String(input.phone ?? '').replace(/[\s-]/g, '');
  if (!PHONE.test(phone)) return { error: 'phoneInvalid' };
  const relationship = tidy(input.relationship) || null;
  if (relationship && !(RELATIONSHIPS as readonly string[]).includes(relationship)) return { error: 'relationshipInvalid' };
  const checked = [];
  for (const c of copies) {
    const r = readCopy(c);
    if ('error' in r) return r;
    checked.push(r);
  }
  const id = randomUUID();
  // Files first (outside the transaction): a refused save leaves at most an unreferenced private file.
  const rows: Awaited<ReturnType<typeof store>>[] = [];
  for (const c of checked) rows.push(await store(id, c, actorId));
  try {
    return await db.transaction(async (tx) => {
      if (!(await hasCustomerAccess(tx, actorId))) return { error: 'notAllowed' } as const;
      const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, customerId));
      if (!c) return { error: 'notFound' } as const;
      await tx.insert(referencePerson).values({ id, customerId, name, nic, phone, relationship, createdBy: actorId });
      if (rows.length) await tx.insert(referenceDocument).values(rows);
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.referenceAdd', targetType: 'customer', targetId: customerId,
        details: { name: c.name, reference: name, copies: rows.map((r) => r.kind) } });
      return { ok: true, id } as const;
    });
  } catch (e) {
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23505' && pg.constraint === 'reference_person_one_per_nic') {
      const [again] = await db.select({ id: referencePerson.id }).from(referencePerson).where(and(eq(referencePerson.customerId, customerId), eq(referencePerson.nic, nic)));
      if (again) return { existing: again.id };
    }
    throw e;
  }
}

/** Adds or replaces one of a reference person's copies (the newest of a kind counts). Logged as customer.referenceCopyAdd. */
export async function addReferenceCopy(actorId: string, referenceId: string, kind: string, bytes: Uint8Array): Promise<{ ok: true } | { error: RefError; kind?: string }> {
  if (!UUID.test(referenceId)) return { error: 'notFound' };
  const r = readCopy({ kind, bytes });
  if ('error' in r) return r;
  if (!(await hasCustomerAccess(db, actorId))) return { error: 'notAllowed' };
  const [ref] = await db.select({ customerId: referencePerson.customerId, name: referencePerson.name }).from(referencePerson).where(eq(referencePerson.id, referenceId));
  if (!ref) return { error: 'notFound' };
  const row = await store(referenceId, r, actorId);
  return db.transaction(async (tx) => {
    if (!(await hasCustomerAccess(tx, actorId))) return { error: 'notAllowed' } as const;
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, ref.customerId));
    await tx.insert(referenceDocument).values(row);
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.referenceCopyAdd', targetType: 'customer', targetId: ref.customerId,
      details: { name: c?.name ?? '', reference: ref.name, kind: r.kind } });
    return { ok: true } as const;
  });
}

export interface ReferenceRow {
  id: string; customerId: string; name: string; nic: string; phone: string; relationship: Relationship | null;
  documents: { id: string; kind: RefCopyKind; contentType: string; createdAt: Date }[]; copiesMissing: RefCopyKind[];
}

async function newestDocs(referenceIds: string[], q: Tx | typeof db = db) {
  if (!referenceIds.length) return [];
  return q.selectDistinctOn([referenceDocument.referencePersonId, referenceDocument.kind], {
    id: referenceDocument.id, referenceId: referenceDocument.referencePersonId, kind: referenceDocument.kind, contentType: referenceDocument.contentType,
    createdAt: referenceDocument.createdAt,
  }).from(referenceDocument).where(sql`${referenceDocument.referencePersonId} in ${referenceIds}`)
    .orderBy(referenceDocument.referencePersonId, referenceDocument.kind, desc(referenceDocument.createdAt), desc(referenceDocument.id));
}

const toRow = (r: typeof referencePerson.$inferSelect, docs: Awaited<ReturnType<typeof newestDocs>>): ReferenceRow => {
  const mine = docs.filter((d) => d.referenceId === r.id && isRefCopyKind(d.kind)).map((d) => ({ id: d.id, kind: d.kind as RefCopyKind, contentType: d.contentType, createdAt: d.createdAt }));
  return { id: r.id, customerId: r.customerId, name: r.name, nic: r.nic, phone: r.phone, relationship: r.relationship as Relationship | null,
    documents: mine, copiesMissing: REF_COPY_KINDS.filter((k) => !mine.some((d) => d.kind === k)) };
};

/** A customer's reference people, newest first. Callers check Customer access. */
export async function referencesOf(customerId: string): Promise<ReferenceRow[]> {
  if (!UUID.test(customerId)) return [];
  const rows = await db.select().from(referencePerson).where(eq(referencePerson.customerId, customerId)).orderBy(desc(referencePerson.createdAt));
  const docs = await newestDocs(rows.map((r) => r.id));
  return rows.map((r) => toRow(r, docs));
}

/** One reference person with their copies (also inside a transaction). */
export async function getReference(id: string, q: Tx | typeof db = db): Promise<ReferenceRow | null> {
  if (!UUID.test(id)) return null;
  const [r] = await q.select().from(referencePerson).where(eq(referencePerson.id, id));
  return r ? toRow(r, await newestDocs([r.id], q)) : null;
}

/** Opens a reference person's copy for someone with Customer access; the opening is in the activity log (system
 *  design 6: every opening is logged with who and when). There is no public link. */
export async function openReferenceCopy(actorId: string, documentId: string, referenceId: string): Promise<{ ok: true; bytes: Uint8Array; contentType: string } | { error: 'notAllowed' | 'notFound' }> {
  if (!UUID.test(documentId) || !UUID.test(referenceId)) return { error: 'notFound' };
  if (!(await hasCustomerAccess(db, actorId))) return { error: 'notAllowed' };
  const [d] = await db.select().from(referenceDocument).where(eq(referenceDocument.id, documentId));
  if (!d || d.referencePersonId !== referenceId) return { error: 'notFound' };
  const bytes = await getFile(d.storageKey);
  if (!bytes) return { error: 'notFound' };
  const ref = (await getReference(referenceId))!;
  const [c] = await db.select({ name: customer.name }).from(customer).where(eq(customer.id, ref.customerId));
  await db.insert(auditEvent).values({ createdBy: actorId, action: 'customer.referenceCopyOpened', targetType: 'customer', targetId: ref.customerId,
    details: { name: c?.name ?? '', reference: ref.name, kind: d.kind } });
  return { ok: true, bytes, contentType: d.contentType };
}
