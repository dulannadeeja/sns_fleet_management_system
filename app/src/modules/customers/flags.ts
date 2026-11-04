import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db/client';
import { auditEvent, customer, customerFlag, customerGoAhead, permissionGrant, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { todayColombo } from '../../lib/dates';

// Customer flags and the check before a rental (ST-08.4, ST-08.5; system design 6 and 3.2).
// Confirmed: a flag (unpaid money, damaged a car, something else, with what happened) warns before every future rental;
// employees may continue with a recorded reason; a flag is closed with a reason and stays in the history with who closed
// it and when; nothing is deleted; no ratings or scores. An expired driving licence warns; only an authorised person
// continues, with a reason; that does not make the licence valid. Proposed (Dulan, 4 Nov 2026): flags need "Customer
// access"; until New rental exists the check is on the customer's page; the licence needs "Override expired-document
// warnings".

export const FLAG_KINDS = ['unpaid', 'damage', 'other'] as const;
export type FlagKind = (typeof FLAG_KINDS)[number];
export const isFlagKind = (k: string): k is FlagKind => (FLAG_KINDS as readonly string[]).includes(k);
export const TEXT_MAX = 500;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tidy = (raw: unknown) => String(raw ?? '').trim().replace(/\s+/g, ' ');

async function actorMay(q: Tx, actorId: string, permission: Permission): Promise<boolean> {
  const [actor] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!actor) return false;
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(actor, granted, permission);
}
/** One change to a customer's flags at a time, so a check sees the flags really there. */
const lockCustomer = (tx: Tx, customerId: string) => tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.customer:${customerId}`}))`);

export interface Flag {
  id: string; kind: FlagKind; details: string; createdAt: Date; createdByName: string | null;
  closedAt: Date | null; closedByName: string | null; closeReason: string | null;
}

/** All of a customer's flags, open first, newest first. Callers check "Customer access". */
export async function flagsOf(customerId: string, q: Tx | typeof db = db): Promise<Flag[]> {
  if (!UUID.test(customerId)) return [];
  const added = alias(user, 'added_by');
  const closed = alias(user, 'closed_by_person');
  const rows = await q.select({ f: customerFlag, addedName: added.name, closedName: closed.name }).from(customerFlag)
    .leftJoin(added, eq(added.id, customerFlag.createdBy)).leftJoin(closed, eq(closed.id, customerFlag.closedBy))
    .where(eq(customerFlag.customerId, customerId)).orderBy(sql`${customerFlag.closedAt} is not null`, desc(customerFlag.createdAt));
  return rows.map(({ f, addedName, closedName }) => ({
    id: f.id, kind: f.kind as FlagKind, details: f.details, createdAt: f.createdAt, createdByName: addedName,
    closedAt: f.closedAt, closedByName: closedName, closeReason: f.closeReason,
  }));
}

export type FlagResult = { ok: true; id: string } | { error: 'notAllowed' | 'notFound' | 'kindInvalid' | 'detailsMissing' | 'reasonMissing' | 'tooLong' | 'alreadyClosed' };

/** Flags a customer (ST-08.5): why and what happened. Logged as customer.flagAdd. */
export async function addFlag(actorId: string, customerId: string, input: { kind: string; details: string }): Promise<FlagResult> {
  if (!UUID.test(customerId)) return { error: 'notFound' };
  if (!isFlagKind(input.kind)) return { error: 'kindInvalid' };
  const details = tidy(input.details);
  if (!details) return { error: 'detailsMissing' };
  if (details.length > TEXT_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'customerAccess'))) return { error: 'notAllowed' } as const;
    await lockCustomer(tx, customerId);
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, customerId));
    if (!c) return { error: 'notFound' } as const;
    const [f] = await tx.insert(customerFlag).values({ customerId, kind: input.kind, details, createdBy: actorId }).returning({ id: customerFlag.id });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.flagAdd', targetType: 'customer', targetId: customerId,
      details: { name: c.name, kind: input.kind, details } });
    return { ok: true, id: f.id } as const;
  });
}

