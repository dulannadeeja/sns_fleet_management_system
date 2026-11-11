import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { approvalDecision, approvalRequest, auditEvent, charge, customer, permissionGrant, rental, rentalEvent, rentalVehicleSegment, user, vehicle } from '../../db/schema';
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
/** Requests made at return (#63): garage days to approve, and a bill line on a partner car whose split the admin decides. */
export type AnyKind = Kind | 'garageDays' | 'split' | 'correction';
const PRICE_KINDS = ['rate', 'discount'];
/** Who may decide each kind (3.2): a price change, or damage, accessory and garage-day money ("Allocate damage proceeds"). */
export const decidesWith = (kind: string): Permission => (PRICE_KINDS.includes(kind) ? 'changePriceOrDiscount' : kind === 'correction' ? 'correctPayment' : 'allocateDamageProceeds');
const ALL_KINDS = ['rate', 'discount', 'garageDays', 'split', 'correction'] as const;
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
  return { days: t.days, packageRate: seg.dailyRate, partner: seg.commissionPercent !== null, commissionPercent: seg.commissionPercent, garageRate: seg.garageDayCharge,
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
  id: string; rentalId: string; kind: AnyKind; newDailyRate: number | null; discount: number | null; garageDays: number | null; chargeId: string | null; chargeKind: string | null; chargeAmount: number | null; rateWas: number; estimateWas: number; reason: string;
  /** A payment correction (#65): the payment's number, what is wrong and what it should be. */
  paymentNumber: number | null; fix: string | null; newAmount: number | null; newMethod: string | null; newReference: string | null; toRentalNumber: number | null;
  createdAt: Date; createdBy: string; byName: string; days: number; packageRate: number; partner: boolean; commissionPercent: number | null;
  effect: number; aboveTheirPackage: boolean; extra: number;
}

function shape(r: { id: string; rentalId: string; kind: string; newDailyRate: number | null; discount: number | null; rateWas: number; estimateWas: number; reason: string; createdAt: Date; createdBy: string; byName: string;
  garageDays: number | null; chargeId: string | null; chargeKind: string | null; chargeAmount: number | null;
  paymentNumber: number | null; fix: string | null; newAmount: number | null; newMethod: string | null; newReference: string | null; toRentalNumber: number | null },
  p: { days: number; packageRate: number; partner: boolean; commissionPercent: number | null; garageRate?: number }): Waiting {
  const kind = r.kind as AnyKind;
  const rate = r.newDailyRate === null ? null : Number(r.newDailyRate);
  const discount = r.discount === null ? null : Number(r.discount);
  const chargeAmount = r.chargeAmount === null ? null : Number(r.chargeAmount);
  const effect = kind === 'rate' ? (rate! - Number(r.rateWas)) * p.days : kind === 'discount' ? -discount! : kind === 'garageDays' ? (r.garageDays ?? 0) * (p.garageRate ?? 0) : 0;
  const aboveTheirPackage = kind === 'rate' && p.partner && rate! > p.packageRate;
  return { ...r, kind, newDailyRate: rate, discount, chargeAmount, newAmount: r.newAmount === null ? null : Number(r.newAmount), toRentalNumber: r.toRentalNumber === null ? null : Number(r.toRentalNumber), rateWas: Number(r.rateWas), estimateWas: Number(r.estimateWas), ...p, effect, aboveTheirPackage,
    extra: aboveTheirPackage ? (rate! - p.packageRate) * p.days : 0 };
}

const requestCols = { id: approvalRequest.id, rentalId: approvalRequest.rentalId, kind: approvalRequest.kind, newDailyRate: approvalRequest.newDailyRate, discount: approvalRequest.discount,
  garageDays: approvalRequest.days, chargeId: approvalRequest.chargeId, chargeKind: sql<string | null>`(select kind from charge where id = ${approvalRequest.chargeId})`,
  chargeAmount: sql<number | null>`(select amount from charge where id = ${approvalRequest.chargeId})`,
  paymentNumber: sql<number | null>`(select number from payment where id = ${approvalRequest.paymentId})`, fix: approvalRequest.fix, newAmount: approvalRequest.newAmount,
  newMethod: approvalRequest.newMethod, newReference: approvalRequest.newReference, toRentalNumber: sql<number | null>`(select number from rental where id = ${approvalRequest.toRentalId})`,
  rateWas: approvalRequest.rateWas, estimateWas: approvalRequest.estimateWas, reason: approvalRequest.reason, createdAt: approvalRequest.createdAt, createdBy: approvalRequest.createdBy, byName: user.name };

