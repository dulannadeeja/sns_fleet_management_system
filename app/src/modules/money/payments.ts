import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, cashMovement, customer, depositMovement, payment, paymentAllocation, permissionGrant, reconciliation, rental, rentalEvent, user } from '../../db/schema';
import { allows } from '../../auth/permissions';
import { rentalEstimate } from '../rentals/rentals';

// Record a payment (09.3, 09.4; ST-09.1; system design 8.1, 8.2, 9; Confirmed 9 Nov 2026). Anyone with Customer access.
// A payment is for a bill (shared across the customer's rentals, each at most what is unpaid on its estimate before
// return) or a deposit (at most the deposit set less what was received; held money, never income). A mixed payment is
// one payment per part; a cash part adds a drawer line; a bank or card part starts its check "waiting". The same form
// sent twice is recorded once. A reference already on another payment of the same method needs a reason.
// Everything written here is insert-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const METHODS = ['cash', 'bank', 'card'] as const;
export const PAYMENT_FOR = ['bill', 'deposit'] as const;
export const REFERENCE_MAX = 80;
export const REASON_MAX = 500;
export const PARTS_MAX = 5;
export const RENTALS_MAX = 10;
/** The rental states a payment can go on. Only draft exists until handover (#57) and return (#63) add theirs. */
export const PAYABLE_STATES = ['draft'] as const;
export type Method = (typeof METHODS)[number];
export type PaymentFor = (typeof PAYMENT_FOR)[number];
export type Check = 'waiting' | 'matched' | 'flagged';

export interface PaymentInput {
  key: string; customerId: string; for: PaymentFor;
  rentals: { rentalId: string; amount: number }[];
  parts: { method: Method; amount: number; reference?: string }[];
  sameReferenceReason?: string;
}
export interface SamePayment { number: number; method: Method; amount: number; createdAt: Date }
export type PaymentError = 'notAllowed' | 'notFound' | 'keyInvalid' | 'forInvalid' | 'amountInvalid' | 'methodInvalid' | 'referenceMissing' | 'tooLong'
  | 'tooMany' | 'totalsDiffer' | 'notPayable' | 'overEstimate' | 'noDeposit' | 'overDeposit' | 'sameReference';
export type PaymentResult = { ok: true; paymentIds: string[]; numbers: number[] } | { error: PaymentError; rentalId?: string; same?: SamePayment[] };

/** A payment's number on paper: P-0001. */
export const paymentNumber = (n: number) => `P-${String(n).padStart(4, '0')}`;

const clean = (s: unknown) => String(s ?? '').trim().replace(/\s+/g, ' ');
const whole = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 1;

type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

async function paidOn(q: Q, rentalIds: string[]) {
  if (!rentalIds.length) return new Map<string, number>();
  const rows = await q.select({ id: paymentAllocation.rentalId, sum: sql<string>`sum(${paymentAllocation.amount})` }).from(paymentAllocation)
    .where(inArray(paymentAllocation.rentalId, rentalIds)).groupBy(paymentAllocation.rentalId);
  return new Map(rows.map((r) => [r.id, Number(r.sum)]));
}
async function depositReceived(q: Q, rentalIds: string[]) {
  if (!rentalIds.length) return new Map<string, number>();
  const rows = await q.select({ id: depositMovement.rentalId, sum: sql<string>`sum(${depositMovement.amount})` }).from(depositMovement)
    .where(and(inArray(depositMovement.rentalId, rentalIds), eq(depositMovement.kind, 'received'))).groupBy(depositMovement.rentalId);
  return new Map(rows.map((r) => [r.id, Number(r.sum)]));
}

/** The deposit received so far on a rental (setRentalTerms refuses a deposit below it). */
export async function depositReceivedOn(q: Q, rentalId: string): Promise<number> {
  return (await depositReceived(q, [rentalId])).get(rentalId) ?? 0;
}

