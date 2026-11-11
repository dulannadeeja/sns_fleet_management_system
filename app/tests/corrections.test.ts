import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { cashMovement, reconciliation } from '../src/db/schema';
import { askCorrection, correctionsOn, partOf } from '../src/modules/money/corrections';
import { decide, approvalsList } from '../src/modules/approvals/approvals';
import { recordPayment, rentalMoney } from '../src/modules/money/payments';
import { settleDeposit } from '../src/modules/money/deposits';
import { samplePerson } from './helpers/people';
import { outRental } from './helpers/handover';
import { returnedWithDeposit } from './helpers/deposits';

// Payment corrections (09.5; ST-09.2; system design 8.3, Confirmed 11 Nov 2026): asked by anyone with Customer access
// for one payment's part on one rental; decided by an admin with "Correct a recorded payment" (never their own, except
// the primary owner); the payment never changes: dated lines, drawer lines and a new check follow.
async function paid(owner: string, customerId: string, rentalId: string, amount: number, method: 'cash' | 'bank' = 'cash', forWhat: 'bill' | 'deposit' = 'bill') {
  const p = await recordPayment(owner, { key: randomUUID(), customerId, for: forWhat, rentals: [{ rentalId, amount }], parts: [{ method, amount, ...(method === 'bank' ? { reference: `Sample-${randomUUID().slice(0, 8)}` } : {}) }] });
  if (!('ok' in p)) throw new Error(JSON.stringify(p));
  return p.paymentIds[0];
}
const drawerFor = (requestId: string) => db.select({ kind: cashMovement.kind, amount: cashMovement.amount }).from(cashMovement).where(eq(cashMovement.requestId, requestId));

