import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { approvalDecision, approvalRequest, auditEvent, customer, permissionGrant, rental, rentalEvent, rentalVehicleSegment, user, vehicle } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { approvedChanges, rentalEstimate, rentalTerms } from '../rentals/rentals';
import { rentalNumber } from '../rentals/agreements';

// Asking for a different price and deciding it (05.7, 10.1 to 10.4; ST-05.7, ST-10.1 to ST-10.3; system design 3.2
// "Asking for a different price" and "No self-approval", 8.4; Confirmed 11 Nov 2026). Anyone with Customer access asks
// (a new daily rate for the whole rental, LKR 1 to 100,000, or a discount, LKR 1 up to the estimate), with a reason, while
// the rental is saved or out; one request waits at a time; its sender may withdraw it. "Change agreed rental price or
// grant discount" decides, never on one's own request (the primary owner may: self-approved). A rate above a partner
// car's package also needs "Share an above-package price on a partner car" and the partner's rupees of the extra, with
// a reason. Approving before handover puts the signed agreement out of date. Both tables are insert-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const RATE_RANGE = [1, 100_000] as const;
export const TEXT_MAX = 500;
export const KINDS = ['rate', 'discount'] as const;
export type Kind = (typeof KINDS)[number];
const OPEN = ['draft', 'active'];
const tidy = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ');
type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

async function actor(q: Q, id: string) {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, id));
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, id))).map((g) => g.p));
  return { a, may: (p: Permission) => !!a && allows(a, granted, p) };
}
const lockRental = (q: Q, id: string) => q.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${id.toLowerCase()}`}))`);

/** The car's package rate, whether it is a partner car, the days, and the approved terms now. */
async function rentalPrices(q: Q, rentalId: string) {
  const t = await rentalTerms(rentalId, q);
  if (!t) return null;
  const seg = t.segments[0];
  const changes = await approvedChanges(rentalId, q);
  const est = await rentalEstimate(rentalId, undefined, q);
  return { days: t.days, packageRate: seg.dailyRate, partner: seg.commissionPercent !== null, commissionPercent: seg.commissionPercent,
    dailyRate: changes.rate?.dailyRate ?? seg.dailyRate, estimate: est?.total ?? 0 };
}

export type AskError = 'notAllowed' | 'notFound' | 'notOpen' | 'kindInvalid' | 'amountInvalid' | 'reasonMissing' | 'tooLong' | 'sameRate' | 'alreadyWaiting';

/** Sends a request for a different price on a saved or out rental. Logged approval.request and a rental_event. */
export async function askForPrice(actorId: string, rentalId: string, input: { kind: Kind; amount: number; reason: string }): Promise<{ ok: true; id: string } | { error: AskError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (!(KINDS as readonly string[]).includes(input.kind)) return { error: 'kindInvalid' };
  if (!Number.isSafeInteger(input.amount) || input.amount < 1 || (input.kind === 'rate' && input.amount > RATE_RANGE[1])) return { error: 'amountInvalid' };
  // The requester's reason is kept word for word (3.2): only the ends are trimmed.
  const reason = String(input.reason ?? '').trim();
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > TEXT_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await actor(tx, actorId)).may('customerAccess')) return { error: 'notAllowed' } as const;
    await lockRental(tx, rentalId);
    const [r] = await tx.select({ status: rental.status, number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    if (!OPEN.includes(r.status)) return { error: 'notOpen' } as const;
    if (await waitingFor(rentalId, tx)) return { error: 'alreadyWaiting' } as const;
    const p = (await rentalPrices(tx, rentalId))!;
    // A rate equal to the one agreed changes nothing: refused as a typing mistake (Derived control, 11 Nov 2026).
    if (input.kind === 'rate' && input.amount === p.dailyRate) return { error: 'sameRate' } as const;
    if (input.kind === 'discount' && input.amount > p.estimate) return { error: 'amountInvalid' } as const;
    const [row] = await tx.insert(approvalRequest).values({ rentalId, kind: input.kind, newDailyRate: input.kind === 'rate' ? input.amount : null,
      discount: input.kind === 'discount' ? input.amount : null, rateWas: p.dailyRate, estimateWas: p.estimate, reason, createdBy: actorId }).returning({ id: approvalRequest.id });
    const details = { kind: input.kind, amount: input.amount, rateWas: p.dailyRate, reason };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'priceRequest', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'approval.request', targetType: 'rental', targetId: rentalId, details: { name: r.name, number: rentalNumber(r.number), ...details } });
    return { ok: true, id: row.id } as const;
  });
}

