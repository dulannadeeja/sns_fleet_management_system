import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { approvalDecision, approvalRequest, auditEvent, cashMovement, customer, depositMovement, depositSettlement, payment, paymentAdjustment, paymentAllocation,
  permissionGrant, reconciliation, rental, rentalEvent, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { rentalNumber } from '../rentals/agreements';
import { moneyOne } from './figures';
import { amountDue, depositReceivedOn, METHODS, PAYABLE_STATES, paymentNumber, type Method } from './payments';

// Asking for a payment correction and deciding it (09.5, 10.1, 10.2; ST-09.2; system design 8.3, Confirmed 11 Nov 2026).
// Anyone with Customer access asks to correct one payment's part on one rental: the amount (to 0 when the money never
// came; never above the bill, or the estimate before return), the way (cash, bank, card), the reference, or the wrong
// rental (bill payments only; same customer, up to what is unpaid there). A deposit payment only before its deposit is
// settled. One request waits per part. An admin with "Correct a recorded payment" approves or rejects (a note) on
// Approvals; nobody decides their own, except the primary owner (self-approved). The payment is never changed: an
// approved amount or rental fix is a dated `payment_adjustment` line (a deposit one, a `deposit_movement` `adjusted`);
// a cash difference is a drawer line; a new bank or card way or reference starts its check waiting. All insert-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const FIXES = ['amount', 'method', 'reference', 'rental'] as const;
export type Fix = (typeof FIXES)[number];
export const REASON_MAX = 500;
export const REFERENCE_MAX = 80;
export const AMOUNT_MAX = 10_000_000;
type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export interface Part {
  paymentId: string; number: number; customerId: string; for: 'bill' | 'deposit'; method: Method; reference: string | null; amount: number; paymentTotal: number;
}

/** The newest approved way and reference of a payment (its own, until a correction is approved). */
async function wayOf(q: Q, paymentId: string, method: Method, reference: string | null) {
  const [c] = await q.select({ fix: approvalRequest.fix, newMethod: approvalRequest.newMethod, newReference: approvalRequest.newReference }).from(approvalRequest)
    .innerJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(and(eq(approvalRequest.paymentId, paymentId), eq(approvalDecision.outcome, 'approved'), inArray(approvalRequest.fix, ['method', 'reference'])))
    .orderBy(desc(approvalDecision.createdAt)).limit(1);
  if (!c) return { method, reference };
  return c.fix === 'method' ? { method: c.newMethod as Method, reference: c.newReference } : { method, reference: c.newReference };
}

/** One payment's part on one rental, as corrected so far. */
export async function partOf(q: Q, paymentId: string, rentalId: string): Promise<Part | null> {
  if (!UUID.test(paymentId) || !UUID.test(rentalId)) return null;
  const [p] = await q.select({ id: payment.id, number: payment.number, customerId: payment.customerId, method: payment.method, reference: payment.reference, amount: payment.amount })
    .from(payment).where(eq(payment.id, paymentId));
  if (!p) return null;
  const n = (v: unknown) => Number(v ?? 0);
  const [b] = await q.select({ rows: sql<number>`count(*)::int`, sum: sql<string>`coalesce(sum(${paymentAllocation.amount}), 0)` }).from(paymentAllocation)
    .where(and(eq(paymentAllocation.paymentId, paymentId), eq(paymentAllocation.rentalId, rentalId)));
  const [j] = await q.select({ rows: sql<number>`count(*)::int`, sum: sql<string>`coalesce(sum(${paymentAdjustment.amount}), 0)` }).from(paymentAdjustment)
    .where(and(eq(paymentAdjustment.paymentId, paymentId), eq(paymentAdjustment.rentalId, rentalId)));
  const [d] = await q.select({ rows: sql<number>`count(*)::int`, sum: sql<string>`coalesce(sum(${depositMovement.amount}), 0)` }).from(depositMovement)
    .where(and(eq(depositMovement.paymentId, paymentId), eq(depositMovement.rentalId, rentalId), inArray(depositMovement.kind, ['received', 'adjusted'])));
  const kind = b.rows + j.rows > 0 ? 'bill' : d.rows > 0 ? 'deposit' : null;
  if (!kind) return null;
  const [t] = await q.select({ bill: sql<string>`coalesce((select sum(amount) from payment_adjustment where payment_id = ${paymentId}), 0)`,
    dep: sql<string>`coalesce((select sum(amount) from deposit_movement where payment_id = ${paymentId} and kind = 'adjusted'), 0)` }).from(payment).where(eq(payment.id, paymentId));
  const way = await wayOf(q, paymentId, p.method as Method, p.reference);
  return { paymentId: p.id, number: p.number, customerId: p.customerId, for: kind, ...way, amount: kind === 'bill' ? n(b.sum) + n(j.sum) : n(d.sum),
    paymentTotal: n(p.amount) + n(t.bill) + n(t.dep) };
}

export interface CorrectionInput { fix: Fix; newAmount?: number; newMethod?: Method; newReference?: string; toRentalId?: string }
export type CorrectionError = 'newAmountInvalid' | 'sameAmount' | 'overBill' | 'overDeposit' | 'depositSettled' | 'methodInvalid' | 'sameMethod' | 'referenceMissing'
  | 'cashNoReference' | 'sameReference' | 'depositNotMovable' | 'rentalInvalid' | 'nothingToMove';

/** Whether a fix can be made now (checked when asked and again when approved, under the customer's lock). */
async function checkFix(q: Q, part: Part, rentalId: string, input: CorrectionInput): Promise<CorrectionError | null> {
  if (part.for === 'deposit') {
    const [s] = await q.select({ id: depositSettlement.id }).from(depositSettlement).where(eq(depositSettlement.rentalId, rentalId));
    if (s) return 'depositSettled';
  }
  const ref = String(input.newReference ?? '').trim();
  if (input.fix === 'amount') {
    const a = input.newAmount;
    if (!Number.isSafeInteger(a) || a! < 0 || a! > AMOUNT_MAX) return 'newAmountInvalid';
    if (a === part.amount) return 'sameAmount';
    const more = a! - part.amount;
    if (more > 0 && part.for === 'bill') {
      const due = await amountDue(q, rentalId);
      const f = await moneyOne(q, rentalId);
      if (due === null || more > due - f.paid - f.writtenOff) return 'overBill';
    }
    if (more > 0 && part.for === 'deposit') {
      const [r] = await q.select({ deposit: rental.depositAmount }).from(rental).where(eq(rental.id, rentalId));
      if (r.deposit === null || (await depositReceivedOn(q, rentalId)) + more > r.deposit) return 'overDeposit';
    }
    return null;
  }
  if (input.fix === 'method') {
    if (!(METHODS as readonly string[]).includes(input.newMethod as string)) return 'methodInvalid';
    if (input.newMethod === part.method) return 'sameMethod';
    if (input.newMethod !== 'cash' && !ref) return 'referenceMissing';
    return null;
  }
  if (input.fix === 'reference') {
    if (part.method === 'cash') return 'cashNoReference';
    if (!ref) return 'referenceMissing';
    if (ref.toLowerCase() === String(part.reference ?? '').toLowerCase()) return 'sameReference';
    return null;
  }
  if (part.for !== 'bill') return 'depositNotMovable';
  if (!input.toRentalId || !UUID.test(input.toRentalId) || input.toRentalId.toLowerCase() === rentalId.toLowerCase()) return 'rentalInvalid';
  const [to] = await q.select({ customerId: rental.customerId, status: rental.status }).from(rental).where(eq(rental.id, input.toRentalId));
  if (!to || to.customerId !== part.customerId || !(PAYABLE_STATES as readonly string[]).includes(to.status)) return 'rentalInvalid';
  if (part.amount <= 0) return 'nothingToMove';
  const due = await amountDue(q, input.toRentalId);
  const f = await moneyOne(q, input.toRentalId);
  if (due === null || part.amount > due - f.paid - f.writtenOff) return 'overBill';
  return null;
}

async function actor(q: Q, id: string) {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, id));
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, id))).map((g) => g.p));
  return { a, may: (p: Permission) => !!a && allows(a, granted, p) };
}
const lock = (q: Q, key: string) => q.execute(sql`select pg_advisory_xact_lock(hashtext(${key.toLowerCase()}))`);

