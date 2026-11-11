import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, cashMovement, customer, permissionGrant, refund, rental, rentalEvent, user, writeOff, writeOffLine } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { debtOf } from '../customers/flags';
import { rentalNumber } from '../rentals/agreements';
import { billTotal } from '../rentals/returns';
import { moneyOne } from './figures';

// Writing off a debt (08.6; ST-08.6) and paying back money above a lowered bill (system design 8.3, Confirmed 11 Nov
// 2026). A write-off: the authorised person ("Write off a customer debt"; only the owner until someone is given it), all
// or part of the customer's debt, oldest rentals first, with a reason; the bills stay and the written-off part can no
// longer be paid; SNS bears the loss and no partner's earnings change. Paying back: staff with "Issue refunds or pay
// expenses" pay back up to the amount above a returned rental's bill, cash (a drawer line) or bank with its reference,
// no approval. Both under the customer's and then the rental's lock, as payments take them. All rows insert-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const REASON_MAX = 500;
export const REFERENCE_MAX = 80;
type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

async function actor(q: Q, id: string) {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, id));
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, id))).map((g) => g.p));
  return (p: Permission) => !!a && allows(a, granted, p);
}
const lock = (q: Q, key: string) => q.execute(sql`select pg_advisory_xact_lock(hashtext(${key.toLowerCase()}))`);

export type WriteOffError = 'notAllowed' | 'notFound' | 'reasonMissing' | 'tooLong' | 'amountInvalid' | 'noDebt' | 'overDebt' | 'stale';

/** Writes off `amount` of the customer's debt (the debt shown must still hold). Logged customer.writeOff and a
 *  rental_event on each rental. */
export async function writeOffDebt(actorId: string, customerId: string, input: { amount: number; reason: string; shownDebt: number }): Promise<{ ok: true; id: string } | { error: WriteOffError }> {
  if (!UUID.test(customerId)) return { error: 'notFound' };
  const reason = String(input.reason ?? '').trim();
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > REASON_MAX) return { error: 'tooLong' };
  if (!Number.isSafeInteger(input.amount) || input.amount < 1) return { error: 'amountInvalid' };
  return db.transaction(async (tx) => {
    if (!(await actor(tx, actorId))('writeOffDebt')) return { error: 'notAllowed' } as const;
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, customerId));
    if (!c) return { error: 'notFound' } as const;
    await lock(tx, `sns.customer:${customerId}`);
    const debt = await debtOf(customerId, tx);
    if (debt.total !== input.shownDebt) return { error: 'stale' } as const;
    if (!debt.total) return { error: 'noDebt' } as const;
    if (input.amount > debt.total) return { error: 'overDebt' } as const;
    const [w] = await tx.insert(writeOff).values({ customerId, amount: input.amount, reason, createdBy: actorId }).returning({ id: writeOff.id });
    let left = input.amount;
    const lines: { number: number; amount: number }[] = [];
    for (const r of [...debt.rentals].sort((a, b) => a.number - b.number)) {
      if (!left) break;
      const amount = Math.min(left, r.unpaid);
      await tx.insert(writeOffLine).values({ writeOffId: w.id, rentalId: r.rentalId, amount });
      await tx.insert(rentalEvent).values({ rentalId: r.rentalId, kind: 'writtenOff', details: { amount, reason }, createdBy: actorId });
      lines.push({ number: r.number, amount });
      left -= amount;
    }
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'customer.writeOff', targetType: 'customer', targetId: customerId,
      details: { name: c.name, amount: input.amount, debt: debt.total, reason, rentals: lines.map((l) => `${rentalNumber(l.number)}: ${l.amount}`).join(', ') } });
    return { ok: true, id: w.id } as const;
  });
}

export interface WriteOffRow { id: string; amount: number; reason: string; createdAt: Date; byName: string | null; lines: { rentalId: string; number: number; amount: number }[] }