/** The price request waiting on a rental, if any (at most one; garage-day and split requests are listed apart). */
export async function waitingFor(rentalId: string, q: Q = db): Promise<Waiting | null> {
  if (!UUID.test(rentalId)) return null;
  const [r] = await q.select(requestCols).from(approvalRequest).innerJoin(user, eq(user.id, approvalRequest.createdBy))
    .leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(and(eq(approvalRequest.rentalId, rentalId), isNull(approvalDecision.id), inArray(approvalRequest.kind, PRICE_KINDS))).limit(1);
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
  | 'splitReasonMissing' | 'splitNotAllowed' | 'amountInvalid' | 'notRejectable' | import('../money/corrections').CorrectionError;

/** Approves or rejects a waiting request, under the rental's lock. Logged approval.approve or approval.reject and a
 *  rental_event with the requester's reason, the note and any split. */
export async function decide(actorId: string, requestId: string, input: { approve: boolean; note?: string; partnerExtra?: number; splitReason?: string }): Promise<{ ok: true } | { error: DecideError }> {
  if (!UUID.test(requestId)) return { error: 'notFound' };
  const note = tidy(input.note);
  const splitReason = tidy(input.splitReason);
  if (!input.approve && !note) return { error: 'noteMissing' };
  if (note.length > TEXT_MAX || splitReason.length > TEXT_MAX) return { error: 'tooLong' };
  // A payment correction (#65) is decided by the money module, under the customer's lock first.
  const [kind] = await db.select({ kind: approvalRequest.kind }).from(approvalRequest).where(eq(approvalRequest.id, requestId));
  if (kind?.kind === 'correction') {
    const { decideCorrection } = await import('../money/corrections');
    return decideCorrection(actorId, requestId, { approve: input.approve, note: input.note });
  }
  return db.transaction(async (tx) => {
    const me = await actor(tx, actorId);
    const [req] = await tx.select({ rentalId: approvalRequest.rentalId, kind: approvalRequest.kind }).from(approvalRequest).where(eq(approvalRequest.id, requestId));
    if (!req) return { error: 'notFound' } as const;
    if (!me.may(decidesWith(req.kind))) return { error: 'notAllowed' } as const;
    await lockRental(tx, req.rentalId);
    const w = await requestById(tx, requestId);
    if (!w) return { error: 'decided' } as const;
    const [r] = await tx.select({ status: rental.status, number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, w.rentalId));
    const price = PRICE_KINDS.includes(w.kind);
    if (price ? !OPEN.includes(r.status) : r.status !== 'returned') return { error: 'notOpen' } as const;
    const selfApproved = w.createdBy === actorId;
    if (selfApproved && me.a!.role !== 'owner') return { error: 'ownRequest' } as const;
    // A line's split is a decision to make, never to refuse: only approving (with the partner's rupees) settles it.
    if (w.kind === 'split' && !input.approve) return { error: 'notRejectable' } as const;
    if (!price) return decideReturnRequest(tx, actorId, w, r, input, note, splitReason, selfApproved);
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

/** A waiting request by its id, of any kind. */
async function requestById(q: Q, requestId: string): Promise<Waiting | null> {
  const [r] = await q.select(requestCols).from(approvalRequest).innerJoin(user, eq(user.id, approvalRequest.createdBy))
    .leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id)).where(and(eq(approvalRequest.id, requestId), isNull(approvalDecision.id)));
  if (!r) return null;
  return shape(r, (await rentalPrices(q, r.rentalId))!);
}

/** Garage days (approve with, on a partner car, the partner's rupees; or reject with a note) and the split of a bill
 *  line on a partner car (the partner's rupees, 0 to the whole line, with a reason). Inside decide's transaction. */
async function decideReturnRequest(tx: Q, actorId: string, w: Waiting, r: { number: number; name: string }, input: { approve: boolean; partnerExtra?: number },
  note: string, splitReason: string, selfApproved: boolean): Promise<{ ok: true } | { error: DecideError }> {
  const amount = w.kind === 'garageDays' ? w.effect : w.chargeAmount ?? 0;
  let partnerExtra: number | null = null;
  if (input.approve && (w.kind === 'split' || w.partner)) {
    if (input.partnerExtra === undefined || input.partnerExtra === null) return { error: 'splitMissing' };
    if (!Number.isSafeInteger(input.partnerExtra) || input.partnerExtra < 0 || input.partnerExtra > amount) return { error: 'splitInvalid' };
    if (!splitReason) return { error: 'splitReasonMissing' };
    partnerExtra = input.partnerExtra;
  }
  const outcome = input.approve ? 'approved' : 'rejected';
  await tx.insert(approvalDecision).values({ requestId: w.id, outcome, note: note || null, partnerExtra, splitReason: partnerExtra === null ? null : splitReason, selfApproved, createdBy: actorId });
  // Approved garage days go on the bill: days × the car's saved garage-day rate; on a partner car with the split set now.
  if (input.approve && w.kind === 'garageDays') {
    await tx.insert(charge).values({ rentalId: w.rentalId, kind: 'garageDays', amount, details: { days: w.garageDays, rate: amount / (w.garageDays || 1) }, reason: w.reason,
      allocation: w.partner ? 'split' : 'sns', partnerShare: w.partner ? partnerExtra : null, createdBy: actorId });
  }
  const details = { outcome, kind: w.kind, amount, reason: w.reason, requestedBy: w.byName, ...(w.garageDays ? { days: w.garageDays } : {}), ...(note ? { note } : {}),
    ...(partnerExtra !== null ? { partnerExtra, splitReason } : {}), ...(selfApproved ? { selfApproved } : {}) };
  await tx.insert(rentalEvent).values({ rentalId: w.rentalId, kind: 'approval', details, createdBy: actorId });
  await tx.insert(auditEvent).values({ createdBy: actorId, action: input.approve ? 'approval.approve' : 'approval.reject', targetType: 'rental', targetId: w.rentalId,
    details: { name: r.name, number: rentalNumber(r.number), ...details } });
  return { ok: true };
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
  const mayKinds = ALL_KINDS.filter((k) => me.may(decidesWith(k)));
  if (!mayKinds.length) return [];
  const decider = sql`(select name from "user" where id = ${approvalDecision.createdBy})`;
  const rows = await db.select({ ...requestCols, number: rental.number, customerName: customer.name, outcome: approvalDecision.outcome, note: approvalDecision.note,
    partnerExtra: approvalDecision.partnerExtra, splitReason: approvalDecision.splitReason, selfApproved: approvalDecision.selfApproved, decidedAt: approvalDecision.createdAt,
    decidedByName: sql<string | null>`${decider}` })
    .from(approvalRequest).innerJoin(user, eq(user.id, approvalRequest.createdBy)).innerJoin(rental, eq(rental.id, approvalRequest.rentalId))
    .innerJoin(customer, eq(customer.id, rental.customerId)).leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(status === 'waiting'
      ? and(isNull(approvalDecision.id), sql`((${approvalRequest.kind} in ('rate', 'discount') and ${rental.status} in ('draft', 'active')) or (${approvalRequest.kind} in ('garageDays', 'split') and ${rental.status} = 'returned') or ${approvalRequest.kind} = 'correction')`,
        inArray(approvalRequest.kind, mayKinds), me.a?.role === 'owner' ? sql`true` : sql`${approvalRequest.createdBy} <> ${actorId}`)
      : and(eq(approvalDecision.outcome, status), inArray(approvalRequest.kind, mayKinds))).orderBy(desc(approvalRequest.createdAt)).limit(100);
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
  const mayKinds = ALL_KINDS.filter((k) => me.may(decidesWith(k)));
  if (!mayKinds.length) return 0;
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(approvalRequest).leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .innerJoin(rental, eq(rental.id, approvalRequest.rentalId))
    .where(and(isNull(approvalDecision.id), inArray(approvalRequest.kind, mayKinds),
      sql`((${approvalRequest.kind} in ('rate', 'discount') and ${rental.status} in ('draft', 'active')) or (${approvalRequest.kind} in ('garageDays', 'split') and ${rental.status} = 'returned') or ${approvalRequest.kind} = 'correction')`,
      me.a?.role === 'owner' ? sql`true` : sql`${approvalRequest.createdBy} <> ${actorId}`));
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