/** Records one payment form: one payment per part, put on the chosen rentals in order. */
export async function recordPayment(actorId: string, input: PaymentInput): Promise<PaymentResult> {
  if (!UUID.test(String(input.key))) return { error: 'keyInvalid' };
  if (!UUID.test(String(input.customerId))) return { error: 'notFound' };
  if (!(PAYMENT_FOR as readonly string[]).includes(input.for)) return { error: 'forInvalid' };
  const targets = Array.isArray(input.rentals) ? input.rentals : [];
  const parts = (Array.isArray(input.parts) ? input.parts : []).map((p) => ({ method: p?.method, amount: p?.amount, reference: clean(p?.reference) }));
  if (!targets.length || !parts.length) return { error: 'amountInvalid' };
  if (targets.length > RENTALS_MAX || parts.length > PARTS_MAX || (input.for === 'deposit' && targets.length !== 1)) return { error: 'tooMany' };
  if (targets.some((t) => !UUID.test(String(t?.rentalId)))) return { error: 'notFound' };
  if (new Set(targets.map((t) => t.rentalId.toLowerCase())).size !== targets.length) return { error: 'notFound' };
  if (targets.some((t) => !whole(t.amount)) || parts.some((p) => !whole(p.amount))) return { error: 'amountInvalid' };
  if (parts.some((p) => !(METHODS as readonly string[]).includes(p.method as string))) return { error: 'methodInvalid' };
  if (parts.some((p) => p.method !== 'cash' && !p.reference)) return { error: 'referenceMissing' };
  const reason = clean(input.sameReferenceReason);
  if (parts.some((p) => p.reference.length > REFERENCE_MAX) || reason.length > REASON_MAX) return { error: 'tooLong' };
  const total = targets.reduce((s, t) => s + t.amount, 0);
  if (parts.reduce((s, p) => s + (p.amount as number), 0) !== total) return { error: 'totalsDiffer' };
  const keys = parts.map((_, i) => `${input.key.toLowerCase()}:${i}`);

  return db.transaction(async (tx) => {
    const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
    if (!a || !allows(a, granted, 'customerAccess')) return { error: 'notAllowed' } as const;
    // One customer's payments one at a time, then each rental (in a fixed order, as setRentalTerms locks it too).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.customer:${input.customerId.toLowerCase()}`}))`);
    const ids = targets.map((t) => t.rentalId.toLowerCase());
    for (const id of [...ids].sort()) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${id}`}))`);
    // Sent before: give back what it saved.
    const before = await tx.select({ id: payment.id, number: payment.number, key: payment.idempotencyKey, customerId: payment.customerId, method: payment.method, amount: payment.amount })
      .from(payment).where(inArray(payment.idempotencyKey, keys));
    if (before.length) {
      const sorted = keys.map((k) => before.find((b) => b.key === k));
      // The same form again only if it is the same payment; a key reused for something else is refused (#53 review).
      const same = sorted.every((b, i) => b && b.customerId === input.customerId.toLowerCase() && b.method === parts[i].method && Number(b.amount) === parts[i].amount);
      if (!same) return { error: 'keyInvalid' } as const;
      return { ok: true, paymentIds: sorted.map((b) => b!.id), numbers: sorted.map((b) => b!.number) } as const;
    }
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, input.customerId));
    if (!c) return { error: 'notFound' } as const;
    const rentals = await tx.select({ id: rental.id, number: rental.number, status: rental.status, customerId: rental.customerId, deposit: rental.depositAmount })
      .from(rental).where(inArray(rental.id, ids));
    for (const t of targets) {
      const r = rentals.find((x) => x.id === t.rentalId.toLowerCase());
      if (!r || r.customerId !== input.customerId.toLowerCase()) return { error: 'notFound', rentalId: t.rentalId } as const;
      if (!(PAYABLE_STATES as readonly string[]).includes(r.status)) return { error: 'notPayable', rentalId: t.rentalId } as const;
    }
    if (input.for === 'bill') {
      const paid = await paidOn(tx, ids);
      for (const t of targets) {
        const est = await rentalEstimate(t.rentalId, undefined, tx);
        if (!est) return { error: 'notFound', rentalId: t.rentalId } as const;
        if (t.amount > est.total - (paid.get(t.rentalId.toLowerCase()) ?? 0)) return { error: 'overEstimate', rentalId: t.rentalId } as const;
      }
    } else {
      const r = rentals[0];
      if (r.deposit === null) return { error: 'noDeposit', rentalId: r.id } as const;
      const got = (await depositReceived(tx, [r.id])).get(r.id) ?? 0;
      if (targets[0].amount > r.deposit - got) return { error: 'overDeposit', rentalId: r.id } as const;
    }
    // The same reference on another payment of the same method (8.1, 9 Nov 2026): those payments are shown; saving needs
    // a reason, kept on the part that repeats it.
    const same: SamePayment[] = [];
    const repeats = new Set<number>();
    for (const [i, p] of parts.entries()) {
      if (p.method === 'cash') continue;
      const rows = await tx.select({ number: payment.number, method: payment.method, amount: payment.amount, createdAt: payment.createdAt }).from(payment)
        .where(and(eq(payment.method, p.method as Method), sql`lower(${payment.reference}) = lower(${p.reference})`)).orderBy(desc(payment.createdAt));
      if (rows.length) repeats.add(i);
      same.push(...rows.map((r) => ({ ...r, method: r.method as Method, amount: Number(r.amount) })));
    }
    if (same.length && !reason) return { error: 'sameReference', same } as const;

    const saved: { id: string; number: number }[] = [];
    const queue = targets.map((t) => ({ rentalId: t.rentalId.toLowerCase(), left: t.amount }));
    const byRental = new Map<string, number[]>();
    for (const [i, p] of parts.entries()) {
      const method = p.method as Method;
      const [row] = await tx.insert(payment).values({ customerId: input.customerId, method, amount: p.amount as number, reference: method === 'cash' ? null : p.reference,
        sameReferenceReason: repeats.has(i) ? reason : null, idempotencyKey: keys[i], createdBy: actorId }).returning({ id: payment.id, number: payment.number });
      saved.push(row);
      let left = p.amount as number;
      const onRentals: number[] = [];
      for (const q of queue) {
        if (!left) break;
        const take = Math.min(left, q.left);
        if (!take) continue;
        if (input.for === 'bill') await tx.insert(paymentAllocation).values({ paymentId: row.id, rentalId: q.rentalId, amount: take, createdBy: actorId });
        else await tx.insert(depositMovement).values({ rentalId: q.rentalId, kind: 'received', paymentId: row.id, amount: take, createdBy: actorId });
        q.left -= take; left -= take;
        byRental.set(q.rentalId, [...(byRental.get(q.rentalId) ?? []), row.number]);
        onRentals.push(rentals.find((r) => r.id === q.rentalId)!.number);
      }
      if (method === 'cash') await tx.insert(cashMovement).values({ kind: 'paymentIn', amount: p.amount as number, paymentId: row.id, createdBy: actorId });
      else await tx.insert(reconciliation).values({ paymentId: row.id, status: 'waiting', createdBy: actorId });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'payment.record', targetType: 'payment', targetId: row.id,
        details: { number: row.number, name: c.name, for: input.for, method, amount: p.amount, rentals: onRentals,
          ...(method === 'cash' ? {} : { reference: p.reference }), ...(repeats.has(i) ? { sameReferenceReason: reason } : {}) } });
    }
    for (const t of targets) {
      const id = t.rentalId.toLowerCase();
      await tx.insert(rentalEvent).values({ rentalId: id, kind: 'payment', details: { for: input.for, amount: t.amount, payments: byRental.get(id) ?? [] }, createdBy: actorId });
    }
    return { ok: true, paymentIds: saved.map((s) => s.id), numbers: saved.map((s) => s.number) } as const;
  });
}