/** The correction waiting on one payment's part, if any. */
async function waitingOn(q: Q, paymentId: string, rentalId: string) {
  const [w] = await q.select({ id: approvalRequest.id }).from(approvalRequest).leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(and(eq(approvalRequest.kind, 'correction'), eq(approvalRequest.paymentId, paymentId), eq(approvalRequest.rentalId, rentalId), isNull(approvalDecision.id))).limit(1);
  return w ?? null;
}

export type AskCorrectionError = 'notAllowed' | 'notFound' | 'fixInvalid' | 'reasonMissing' | 'tooLong' | 'alreadyWaiting' | CorrectionError;

/** Sends a correction request for one payment's part on one rental. Logged payment.correctionAsk and a rental_event. */
export async function askCorrection(actorId: string, rentalId: string, paymentId: string, input: CorrectionInput & { reason: string }): Promise<{ ok: true; id: string } | { error: AskCorrectionError }> {
  if (!UUID.test(rentalId) || !UUID.test(paymentId)) return { error: 'notFound' };
  if (!(FIXES as readonly string[]).includes(input.fix)) return { error: 'fixInvalid' };
  // The reason is kept word for word (3.2): only the ends are trimmed.
  const reason = String(input.reason ?? '').trim();
  const ref = String(input.newReference ?? '').trim();
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > REASON_MAX || ref.length > REFERENCE_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await actor(tx, actorId)).may('customerAccess')) return { error: 'notAllowed' } as const;
    const [r] = await tx.select({ customerId: rental.customerId, number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId))
      .where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    await lock(tx, `sns.customer:${r.customerId}`);
    await lock(tx, `sns.rental:${rentalId}`);
    const part = await partOf(tx, paymentId, rentalId);
    if (!part || part.customerId !== r.customerId) return { error: 'notFound' } as const;
    if (await waitingOn(tx, paymentId, rentalId)) return { error: 'alreadyWaiting' } as const;
    const bad = await checkFix(tx, part, rentalId, input);
    if (bad) return { error: bad } as const;
    const values = fixValues(input, ref);
    const [row] = await tx.insert(approvalRequest).values({ rentalId, kind: 'correction', paymentId, ...values, rateWas: 0, estimateWas: part.amount, reason, createdBy: actorId })
      .returning({ id: approvalRequest.id });
    const details = { payment: part.number, for: part.for, fix: input.fix, was: part.amount, ...detailsOf(values), reason };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'correctionRequest', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'payment.correctionAsk', targetType: 'payment', targetId: paymentId,
      details: { name: r.name, number: rentalNumber(r.number), paymentNumber: paymentNumber(part.number), ...details } });
    return { ok: true, id: row.id } as const;
  });
}