/** A customer's write-offs, newest first, with the part on each rental. */
export async function writeOffsOf(customerId: string): Promise<WriteOffRow[]> {
  if (!UUID.test(customerId)) return [];
  const rows = await db.select({ id: writeOff.id, amount: writeOff.amount, reason: writeOff.reason, createdAt: writeOff.createdAt, byName: user.name }).from(writeOff)
    .leftJoin(user, eq(user.id, writeOff.createdBy)).where(eq(writeOff.customerId, customerId)).orderBy(desc(writeOff.createdAt));
  if (!rows.length) return [];
  const lines = await db.select({ writeOffId: writeOffLine.writeOffId, rentalId: writeOffLine.rentalId, number: rental.number, amount: writeOffLine.amount }).from(writeOffLine)
    .innerJoin(rental, eq(rental.id, writeOffLine.rentalId)).where(inArray(writeOffLine.writeOffId, rows.map((r) => r.id))).orderBy(asc(rental.number));
  return rows.map((r) => ({ ...r, amount: Number(r.amount), lines: lines.filter((l) => l.writeOffId === r.id).map((l) => ({ rentalId: l.rentalId, number: l.number, amount: Number(l.amount) })) }));
}

/** How much was paid above a returned rental's bill and can be paid back now (0 when none, or not returned). */
export async function paidAbove(rentalId: string, q: Q = db): Promise<number> {
  if (!UUID.test(rentalId)) return 0;
  const bill = await billTotal(q, rentalId);
  if (bill === null) return 0;
  return Math.max(0, (await moneyOne(q, rentalId)).paid - bill);
}

export type PayBackError = 'notAllowed' | 'notFound' | 'notReturned' | 'amountInvalid' | 'nothingAbove' | 'overAbove' | 'methodMissing' | 'referenceMissing' | 'tooLong';

/** Pays back money above a returned rental's bill. Logged rental.payBack and a rental_event. */
export async function payBack(actorId: string, rentalId: string, input: { amount: number; method: 'cash' | 'bank'; reference?: string }): Promise<{ ok: true } | { error: PayBackError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  const reference = String(input.reference ?? '').trim();
  if (reference.length > REFERENCE_MAX) return { error: 'tooLong' };
  if (!Number.isSafeInteger(input.amount) || input.amount < 1) return { error: 'amountInvalid' };
  if (input.method !== 'cash' && input.method !== 'bank') return { error: 'methodMissing' };
  if (input.method === 'bank' && !reference) return { error: 'referenceMissing' };
  return db.transaction(async (tx) => {
    const may = await actor(tx, actorId);
    if (!may('customerAccess') || !may('refundsAndExpenses')) return { error: 'notAllowed' } as const;
    const [r] = await tx.select({ customerId: rental.customerId, status: rental.status, number: rental.number, name: customer.name }).from(rental)
      .innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    await lock(tx, `sns.customer:${r.customerId}`);
    await lock(tx, `sns.rental:${rentalId}`);
    if (r.status !== 'returned') return { error: 'notReturned' } as const;
    const above = await paidAbove(rentalId, tx);
    if (!above) return { error: 'nothingAbove' } as const;
    if (input.amount > above) return { error: 'overAbove' } as const;
    const [f] = await tx.insert(refund).values({ rentalId, kind: 'overpaid', method: input.method, reference: input.method === 'bank' ? reference : null, amount: input.amount, createdBy: actorId })
      .returning({ id: refund.id });
    if (input.method === 'cash') await tx.insert(cashMovement).values({ kind: 'refundOut', amount: input.amount, refundId: f.id, createdBy: actorId });
    const details = { amount: input.amount, method: input.method, ...(input.method === 'bank' ? { reference } : {}), above };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'paidBack', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.payBack', targetType: 'rental', targetId: rentalId, details: { name: r.name, number: rentalNumber(r.number), ...details } });
    return { ok: true } as const;
  });
}

/** What was paid back on a rental, oldest first. */
export async function paidBackOn(rentalId: string) {
  if (!UUID.test(rentalId)) return [];
  const rows = await db.select({ id: refund.id, amount: refund.amount, method: refund.method, reference: refund.reference, createdAt: refund.createdAt, byName: user.name })
    .from(refund).leftJoin(user, eq(user.id, refund.createdBy)).where(and(eq(refund.rentalId, rentalId), eq(refund.kind, 'overpaid'))).orderBy(asc(refund.createdAt));
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
}