export interface RentalPayment { id: string; number: number; for: PaymentFor; method: Method; amount: number; reference: string | null; check: Check | null; createdAt: Date; createdByName: string }
export interface RentalMoney { estimate: number; paid: number; unpaid: number; depositSet: number | null; depositReceived: number; payments: RentalPayment[] }

/** A rental's money so far: the estimate, what was paid on it and what is unpaid, and the deposit set and received. */
export async function rentalMoney(rentalId: string): Promise<RentalMoney | null> {
  if (!UUID.test(rentalId)) return null;
  const [r] = await db.select({ id: rental.id, deposit: rental.depositAmount }).from(rental).where(eq(rental.id, rentalId));
  const est = r && await rentalEstimate(r.id);
  if (!r || !est) return null;
  const paid = (await paidOn(db, [r.id])).get(r.id) ?? 0;
  const received = (await depositReceived(db, [r.id])).get(r.id) ?? 0;
  const check = sql<Check | null>`(select status from reconciliation where payment_id = ${payment.id} order by created_at desc limit 1)`;
  const cols = { id: payment.id, number: payment.number, method: payment.method, reference: payment.reference, createdAt: payment.createdAt, createdByName: user.name, check };
  const bills = await db.select({ ...cols, amount: paymentAllocation.amount }).from(paymentAllocation).innerJoin(payment, eq(payment.id, paymentAllocation.paymentId))
    .innerJoin(user, eq(user.id, payment.createdBy)).where(eq(paymentAllocation.rentalId, r.id));
  const deps = await db.select({ ...cols, amount: depositMovement.amount }).from(depositMovement).innerJoin(payment, eq(payment.id, depositMovement.paymentId))
    .innerJoin(user, eq(user.id, payment.createdBy)).where(and(eq(depositMovement.rentalId, r.id), eq(depositMovement.kind, 'received')));
  const payments = [...bills.map((b) => ({ ...b, for: 'bill' as const })), ...deps.map((d) => ({ ...d, for: 'deposit' as const }))]
    .map((p) => ({ ...p, method: p.method as Method, amount: Number(p.amount) }))
    .sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime() || x.number - y.number);
  return { estimate: est.total, paid, unpaid: est.total - paid, depositSet: r.deposit, depositReceived: received, payments };
}

export interface PayableRental { id: string; number: number; estimate: number; paid: number; unpaid: number; depositSet: number | null; depositReceived: number }

/** The customer's rentals a payment can go on now (09.3, 09.4), newest first. */
export async function payableRentals(customerId: string): Promise<PayableRental[]> {
  if (!UUID.test(customerId)) return [];
  const rows = await db.select({ id: rental.id, number: rental.number, deposit: rental.depositAmount }).from(rental)
    .where(and(eq(rental.customerId, customerId), inArray(rental.status, [...PAYABLE_STATES]))).orderBy(desc(rental.createdAt));
  const ids = rows.map((r) => r.id);
  const [paid, received] = await Promise.all([paidOn(db, ids), depositReceived(db, ids)]);
  const out: PayableRental[] = [];
  for (const r of rows) {
    const est = await rentalEstimate(r.id);
    if (!est) continue;
    const p = paid.get(r.id) ?? 0;
    out.push({ id: r.id, number: r.number, estimate: est.total, paid: p, unpaid: est.total - p, depositSet: r.deposit, depositReceived: received.get(r.id) ?? 0 });
  }
  return out;
}