function fixValues(input: CorrectionInput, ref: string) {
  return {
    fix: input.fix,
    newAmount: input.fix === 'amount' ? input.newAmount! : null,
    newMethod: input.fix === 'method' ? input.newMethod! : null,
    newReference: (input.fix === 'method' && input.newMethod !== 'cash') || input.fix === 'reference' ? ref : null,
    toRentalId: input.fix === 'rental' ? input.toRentalId!.toLowerCase() : null,
  };
}
function detailsOf(v: ReturnType<typeof fixValues>) {
  return { ...(v.newAmount !== null ? { newAmount: v.newAmount } : {}), ...(v.newMethod ? { newMethod: v.newMethod } : {}), ...(v.newReference ? { newReference: v.newReference } : {}) };
}

export type DecideCorrectionError = 'notAllowed' | 'notFound' | 'decided' | 'ownRequest' | 'noteMissing' | 'tooLong' | CorrectionError;

/** Approves or rejects a waiting correction, under the customer's lock and then each rental's (in order). Logged
 *  approval.approve or approval.reject and a rental_event on each rental it changes. */
export async function decideCorrection(actorId: string, requestId: string, input: { approve: boolean; note?: string }): Promise<{ ok: true } | { error: DecideCorrectionError }> {
  if (!UUID.test(requestId)) return { error: 'notFound' };
  const note = String(input.note ?? '').trim().replace(/\s+/g, ' ');
  if (!input.approve && !note) return { error: 'noteMissing' };
  if (note.length > REASON_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    const me = await actor(tx, actorId);
    if (!me.may('correctPayment')) return { error: 'notAllowed' } as const;
    const [req] = await tx.select().from(approvalRequest).where(and(eq(approvalRequest.id, requestId), eq(approvalRequest.kind, 'correction')));
    if (!req) return { error: 'notFound' } as const;
    const [r] = await tx.select({ customerId: rental.customerId, number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId))
      .where(eq(rental.id, req.rentalId));
    await lock(tx, `sns.customer:${r.customerId}`);
    for (const id of [req.rentalId, req.toRentalId].filter((x): x is string => !!x).map((x) => x.toLowerCase()).sort()) await lock(tx, `sns.rental:${id}`);
    const [done] = await tx.select({ id: approvalDecision.id }).from(approvalDecision).where(eq(approvalDecision.requestId, requestId));
    if (done) return { error: 'decided' } as const;
    const selfApproved = req.createdBy === actorId;
    if (selfApproved && me.a!.role !== 'owner') return { error: 'ownRequest' } as const;
    const part = await partOf(tx, req.paymentId!, req.rentalId);
    if (!part) return { error: 'notFound' } as const;
    const fix = req.fix as Fix;
    const decision = { requestId, note: note || null, selfApproved, createdBy: actorId };
    const base = { name: r.name, number: rentalNumber(r.number), paymentNumber: paymentNumber(part.number), fix, reason: req.reason };
    if (!input.approve) {
      await tx.insert(approvalDecision).values({ ...decision, outcome: 'rejected' });
      const details = { outcome: 'rejected', kind: 'correction', fix, payment: part.number, reason: req.reason, note, ...(selfApproved ? { selfApproved } : {}) };
      await tx.insert(rentalEvent).values({ rentalId: req.rentalId, kind: 'approval', details, createdBy: actorId });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'approval.reject', targetType: 'rental', targetId: req.rentalId, details: { ...base, ...details } });
      return { ok: true } as const;
    }
    const fixInput: CorrectionInput = { fix, newAmount: req.newAmount === null ? undefined : Number(req.newAmount), newMethod: (req.newMethod ?? undefined) as Method | undefined,
      newReference: req.newReference ?? undefined, toRentalId: req.toRentalId ?? undefined };
    // Checked again now: payments, the bill or the deposit may have changed since it was asked.
    const bad = await checkFix(tx, part, req.rentalId, fixInput);
    if (bad) return { error: bad } as const;
    await tx.insert(approvalDecision).values({ ...decision, outcome: 'approved' });
    const drawer = async (kind: 'correctionIn' | 'correctionOut', amount: number) => {
      if (amount > 0) await tx.insert(cashMovement).values({ kind, amount, requestId, createdBy: actorId });
    };
    const check = () => tx.insert(reconciliation).values({ paymentId: part.paymentId, status: 'waiting', createdBy: actorId });
    if (fix === 'amount') {
      const diff = Number(req.newAmount) - part.amount;
      if (part.for === 'bill') await tx.insert(paymentAdjustment).values({ requestId, paymentId: part.paymentId, rentalId: req.rentalId, amount: diff, createdBy: actorId });
      else await tx.insert(depositMovement).values({ rentalId: req.rentalId, kind: 'adjusted', paymentId: part.paymentId, requestId, amount: diff, createdBy: actorId });
      if (part.method === 'cash') await drawer(diff > 0 ? 'correctionIn' : 'correctionOut', Math.abs(diff));
    } else if (fix === 'method') {
      // The whole payment changes its way: cash leaving or entering the drawer is a line; bank or card waits for its check.
      if (part.method === 'cash') await drawer('correctionOut', part.paymentTotal);
      if (req.newMethod === 'cash') await drawer('correctionIn', part.paymentTotal);
      else await check();
    } else if (fix === 'reference') {
      await check();
    } else {
      await tx.insert(paymentAdjustment).values([
        { requestId, paymentId: part.paymentId, rentalId: req.rentalId, amount: -part.amount, createdBy: actorId },
        { requestId, paymentId: part.paymentId, rentalId: req.toRentalId!, amount: part.amount, createdBy: actorId },
      ]);
      const [to] = await tx.select({ number: rental.number }).from(rental).where(eq(rental.id, req.toRentalId!));
      await tx.insert(rentalEvent).values({ rentalId: req.toRentalId!, kind: 'correctionMovedIn', details: { amount: part.amount, payment: part.number, from: r.number }, createdBy: actorId });
      Object.assign(base, { to: rentalNumber(to.number) });
    }
    const details = { outcome: 'approved', kind: 'correction', fix, payment: part.number, was: part.amount, ...detailsOf(fixValues(fixInput, req.newReference ?? '')),
      ...(fix === 'rental' ? { amount: part.amount } : {}), reason: req.reason, ...(note ? { note } : {}), ...(selfApproved ? { selfApproved } : {}) };
    await tx.insert(rentalEvent).values({ rentalId: req.rentalId, kind: 'approval', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'approval.approve', targetType: 'rental', targetId: req.rentalId, details: { ...base, ...details } });
    return { ok: true } as const;
  });
}