export interface Waiting {
  id: string; rentalId: string; kind: Kind; newDailyRate: number | null; discount: number | null; rateWas: number; estimateWas: number; reason: string;
  createdAt: Date; createdBy: string; byName: string; days: number; packageRate: number; partner: boolean; commissionPercent: number | null;
  effect: number; aboveTheirPackage: boolean; extra: number;
}

function shape(r: { id: string; rentalId: string; kind: string; newDailyRate: number | null; discount: number | null; rateWas: number; estimateWas: number; reason: string; createdAt: Date; createdBy: string; byName: string },
  p: { days: number; packageRate: number; partner: boolean; commissionPercent: number | null }): Waiting {
  const kind = r.kind as Kind;
  const rate = r.newDailyRate === null ? null : Number(r.newDailyRate);
  const discount = r.discount === null ? null : Number(r.discount);
  const effect = kind === 'rate' ? (rate! - Number(r.rateWas)) * p.days : -discount!;
  const aboveTheirPackage = kind === 'rate' && p.partner && rate! > p.packageRate;
  return { ...r, kind, newDailyRate: rate, discount, rateWas: Number(r.rateWas), estimateWas: Number(r.estimateWas), ...p, effect, aboveTheirPackage,
    extra: aboveTheirPackage ? (rate! - p.packageRate) * p.days : 0 };
}

const requestCols = { id: approvalRequest.id, rentalId: approvalRequest.rentalId, kind: approvalRequest.kind, newDailyRate: approvalRequest.newDailyRate, discount: approvalRequest.discount,
  rateWas: approvalRequest.rateWas, estimateWas: approvalRequest.estimateWas, reason: approvalRequest.reason, createdAt: approvalRequest.createdAt, createdBy: approvalRequest.createdBy, byName: user.name };

/** The request waiting on a rental, if any (at most one). */
export async function waitingFor(rentalId: string, q: Q = db): Promise<Waiting | null> {
  if (!UUID.test(rentalId)) return null;
  const [r] = await q.select(requestCols).from(approvalRequest).innerJoin(user, eq(user.id, approvalRequest.createdBy))
    .leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id)).where(and(eq(approvalRequest.rentalId, rentalId), isNull(approvalDecision.id))).limit(1);
  if (!r) return null;
  const p = (await rentalPrices(q, rentalId))!;
  return shape(r, p);
}

/** What the approvals changed on a rental, for the bill and (with the day close, Phase 3) the earnings. */
export async function approvedTerms(rentalId: string) {
  const p = await rentalPrices(db, rentalId);
  if (!p) return null;
  const c = await approvedChanges(rentalId);
  const above = p.partner && p.dailyRate > p.packageRate;
  return { dailyRate: p.dailyRate, packageRate: p.packageRate, discount: c.discount, extra: above ? (p.dailyRate - p.packageRate) * p.days : 0,
    partnerExtra: c.rate?.partnerExtra ?? null, splitReason: c.rate?.splitReason ?? null };
}

export type DecideError = 'notAllowed' | 'notFound' | 'decided' | 'notOpen' | 'ownRequest' | 'noteMissing' | 'tooLong' | 'splitMissing' | 'splitInvalid'
  | 'splitReasonMissing' | 'splitNotAllowed' | 'amountInvalid';

/** Approves or rejects a waiting request, under the rental's lock. Logged approval.approve or approval.reject and a
 *  rental_event with the requester's reason, the note and any split. */