describe('payment corrections', { timeout: 90_000 }, () => {
  it('amount: staff ask, an admin approves; a dated line and a drawer line; the payment stays', async () => {
    const r = await outRental({ days: 2 });
    const pid = await paid(r.owner, r.customerId, r.rentalId, 7000);
    const staff = (await samplePerson()).id;
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    expect(await askCorrection(staff, r.rentalId, pid, { fix: 'amount', newAmount: 700, reason: ' ' })).toEqual({ error: 'reasonMissing' });
    expect(await askCorrection(staff, r.rentalId, pid, { fix: 'amount', newAmount: 7000, reason: 'Sample' })).toEqual({ error: 'sameAmount' });
    expect(await askCorrection(staff, r.rentalId, pid, { fix: 'amount', newAmount: 99_000, reason: 'Sample' })).toEqual({ error: 'overBill' });
    const ask = await askCorrection(staff, r.rentalId, pid, { fix: 'amount', newAmount: 700, reason: 'Sample: typed 7,000 for 700' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await askCorrection(staff, r.rentalId, pid, { fix: 'amount', newAmount: 600, reason: 'Sample' })).toEqual({ error: 'alreadyWaiting' });
    // Staff may not decide; the admin sees it in Approvals; rejecting needs a note.
    expect(await decide(staff, ask.id, { approve: true })).toEqual({ error: 'notAllowed' });
    expect((await approvalsList(admin, 'waiting')).some((a) => a.id === ask.id && a.kind === 'correction' && a.newAmount === 700)).toBe(true);
    expect(await decide(admin, ask.id, { approve: false })).toEqual({ error: 'noteMissing' });
    expect(await decide(admin, ask.id, { approve: true })).toEqual({ ok: true });
    expect(await decide(admin, ask.id, { approve: true })).toEqual({ error: 'decided' });
    expect((await partOf(db, pid, r.rentalId))!.amount).toBe(700);
    expect((await rentalMoney(r.rentalId))!.paid).toBe(700);
    // The payment as taken stays in the list; the cash difference left the drawer.
    expect((await rentalMoney(r.rentalId))!.payments.find((p) => p.id === pid)!.amount).toBe(7000);
    expect(await drawerFor(ask.id)).toEqual([{ kind: 'correctionOut', amount: 6300 }]);
    expect((await correctionsOn(r.rentalId))[0]).toMatchObject({ fix: 'amount', was: 7000, newAmount: 700, outcome: 'approved' });
  });

  it('nobody decides their own request, except the primary owner (self-approved)', async () => {
    const r = await outRental({ days: 2 });
    const pid = await paid(r.owner, r.customerId, r.rentalId, 1000);
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    const own = await askCorrection(admin, r.rentalId, pid, { fix: 'amount', newAmount: 900, reason: 'Sample' });
    if (!('ok' in own)) throw new Error(JSON.stringify(own));
    expect(await decide(admin, own.id, { approve: true })).toEqual({ error: 'ownRequest' });
    expect(await decide(r.owner, own.id, { approve: false, note: 'Sample: it was right' })).toEqual({ ok: true });
    expect((await partOf(db, pid, r.rentalId))!.amount).toBe(1000);
    const mine = await askCorrection(r.owner, r.rentalId, pid, { fix: 'amount', newAmount: 0, reason: 'Sample: the money never came' });
    if (!('ok' in mine)) throw new Error(JSON.stringify(mine));
    expect(await decide(r.owner, mine.id, { approve: true })).toEqual({ ok: true });
    expect((await rentalMoney(r.rentalId))!.paid).toBe(0);
  });

  it('way and reference: cash to bank leaves the drawer and waits for the check; a new reference waits again', async () => {
    const r = await outRental({ days: 2 });
    const pid = await paid(r.owner, r.customerId, r.rentalId, 2000);
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    expect(await askCorrection(r.owner, r.rentalId, pid, { fix: 'method', newMethod: 'cash', reason: 'Sample' })).toEqual({ error: 'sameMethod' });
    expect(await askCorrection(r.owner, r.rentalId, pid, { fix: 'method', newMethod: 'bank', reason: 'Sample' })).toEqual({ error: 'referenceMissing' });
    expect(await askCorrection(r.owner, r.rentalId, pid, { fix: 'reference', newReference: 'X', reason: 'Sample' })).toEqual({ error: 'cashNoReference' });
    const m = await askCorrection(r.owner, r.rentalId, pid, { fix: 'method', newMethod: 'bank', newReference: 'Sample BOC 1', reason: 'Sample: it was a transfer' });
    if (!('ok' in m)) throw new Error(JSON.stringify(m));
    expect(await decide(admin, m.id, { approve: true })).toEqual({ ok: true });
    expect(await drawerFor(m.id)).toEqual([{ kind: 'correctionOut', amount: 2000 }]);
    expect((await partOf(db, pid, r.rentalId))!).toMatchObject({ method: 'bank', reference: 'Sample BOC 1', amount: 2000 });
    const ref = await askCorrection(r.owner, r.rentalId, pid, { fix: 'reference', newReference: 'Sample BOC 2', reason: 'Sample: typo' });
    if (!('ok' in ref)) throw new Error(JSON.stringify(ref));
    expect(await decide(admin, ref.id, { approve: true })).toEqual({ ok: true });
    expect((await partOf(db, pid, r.rentalId))!.reference).toBe('Sample BOC 2');
    expect((await db.select().from(reconciliation).where(eq(reconciliation.paymentId, pid))).map((x) => x.status)).toEqual(['waiting', 'waiting']);
  });

  it('wrong rental: the amount moves to another rental of the same customer, up to what is unpaid there', async () => {
    const a = await outRental({ days: 2 });
    const b = await outRental({ days: 1, customerId: a.customerId });
    const other = await outRental({ days: 1 });
    const pid = await paid(a.owner, a.customerId, a.rentalId, 3000);
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    expect(await askCorrection(a.owner, a.rentalId, pid, { fix: 'rental', toRentalId: other.rentalId, reason: 'Sample' })).toEqual({ error: 'rentalInvalid' });
    const mv = await askCorrection(a.owner, a.rentalId, pid, { fix: 'rental', toRentalId: b.rentalId, reason: 'Sample: was for the other car' });
    if (!('ok' in mv)) throw new Error(JSON.stringify(mv));
    expect(await decide(admin, mv.id, { approve: true })).toEqual({ ok: true });
    expect((await rentalMoney(a.rentalId))!.paid).toBe(0);
    expect((await rentalMoney(b.rentalId))!.paid).toBe(3000);
    expect((await correctionsOn(b.rentalId))[0]).toMatchObject({ fix: 'rental', outcome: 'approved' });
  });

  it('a deposit payment: corrected before its deposit is settled, never after; it cannot be moved', async () => {
    const r = await outRental({ days: 1 });
    const pid = await paid(r.owner, r.customerId, r.rentalId, 5000, 'cash', 'deposit');
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    expect(await askCorrection(r.owner, r.rentalId, pid, { fix: 'amount', newAmount: 10_001, reason: 'Sample' })).toEqual({ error: 'overDeposit' });
    expect(await askCorrection(r.owner, r.rentalId, pid, { fix: 'rental', toRentalId: r.rentalId, reason: 'Sample' })).toEqual({ error: 'depositNotMovable' });
    const fix = await askCorrection(r.owner, r.rentalId, pid, { fix: 'amount', newAmount: 4000, reason: 'Sample: 4,000 came' });
    if (!('ok' in fix)) throw new Error(JSON.stringify(fix));
    expect(await decide(admin, fix.id, { approve: true })).toEqual({ ok: true });
    expect((await rentalMoney(r.rentalId))!.depositReceived).toBe(4000);
    const s = await returnedWithDeposit();
    const dep = (await rentalMoney(s.rentalId))!.payments.find((p) => p.for === 'deposit')!;
    expect(await settleDeposit(s.owner, s.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown: { held: 10_000, here: 7000, older: 0, refund: 3000 } })).toMatchObject({ ok: true });
    expect(await askCorrection(s.owner, s.rentalId, dep.id, { fix: 'amount', newAmount: 9000, reason: 'Sample' })).toEqual({ error: 'depositSettled' });
  });
});