export interface CorrectionRow {
  id: string; paymentId: string; paymentNumber: number; fix: Fix; was: number; newAmount: number | null; newMethod: Method | null; newReference: string | null;
  toRentalNumber: number | null; reason: string; createdAt: Date; byName: string | null; outcome: string | null; note: string | null; decidedAt: Date | null;
}

/** A rental's correction requests (asked on it, or moving a payment to it), newest first, with their decisions. */
export async function correctionsOn(rentalId: string, q: Q = db): Promise<CorrectionRow[]> {
  if (!UUID.test(rentalId)) return [];
  const rows = await q.select({ id: approvalRequest.id, paymentId: approvalRequest.paymentId, paymentNumber: payment.number, fix: approvalRequest.fix, was: approvalRequest.estimateWas,
    newAmount: approvalRequest.newAmount, newMethod: approvalRequest.newMethod, newReference: approvalRequest.newReference,
    toRentalNumber: sql<number | null>`(select number from rental where id = ${approvalRequest.toRentalId})`, reason: approvalRequest.reason, createdAt: approvalRequest.createdAt,
    byName: user.name, outcome: approvalDecision.outcome, note: approvalDecision.note, decidedAt: approvalDecision.createdAt })
    .from(approvalRequest).innerJoin(payment, eq(payment.id, approvalRequest.paymentId)).leftJoin(user, eq(user.id, approvalRequest.createdBy))
    .leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(and(eq(approvalRequest.kind, 'correction'), or(eq(approvalRequest.rentalId, rentalId), eq(approvalRequest.toRentalId, rentalId))))
    .orderBy(desc(approvalRequest.createdAt));
  return rows.filter((x) => x.outcome !== 'withdrawn').map((x) => ({ ...x, paymentId: x.paymentId!, fix: x.fix as Fix, was: Number(x.was), newAmount: x.newAmount === null ? null : Number(x.newAmount),
    newMethod: x.newMethod as Method | null, toRentalNumber: x.toRentalNumber === null ? null : Number(x.toRentalNumber) }));
}