export async function decide(actorId: string, requestId: string, input: { approve: boolean; note?: string; partnerExtra?: number; splitReason?: string }): Promise<{ ok: true } | { error: DecideError }> {
  if (!UUID.test(requestId)) return { error: 'notFound' };
  const note = tidy(input.note);
  const splitReason = tidy(input.splitReason);
  if (!input.approve && !note) return { error: 'noteMissing' };
  if (note.length > TEXT_MAX || splitReason.length > TEXT_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    const me = await actor(tx, actorId);
    if (!me.may('changePriceOrDiscount')) return { error: 'notAllowed' } as const;
    const [req] = await tx.select({ rentalId: approvalRequest.rentalId }).from(approvalRequest).where(eq(approvalRequest.id, requestId));
    if (!req) return { error: 'notFound' } as const;
    await lockRental(tx, req.rentalId);
    const w = await waitingFor(req.rentalId, tx);
    if (!w || w.id !== requestId) return { error: 'decided' } as const;
    const [r] = await tx.select({ status: rental.status, number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, w.rentalId));
    if (!OPEN.includes(r.status)) return { error: 'notOpen' } as const;
    const selfApproved = w.createdBy === actorId;
    if (selfApproved && me.a!.role !== 'owner') return { error: 'ownRequest' } as const;
    let partnerExtra: number | null = null;
    if (input.approve && w.aboveTheirPackage) {
      if (input.partnerExtra === undefined || input.partnerExtra === null) return { error: 'splitMissing' } as const;
      if (!Number.isSafeInteger(input.partnerExtra) || input.partnerExtra < 0 || input.partnerExtra > w.extra) return { error: 'splitInvalid' } as const;
      if (!splitReason) return { error: 'splitReasonMissing' } as const;
      if (!me.may('sharePartnerCarSurcharge')) return { error: 'splitNotAllowed' } as const;
      partnerExtra = input.partnerExtra;
    }
    if (input.approve && w.kind === 'discount') {
      const p = (await rentalPrices(tx, w.rentalId))!;
      if (w.discount! > p.estimate) return { error: 'amountInvalid' } as const;
    }
    const outcome = input.approve ? 'approved' : 'rejected';
    await tx.insert(approvalDecision).values({ requestId, outcome, note: note || null, partnerExtra, splitReason: partnerExtra === null ? null : splitReason,
      selfApproved, createdBy: actorId });
    // Before handover the printed terms change: the signed agreement must be printed and signed again (11 Nov 2026).
    // (Only once step 4 is saved: before that nothing can be printed.)
    if (input.approve && r.status === 'draft') await tx.update(rental).set({ termsSetAt: sql`now()`, updatedAt: sql`now()` }).where(and(eq(rental.id, w.rentalId), sql`${rental.termsSetAt} is not null`));
    const details = { outcome, kind: w.kind, amount: w.kind === 'rate' ? w.newDailyRate : w.discount, effect: w.effect, reason: w.reason, requestedBy: w.byName,
      ...(note ? { note } : {}), ...(partnerExtra !== null ? { partnerExtra, extra: w.extra, splitReason } : {}), ...(selfApproved ? { selfApproved } : {}) };
    await tx.insert(rentalEvent).values({ rentalId: w.rentalId, kind: 'approval', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: input.approve ? 'approval.approve' : 'approval.reject', targetType: 'rental', targetId: w.rentalId,
      details: { name: r.name, number: rentalNumber(r.number), ...details } });
    return { ok: true } as const;
  });
}

/** The sender withdraws their own waiting request (recorded), so they can send another. */
export async function withdraw(actorId: string, requestId: string): Promise<{ ok: true } | { error: 'notAllowed' | 'notFound' | 'notYours' | 'decided' }> {
  if (!UUID.test(requestId)) return { error: 'notFound' };
  return db.transaction(async (tx) => {
    if (!(await actor(tx, actorId)).may('customerAccess')) return { error: 'notAllowed' } as const;
    const [req] = await tx.select({ rentalId: approvalRequest.rentalId, createdBy: approvalRequest.createdBy }).from(approvalRequest).where(eq(approvalRequest.id, requestId));
    if (!req) return { error: 'notFound' } as const;
    if (req.createdBy !== actorId) return { error: 'notYours' } as const;
    await lockRental(tx, req.rentalId);
    const w = await waitingFor(req.rentalId, tx);
    if (!w || w.id !== requestId) return { error: 'decided' } as const;
    await tx.insert(approvalDecision).values({ requestId, outcome: 'withdrawn', createdBy: actorId });
    const [r] = await tx.select({ number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, req.rentalId));
    await tx.insert(rentalEvent).values({ rentalId: req.rentalId, kind: 'approvalWithdrawn', details: { kind: w.kind }, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'approval.withdraw', targetType: 'rental', targetId: req.rentalId, details: { name: r.name, number: rentalNumber(r.number) } });
    return { ok: true } as const;
  });
}

