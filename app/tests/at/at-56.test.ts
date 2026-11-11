import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { receiveCar, rentalBill } from '../../src/modules/rentals/returns';
import { recordPayment } from '../../src/modules/money/payments';
import { depositState, settleDeposit } from '../../src/modules/money/deposits';
import { debtOf } from '../../src/modules/customers/flags';
import { outRental } from '../helpers/handover';
import { returnedWithDeposit } from '../helpers/deposits';

// AT-56: "10,000 deposit, 7,000 bill, 2,000 older bill, the customer agrees: 7,000, then 2,000, then 1,000 refunded;
// nothing is applied beyond what is held" (ST-07.3; system design 8.2, Confirmed 11 Nov 2026).
describe('AT-56: with the customer\'s agreement the deposit pays an older bill', { timeout: 90_000 }, () => {
  it('pays this bill, then the older one, then refunds the rest', async () => {
    // The older rental: no deposit, a 4,500 bill, 2,500 paid, 2,000 left as debt.
    const old = await outRental({ days: 1, deposit: null });
    const now = await returnedWithDeposit({ customerId: old.customerId });
    expect(await receiveCar(old.owner, old.rentalId, { inKm: 1100, fuel: 'full', accessories: old.accessories, checked: true, nextState: 'available', payLaterNote: 'Sample' })).toEqual({ ok: true });
    expect(await recordPayment(old.owner, { key: randomUUID(), customerId: old.customerId, for: 'bill', rentals: [{ rentalId: old.rentalId, amount: 2500 }], parts: [{ method: 'cash', amount: 2500 }] }))
      .toMatchObject({ ok: true });
    expect((await debtOf(old.customerId)).total).toBe(2000);

    const s = (await depositState(now.rentalId))!;
    expect(s.older).toEqual([expect.objectContaining({ rentalId: old.rentalId, unpaid: 2000 })]);
    const shown = { held: 10_000, here: 7000, older: 2000, refund: 1000 };
    // Agreement needs its note; without the agreement the older bill is not paid.
    expect(await settleDeposit(now.owner, now.rentalId, { olderAgreed: true, agreementNote: ' ', refund: { method: 'cash' }, shown })).toEqual({ error: 'noteMissing' });
    expect(await settleDeposit(now.owner, now.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown })).toEqual({ error: 'stale' });
    expect(await settleDeposit(now.owner, now.rentalId, { olderAgreed: true, agreementNote: 'Sample: agreed at the counter', refund: { method: 'cash' }, shown })).toMatchObject({ ok: true });

    expect((await rentalBill(now.rentalId))!).toMatchObject({ total: 7000, paid: 7000, depositHeld: 0, unpaid: 0 });
    expect((await rentalBill(old.rentalId))!).toMatchObject({ total: 4500, paid: 4500, unpaid: 0 });
    expect((await debtOf(old.customerId)).total).toBe(0);
    expect((await depositState(now.rentalId))!.settlement).toMatchObject({ here: 7000, older: [{ rentalId: old.rentalId, amount: 2000 }], refund: 1000, olderAgreed: true,
      agreementNote: 'Sample: agreed at the counter' });
  });

  it('nothing is applied beyond what is held: a smaller deposit pays part of the older bill and nothing is refunded', async () => {
    const old = await outRental({ days: 1, deposit: null });
    const now = await returnedWithDeposit({ customerId: old.customerId, deposit: 8000 });
    expect(await receiveCar(old.owner, old.rentalId, { inKm: 1100, fuel: 'full', accessories: old.accessories, checked: true, nextState: 'available', payLaterNote: 'Sample' })).toEqual({ ok: true });
    expect(await recordPayment(old.owner, { key: randomUUID(), customerId: old.customerId, for: 'bill', rentals: [{ rentalId: old.rentalId, amount: 2500 }], parts: [{ method: 'cash', amount: 2500 }] }))
      .toMatchObject({ ok: true });
    // 8,000 held: 7,000 on this bill, 1,000 of the older 2,000, nothing refunded (no refund way needed).
    expect(await settleDeposit(now.owner, now.rentalId, { olderAgreed: true, agreementNote: 'Sample: agreed by phone', shown: { held: 8000, here: 7000, older: 1000, refund: 0 } }))
      .toMatchObject({ ok: true, refund: 0 });
    expect((await rentalBill(old.rentalId))!).toMatchObject({ total: 4500, paid: 3500, unpaid: 1000 });
    expect((await debtOf(old.customerId)).total).toBe(1000);
  });
});