/** Closes an open flag with a reason (AT-48): it stops warning and stays in the history. Logged as customer.flagClose. */
export async function closeFlag(actorId: string, flagId: string, reasonRaw: string, customerId?: string): Promise<FlagResult> {
  if (!UUID.test(flagId) || (customerId !== undefined && !UUID.test(customerId))) return { error: 'notFound' };
  const reason = tidy(reasonRaw);
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > TEXT_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'customerAccess'))) return { error: 'notAllowed' } as const;
    const [f] = await tx.select({ customerId: customerFlag.customerId }).from(customerFlag).where(eq(customerFlag.id, flagId));
    // The flag must belong to the customer the page shows, when one is given (#24 review).
    if (!f || (customerId !== undefined && f.customerId !== customerId)) return { error: 'notFound' } as const;
    await lockCustomer(tx, f.customerId);
    const closed = await tx.update(customerFlag).set({ closedAt: sql`now()`, closedBy: actorId, closeReason: reason })
      .where(and(eq(customerFlag.id, flagId), isNull(customerFlag.closedAt))).returning({ kind: customerFlag.kind });
    if (!closed.length) return { error: 'alreadyClosed' } as const;
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, f.customerId));
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.flagClose', targetType: 'customer', targetId: f.customerId,
      details: { name: c?.name ?? '', kind: closed[0].kind, reason } });
    return { ok: true, id: flagId } as const;
  });
}

export interface Warnings { openFlags: Flag[]; licenceExpired: boolean; licenceExpires: string | null }

/** What warns before a rental now (ST-08.4): the open flags and an expired driving licence. */
export async function warningsFor(customerId: string, q: Tx | typeof db = db): Promise<Warnings | null> {
  if (!UUID.test(customerId)) return null;
  const [c] = await q.select({ licenceExpires: customer.licenceExpires }).from(customer).where(eq(customer.id, customerId));
  if (!c) return null;
  const openFlags = (await flagsOf(customerId, q)).filter((f) => !f.closedAt);
  return { openFlags, licenceExpired: c.licenceExpires < todayColombo(), licenceExpires: c.licenceExpires };
}

export type GoAheadResult = { ok: true; id: string }
  | { error: 'notAllowed' | 'notFound' | 'reasonMissing' | 'tooLong' | 'stale' | 'nothingToCheck' | 'licenceNotAllowed' };

/**
 * Records a decision to continue despite the warnings shown (ST-08.4). `shown` is what the screen showed: if a flag was
 * added or closed meanwhile, or the licence changed, nothing is saved. A flag needs "Go ahead despite a customer flag";
 * an expired licence needs "Override expired-document warnings" (it stays expired). Logged as customer.goAhead.
 */
export async function goAhead(actorId: string, customerId: string, input: { reason: string; shownFlagIds: string[]; shownLicenceExpired: boolean }): Promise<GoAheadResult> {
  if (!UUID.test(customerId)) return { error: 'notFound' };
  const reason = tidy(input.reason);
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > TEXT_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'customerAccess'))) return { error: 'notAllowed' } as const;
    await lockCustomer(tx, customerId);
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, customerId));
    if (!c) return { error: 'notFound' } as const;
    const now = (await warningsFor(customerId, tx))!;
    const ids = now.openFlags.map((f) => f.id).sort();
    const shown = [...new Set(input.shownFlagIds)].sort();
    if (ids.join() !== shown.join() || now.licenceExpired !== input.shownLicenceExpired) return { error: 'stale' } as const;
    if (!ids.length && !now.licenceExpired) return { error: 'nothingToCheck' } as const;
    if (ids.length && !(await actorMay(tx, actorId, 'proceedDespiteFlag'))) return { error: 'notAllowed' } as const;
    if (now.licenceExpired && !(await actorMay(tx, actorId, 'overrideExpiredDocuments'))) return { error: 'licenceNotAllowed' } as const;
    const [g] = await tx.insert(customerGoAhead).values({ customerId, flagIds: ids, licenceExpired: now.licenceExpired, reason, createdBy: actorId })
      .returning({ id: customerGoAhead.id });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.goAhead', targetType: 'customer', targetId: customerId,
      details: { name: c.name, flags: ids.length, licenceExpired: now.licenceExpired, reason } });
    return { ok: true, id: g.id } as const;
  });
}

/** A customer's recorded decisions to continue, newest first, with who made them. */
export async function goAheadsOf(customerId: string) {
  if (!UUID.test(customerId)) return [];
  return db.select({ id: customerGoAhead.id, reason: customerGoAhead.reason, licenceExpired: customerGoAhead.licenceExpired, flagIds: customerGoAhead.flagIds,
    createdAt: customerGoAhead.createdAt, byName: user.name }).from(customerGoAhead).leftJoin(user, eq(user.id, customerGoAhead.createdBy))
    .where(eq(customerGoAhead.customerId, customerId)).orderBy(desc(customerGoAhead.createdAt));
}