export type ListStatus = 'waiting' | 'approved' | 'rejected';
export interface ApprovalRow extends Waiting {
  number: number; registration: string; model: string; customerName: string; outcome: string | null; note: string | null; partnerExtra: number | null;
  splitReason: string | null; selfApproved: boolean; decidedAt: Date | null; decidedByName: string | null; mine: boolean;
}

/** The approvals screen (10.1): waiting, approved or rejected requests, newest first. A person never sees their own
 *  request as one to decide; the primary owner sees theirs (self-approved). Withdrawn requests are not listed. */
export async function approvalsList(actorId: string, status: ListStatus): Promise<ApprovalRow[]> {
  const me = await actor(db, actorId);
  const decider = sql`(select name from "user" where id = ${approvalDecision.createdBy})`;
  const rows = await db.select({ ...requestCols, number: rental.number, customerName: customer.name, outcome: approvalDecision.outcome, note: approvalDecision.note,
    partnerExtra: approvalDecision.partnerExtra, splitReason: approvalDecision.splitReason, selfApproved: approvalDecision.selfApproved, decidedAt: approvalDecision.createdAt,
    decidedByName: sql<string | null>`${decider}` })
    .from(approvalRequest).innerJoin(user, eq(user.id, approvalRequest.createdBy)).innerJoin(rental, eq(rental.id, approvalRequest.rentalId))
    .innerJoin(customer, eq(customer.id, rental.customerId)).leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(status === 'waiting'
      ? and(isNull(approvalDecision.id), inArray(rental.status, OPEN), me.a?.role === 'owner' ? sql`true` : sql`${approvalRequest.createdBy} <> ${actorId}`)
      : eq(approvalDecision.outcome, status)).orderBy(desc(approvalRequest.createdAt)).limit(100);
  const visible = rows;
  const ids = [...new Set(visible.map((r) => r.rentalId))];
  const cars = ids.length ? await db.selectDistinctOn([rentalVehicleSegment.rentalId], { rentalId: rentalVehicleSegment.rentalId, registration: vehicle.registration, model: vehicle.model })
    .from(rentalVehicleSegment).innerJoin(vehicle, eq(vehicle.id, rentalVehicleSegment.vehicleId)).where(inArray(rentalVehicleSegment.rentalId, ids))
    .orderBy(rentalVehicleSegment.rentalId, desc(rentalVehicleSegment.position)) : [];
  const out: ApprovalRow[] = [];
  for (const r of visible) {
    const p = (await rentalPrices(db, r.rentalId))!;
    const car = cars.find((c) => c.rentalId === r.rentalId);
    out.push({ ...shape(r, p), number: r.number, registration: car?.registration ?? '', model: car?.model ?? '', customerName: r.customerName, outcome: r.outcome,
      note: r.note, partnerExtra: r.partnerExtra === null ? null : Number(r.partnerExtra), splitReason: r.splitReason, selfApproved: r.selfApproved ?? false,
      decidedAt: r.decidedAt, decidedByName: r.decidedByName, mine: r.createdBy === actorId });
  }
  return out;
}

/** How many requests wait for this person to decide (the menu's Approvals count). */
export async function waitingCount(actorId: string): Promise<number> {
  const me = await actor(db, actorId);
  if (!me.may('changePriceOrDiscount')) return 0;
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(approvalRequest).leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .innerJoin(rental, eq(rental.id, approvalRequest.rentalId))
    .where(and(isNull(approvalDecision.id), inArray(rental.status, OPEN), me.a?.role === 'owner' ? sql`true` : sql`${approvalRequest.createdBy} <> ${actorId}`));
  return r?.n ?? 0;
}

/** Closes the request still waiting on a rental that ends without it (freed as not collected, or cancelled; 11 Nov
 *  2026), inside the caller's transaction, which holds the rental's lock. Recorded in the rental's history. */
export async function closeWaiting(tx: Q, rentalId: string, actorId: string): Promise<void> {
  const w = await waitingFor(rentalId, tx);
  if (!w) return;
  await tx.insert(approvalDecision).values({ requestId: w.id, outcome: 'closed', createdBy: actorId });
  await tx.insert(rentalEvent).values({ rentalId, kind: 'approvalClosed', details: { kind: w.kind }, createdBy: actorId });
}
