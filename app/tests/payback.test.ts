import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { cashMovement, refund } from '../src/db/schema';
import { correctGarageDays, receiveCar, rentalBill } from '../src/modules/rentals/returns';
import { recordPayment } from '../src/modules/money/payments';
import { approvalsList, decide } from '../src/modules/approvals/approvals';
import { depositState, planDeposit, settleDeposit } from '../src/modules/money/deposits';
import { paidAbove, payBack, paidBackOn } from '../src/modules/money/writeoffs';
import { setPermission } from '../src/modules/people/people';
import { samplePerson } from './helpers/people';
import { outRental } from './helpers/handover';

// Paying back money above a lowered bill (system design 8.3, Confirmed 11 Nov 2026): staff with "Issue refunds or pay
// expenses", up to the amount above the bill, cash (a drawer line) or bank with its reference, no approval.
describe('paying back money above a bill', { timeout: 90_000 }, () => {
  it('garage days lowered after the deposit paid the bill: the difference is paid back', async () => {
    const r = await outRental({ days: 1, ownership: 'sns', deposit: 20_000 });
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'deposit', rentals: [{ rentalId: r.rentalId, amount: 20_000 }], parts: [{ method: 'cash', amount: 20_000 }] }))
      .toMatchObject({ ok: true });
    // 4,500 rent + 500 damage + 3 garage days (15,000) = 20,000.
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1100, fuel: 'full', accessories: r.accessories, checked: true, nextState: 'repair', nextReason: 'Sample dent',
      damage: { what: 'Sample dent', amount: 500 }, garageDays: 3 })).toEqual({ ok: true });
    const req = (await approvalsList(r.owner, 'waiting')).find((a) => a.rentalId === r.rentalId && a.kind === 'garageDays')!;
    expect(await decide(r.owner, req.id, { approve: true })).toEqual({ ok: true });
    const s = (await depositState(r.rentalId))!;
    const plan = planDeposit(s.held, s.billUnpaid, s.older, false);
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, shown: { held: s.held, here: plan.here, older: 0, refund: plan.refund } })).toMatchObject({ ok: true, refund: 0 });
    expect(await paidAbove(r.rentalId)).toBe(0);
    expect(await payBack(r.owner, r.rentalId, { key: randomUUID(), amount: 1, method: 'cash' })).toEqual({ error: 'nothingAbove' });
    // The admin corrects 3 days to 1: the bill is 10,000; 10,000 was paid above it.
    expect(await correctGarageDays(r.owner, r.rentalId, { days: 1, reason: 'Sample: back sooner' })).toEqual({ ok: true });
    expect((await rentalBill(r.rentalId))!).toMatchObject({ total: 10_000, paid: 20_000, unpaid: -10_000 });
    expect(await paidAbove(r.rentalId)).toBe(10_000);
    const staff = (await samplePerson()).id;
    expect(await setPermission(r.owner, staff, 'refundsAndExpenses', false)).toMatchObject({ ok: true });
    expect(await payBack(staff, r.rentalId, { key: randomUUID(), amount: 1000, method: 'cash' })).toEqual({ error: 'notAllowed' });
    expect(await payBack(r.owner, r.rentalId, { key: randomUUID(), amount: 10_001, method: 'cash' })).toEqual({ error: 'overAbove' });
    expect(await payBack(r.owner, r.rentalId, { key: randomUUID(), amount: 6000, method: 'bank', reference: ' ' })).toEqual({ error: 'referenceMissing' });
    const key = randomUUID();
    expect(await payBack(r.owner, r.rentalId, { key, amount: 4000, method: 'cash' })).toEqual({ ok: true });
    expect(await payBack(r.owner, r.rentalId, { key, amount: 4000, method: 'cash' })).toEqual({ ok: true });
    expect(await payBack(r.owner, r.rentalId, { key, amount: 3000, method: 'cash' })).toEqual({ error: 'keyInvalid' });
    expect(await payBack(r.owner, r.rentalId, { key: randomUUID(), amount: 6000, method: 'bank', reference: 'Sample BOC 9' })).toEqual({ ok: true });
    expect((await rentalBill(r.rentalId))!).toMatchObject({ total: 10_000, paid: 10_000, unpaid: 0, refunded: 10_000 });
    // The same form sent twice paid back once (its key), so only 4,000 + 6,000 went back.
    expect((await paidBackOn(r.rentalId)).map((x) => [x.method, x.amount])).toEqual([['cash', 4000], ['bank', 6000]]);
    // The cash one is its own drawer line; the bank one is not in the drawer.
    const [cash] = await db.select({ id: refund.id }).from(refund).where(and(eq(refund.rentalId, r.rentalId), eq(refund.method, 'cash')));
    expect((await db.select({ kind: cashMovement.kind, amount: cashMovement.amount }).from(cashMovement).where(eq(cashMovement.refundId, cash.id)))).toEqual([{ kind: 'refundOut', amount: 4000 }]);
  });
});
