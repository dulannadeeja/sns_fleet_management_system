import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { approvalDecision, approvalRequest, auditEvent, cashMovement, customer, depositMovement, depositSettlement, permissionGrant, rental, rentalEvent, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { billTotal, paidAndHeld } from '../rentals/returns';
import { debtOf } from '../customers/flags';
import { rentalNumber } from '../rentals/agreements';

// Use the deposit and refund the rest (07.3; ST-07.3; system design 8.2, Confirmed 11 Nov 2026). Its own step after the
// car is back, once per rental, in one save: the deposit held pays this rental's bill first; then, when staff tick that
// the customer agrees and note how (at most 500 letters), the customer's older unpaid bills (their other returned
// rentals), oldest first, each up to what is unpaid; the rest is refunded, so nothing is left held. Refused while garage
// days wait for an admin. Using the deposit needs Customer access; a refund above 0 also "Issue refunds or pay expenses".
// A cash refund adds a drawer line (`refundOut`); a bank refund needs its reference (at most 80 letters). A deposit used
// for a bill counts as paid on it (paidAndHeld, debtOf, the payment cap) and is never new money. All rows are insert-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const NOTE_MAX = 500;
export const REFERENCE_MAX = 80;
export const REFUND_METHODS = ['cash', 'bank'] as const;
export type RefundMethod = (typeof REFUND_METHODS)[number];
type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export { planDeposit, type OlderBill, type DepositPlan } from '../../lib/deposit-plan';
import { planDeposit, type OlderBill } from '../../lib/deposit-plan';

export interface Settlement {
  here: number; older: { rentalId: string; number: number; amount: number }[]; refund: number; method: RefundMethod | null; reference: string | null;
  olderAgreed: boolean; agreementNote: string | null; createdAt: Date; byName: string | null;
}
export interface DepositState {
  rentalId: string; number: number; customerId: string; returned: boolean; held: number; billTotal: number; billUnpaid: number; older: OlderBill[];
  garageWaiting: boolean; settlement: Settlement | null;
}

async function settlementOf(q: Q, rentalId: string): Promise<Settlement | null> {
  const [s] = await q.select({ id: depositSettlement.id, olderAgreed: depositSettlement.olderAgreed, agreementNote: depositSettlement.agreementNote, createdAt: depositSettlement.createdAt,
    byName: user.name }).from(depositSettlement).leftJoin(user, eq(user.id, depositSettlement.createdBy)).where(eq(depositSettlement.rentalId, rentalId));
  if (!s) return null;
  const moves = await q.select({ kind: depositMovement.kind, amount: depositMovement.amount, toRentalId: depositMovement.toRentalId, method: depositMovement.method,
    reference: depositMovement.reference, toNumber: rental.number }).from(depositMovement).leftJoin(rental, eq(rental.id, depositMovement.toRentalId))
    .where(eq(depositMovement.settlementId, s.id));
  const refund = moves.find((m) => m.kind === 'refunded');
  return {
    here: moves.filter((m) => m.kind === 'applied' && m.toRentalId === rentalId).reduce((n, m) => n + Number(m.amount), 0),
    older: moves.filter((m) => m.kind === 'applied' && m.toRentalId !== rentalId).map((m) => ({ rentalId: m.toRentalId!, number: m.toNumber!, amount: Number(m.amount) }))
      .sort((a, b) => a.number - b.number),
    refund: refund ? Number(refund.amount) : 0, method: (refund?.method ?? null) as RefundMethod | null, reference: refund?.reference ?? null,
    olderAgreed: s.olderAgreed, agreementNote: s.agreementNote, createdAt: s.createdAt, byName: s.byName,
  };
}

/** Where a rental's deposit stands: held now, this bill's unpaid part, the customer's older unpaid bills, whether garage
 *  days wait, and the settlement once done. */
export async function depositState(rentalId: string, q: Q = db): Promise<DepositState | null> {
  if (!UUID.test(rentalId)) return null;
  const [r] = await q.select({ id: rental.id, number: rental.number, status: rental.status, customerId: rental.customerId }).from(rental).where(eq(rental.id, rentalId));
  if (!r) return null;
  // One after another: inside a transaction they share one connection.
  const money = await paidAndHeld(q, r.id);
  const total = await billTotal(q, r.id);
  const debt = await debtOf(r.customerId, q);
  const settlement = await settlementOf(q, r.id);
  const [waiting] = await q.select({ id: approvalRequest.id }).from(approvalRequest).leftJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(and(eq(approvalRequest.rentalId, r.id), eq(approvalRequest.kind, 'garageDays'), isNull(approvalDecision.id))).limit(1);
  return {
    rentalId: r.id, number: r.number, customerId: r.customerId, returned: r.status === 'returned', held: money.depositHeld, billTotal: total ?? 0,
    billUnpaid: Math.max(0, (total ?? 0) - money.paid - money.writtenOff), older: debt.rentals.filter((d) => d.rentalId !== r.id), garageWaiting: !!waiting, settlement,
  };
}

export interface SettleInput {
  olderAgreed: boolean; agreementNote?: string; refund?: { method: RefundMethod; reference?: string };
  /** What the screen showed: if anything changed since, nothing is saved. */
  shown: { held: number; here: number; older: number; refund: number };
}
export type SettleError = 'notAllowed' | 'refundNotAllowed' | 'notFound' | 'notReturned' | 'alreadySettled' | 'garageWaiting' | 'nothingHeld' | 'noOlderBills'
  | 'noteMissing' | 'methodMissing' | 'referenceMissing' | 'tooLong' | 'stale';

const tidy = (v: unknown) => String(v ?? '').trim();

/** Settles a rental's deposit in one save, under the customer's and the rental's locks (as payments take them). */
export async function settleDeposit(actorId: string, rentalId: string, input: SettleInput): Promise<{ ok: true; refund: number } | { error: SettleError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  const note = tidy(input.agreementNote);
  const reference = tidy(input.refund?.reference);
  if (note.length > NOTE_MAX || reference.length > REFERENCE_MAX) return { error: 'tooLong' };
  if (input.olderAgreed && !note) return { error: 'noteMissing' };
  return db.transaction(async (tx) => {
    const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
    const may = (p: Permission) => !!a && allows(a, granted, p);
    if (!may('customerAccess')) return { error: 'notAllowed' } as const;
    const [r] = await tx.select({ customerId: rental.customerId }).from(rental).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.customer:${r.customerId.toLowerCase()}`}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    const s = (await depositState(rentalId, tx))!;
    if (!s.returned) return { error: 'notReturned' } as const;
    if (s.settlement) return { error: 'alreadySettled' } as const;
    if (s.garageWaiting) return { error: 'garageWaiting' } as const;
    if (s.held <= 0) return { error: 'nothingHeld' } as const;
    if (input.olderAgreed && !s.older.length) return { error: 'noOlderBills' } as const;
    const plan = planDeposit(s.held, s.billUnpaid, s.older, input.olderAgreed);
    const shown = input.shown ?? {};
    if (shown.held !== s.held || shown.here !== plan.here || shown.older !== plan.olderTotal || shown.refund !== plan.refund) return { error: 'stale' } as const;
    const method = input.refund?.method;
    if (plan.refund > 0) {
      if (!method || !(REFUND_METHODS as readonly string[]).includes(method)) return { error: 'methodMissing' } as const;
      if (method === 'bank' && !reference) return { error: 'referenceMissing' } as const;
      if (!may('refundsAndExpenses')) return { error: 'refundNotAllowed' } as const;
    }
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, s.customerId));
    // The agreement is kept only when the deposit really paid an older bill (#64 review).
    const agreedUsed = input.olderAgreed && plan.older.length > 0;
    const [set] = await tx.insert(depositSettlement).values({ rentalId, olderAgreed: agreedUsed, agreementNote: agreedUsed ? note : null, createdBy: actorId })
      .returning({ id: depositSettlement.id });
    const base = { rentalId, settlementId: set.id, createdBy: actorId };
    if (plan.here) await tx.insert(depositMovement).values({ ...base, kind: 'applied', toRentalId: rentalId, amount: plan.here });
    for (const o of plan.older) {
      await tx.insert(depositMovement).values({ ...base, kind: 'applied', toRentalId: o.rentalId, amount: o.amount });
      await tx.insert(rentalEvent).values({ rentalId: o.rentalId, kind: 'depositFromOther', details: { amount: o.amount, from: s.number }, createdBy: actorId });
    }
    if (plan.refund) {
      const [m] = await tx.insert(depositMovement).values({ ...base, kind: 'refunded', method: method!, reference: method === 'bank' ? reference : null, amount: plan.refund })
        .returning({ id: depositMovement.id });
      if (method === 'cash') await tx.insert(cashMovement).values({ kind: 'refundOut', amount: plan.refund, depositMovementId: m.id, createdBy: actorId });
    }
    const details = { held: s.held, here: plan.here, older: plan.older.map((o) => ({ number: o.number, amount: o.amount })), refund: plan.refund,
      ...(plan.refund ? { method, ...(method === 'bank' ? { reference } : {}) } : {}), ...(agreedUsed ? { agreementNote: note } : {}) };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'depositSettled', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.depositSettle', targetType: 'rental', targetId: rentalId,
      details: { name: c?.name ?? '', number: rentalNumber(s.number), ...details, older: plan.older.map((o) => `${rentalNumber(o.number)}: ${o.amount}`).join(', ') } });
    return { ok: true, refund: plan.refund } as const;
  });
}
