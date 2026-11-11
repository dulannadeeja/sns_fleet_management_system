import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { receiveCar, rentalBill } from '../../src/modules/rentals/returns';
import { recordPayment } from '../../src/modules/money/payments';
import { writeOffDebt, writeOffsOf } from '../../src/modules/money/writeoffs';
import { debtOf, warningsFor } from '../../src/modules/customers/flags';
import { setPermission } from '../../src/modules/people/people';
import { samplePerson } from '../helpers/people';
import { outRental } from '../helpers/handover';

// AT-17: "Customer debt written off: SNS absorbs the loss; partner earnings not reduced" (ST-08.6; system design 8.3,
// Confirmed 11 Nov 2026). The bill lines and their partner shares stay as they were; the written-off part stops counting
// as debt and can no longer be paid. Partner earning lines are made from these bill lines with the day close (Phase 3),
// so "SNS absorbs the loss" is shown here as: the shares stay, and nothing is taken from them. AT-38 (an imported opening debt) comes with the import of starting data.
describe('AT-17: a debt written off is SNS\'s loss', { timeout: 90_000 }, () => {
  it('writes off part then the rest, oldest rental first; bills and partner shares unchanged', async () => {
    // Two partner-car rentals of one customer, no deposit, each 4,500 unpaid at return.
    const a = await outRental({ days: 1, deposit: null });
    const b = await outRental({ days: 1, deposit: null, customerId: a.customerId });
    for (const r of [a, b]) {
      expect(await receiveCar(r.owner, r.rentalId, { inKm: 1100, fuel: 'full', accessories: r.accessories, checked: true, nextState: 'available', payLaterNote: 'Sample' })).toEqual({ ok: true });
    }
    const before = (await rentalBill(a.rentalId))!.lines.map((l) => [l.kind, l.amount, l.partnerShare]);
    // The partner's share of the rent (15% to SNS on the sample partner car): 3,825 of 4,500.
    expect(before).toEqual([['rent', 4500, 3825]]);
    expect((await debtOf(a.customerId)).total).toBe(9000);
    // Only the authorised person (the owner until someone is given it) writes off; a reason is needed.
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    expect(await writeOffDebt(admin, a.customerId, { amount: 1000, reason: 'Sample', shownDebt: 9000 })).toEqual({ error: 'notAllowed' });
    expect(await writeOffDebt(a.owner, a.customerId, { amount: 1000, reason: ' ', shownDebt: 9000 })).toEqual({ error: 'reasonMissing' });
    expect(await writeOffDebt(a.owner, a.customerId, { amount: 1000, reason: 'Sample', shownDebt: 8000 })).toEqual({ error: 'stale' });
    expect(await writeOffDebt(a.owner, a.customerId, { amount: 9001, reason: 'Sample', shownDebt: 9000 })).toEqual({ error: 'overDebt' });
    // Part: 6,000 comes off the oldest rental (4,500) and then 1,500 of the next.
    expect(await writeOffDebt(a.owner, a.customerId, { amount: 6000, reason: 'Sample: customer left the area', shownDebt: 9000 })).toMatchObject({ ok: true });
    expect((await rentalBill(a.rentalId))!).toMatchObject({ total: 4500, writtenOff: 4500, unpaid: 0 });
    expect((await rentalBill(b.rentalId))!).toMatchObject({ total: 4500, writtenOff: 1500, unpaid: 3000 });
    expect((await debtOf(a.customerId)).total).toBe(3000);
    // The written-off part can no longer be paid.
    expect(await recordPayment(a.owner, { key: randomUUID(), customerId: a.customerId, for: 'bill', rentals: [{ rentalId: a.rentalId, amount: 1 }], parts: [{ method: 'cash', amount: 1 }] }))
      .toMatchObject({ error: 'overEstimate' });
    // Someone given "Write off a customer debt" writes off the rest; the debt warning ends.
    expect(await setPermission(a.owner, admin, 'writeOffDebt', true)).toMatchObject({ ok: true });
    expect(await writeOffDebt(admin, a.customerId, { amount: 3000, reason: 'Sample: the rest', shownDebt: 3000 })).toMatchObject({ ok: true });
    expect((await warningsFor(a.customerId))!.debt.total).toBe(0);
    expect(await writeOffDebt(a.owner, a.customerId, { amount: 1, reason: 'Sample', shownDebt: 0 })).toEqual({ error: 'noDebt' });
    // Partner earnings not reduced: the bill lines and their partner shares are as they were.
    expect((await rentalBill(a.rentalId))!.lines.map((l) => [l.kind, l.amount, l.partnerShare])).toEqual(before);
    expect((await writeOffsOf(a.customerId)).map((w) => [w.amount, w.lines.map((l) => l.amount)])).toEqual([[3000, [3000]], [6000, [4500, 1500]]]);
  });
});
