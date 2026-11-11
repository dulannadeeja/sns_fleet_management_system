import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { cashMovement, depositMovement } from '../src/db/schema';
import { depositState, planDeposit, settleDeposit } from '../src/modules/money/deposits';
import { recordPayment } from '../src/modules/money/payments';
import { receiveCar, rentalBill } from '../src/modules/rentals/returns';
import { debtOf } from '../src/modules/customers/flags';
import { decide, approvalsList } from '../src/modules/approvals/approvals';
import { setPermission } from '../src/modules/people/people';
import { samplePerson } from './helpers/people';
import { outRental } from './helpers/handover';
import { returnedWithDeposit } from './helpers/deposits';

// Settling the deposit (ST-07.3; system design 8.2, Confirmed 11 Nov 2026): once per rental after return, this bill
// first, older bills only with the customer's agreement and a note, the rest refunded (cash adds a drawer line; bank needs
// its reference). Refused while garage days wait. A refund above 0 needs "Issue refunds or pay expenses".
describe('planDeposit', () => {
  it('pays this bill, then older bills oldest first, never beyond what is held', () => {
    const older = [{ rentalId: 'a', number: 1, unpaid: 3000 }, { rentalId: 'b', number: 2, unpaid: 5000 }];
    expect(planDeposit(10_000, 4000, older, true)).toEqual({ here: 4000, older: [{ rentalId: 'a', number: 1, amount: 3000 }, { rentalId: 'b', number: 2, amount: 3000 }], olderTotal: 6000, refund: 0 });
    expect(planDeposit(10_000, 4000, older, false)).toEqual({ here: 4000, older: [], olderTotal: 0, refund: 6000 });
    expect(planDeposit(5000, 9000, older, true)).toEqual({ here: 5000, older: [], olderTotal: 0, refund: 0 });
    expect(planDeposit(5000, 0, [], false)).toEqual({ here: 0, older: [], olderTotal: 0, refund: 5000 });
  });
});

describe('settleDeposit', { timeout: 90_000 }, () => {
  it('is refused before return and when nothing is held', async () => {
    const r = await outRental({ days: 1 });
    const shown = { held: 0, here: 0, older: 0, refund: 0 };
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, shown })).toEqual({ error: 'notReturned' });
    const none = await outRental({ days: 1, deposit: null });
    expect(await receiveCar(none.owner, none.rentalId, { inKm: 1100, fuel: 'full', accessories: none.accessories, checked: true, nextState: 'available', payLaterNote: 'Sample' })).toEqual({ ok: true });
    expect(await settleDeposit(none.owner, none.rentalId, { olderAgreed: false, shown })).toEqual({ error: 'nothingHeld' });
  });

  it('needs the refund way, a bank reference, and the refund permission', async () => {
    const r = await returnedWithDeposit();
    const shown = { held: 10_000, here: 7000, older: 0, refund: 3000 };
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, shown })).toEqual({ error: 'methodMissing' });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'bank', reference: ' ' }, shown })).toEqual({ error: 'referenceMissing' });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'bank', reference: 'x'.repeat(81) }, shown })).toEqual({ error: 'tooLong' });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: true, agreementNote: 'Sample', refund: { method: 'cash' }, shown })).toEqual({ error: 'noOlderBills' });
    const staff = (await samplePerson()).id;
    expect(await setPermission(r.owner, staff, 'refundsAndExpenses', false)).toMatchObject({ ok: true });
    expect(await settleDeposit(staff, r.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown })).toEqual({ error: 'refundNotAllowed' });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'bank', reference: 'Sample BOC 42' }, shown })).toMatchObject({ ok: true });
    const [m] = await db.select().from(depositMovement).where(eq(depositMovement.rentalId, r.rentalId)).then((rows) => rows.filter((x) => x.kind === 'refunded'));
    expect(m).toMatchObject({ method: 'bank', reference: 'Sample BOC 42', amount: 3000 });
    // A bank refund adds no drawer line.
    expect(await db.select().from(cashMovement).where(eq(cashMovement.depositMovementId, m.id))).toEqual([]);
  });

  it('a bill bigger than the deposit uses all of it; the rest stays debt; no refund permission needed', async () => {
    // 1 day, 1,400 km: 4,500 + 300 × 25 = 12,000; 10,000 held.
    const r = await returnedWithDeposit({ inKm: 1400, payLater: true });
    const staff = (await samplePerson()).id;
    expect(await setPermission(r.owner, staff, 'refundsAndExpenses', false)).toMatchObject({ ok: true });
    expect(await settleDeposit(staff, r.rentalId, { olderAgreed: false, shown: { held: 10_000, here: 10_000, older: 0, refund: 0 } })).toMatchObject({ ok: true });
    expect((await rentalBill(r.rentalId))!).toMatchObject({ total: 12_000, paid: 10_000, depositHeld: 0, unpaid: 2000 });
    expect((await debtOf(r.customerId)).total).toBe(2000);
  });

  it('a bill already paid: the whole deposit is refunded', async () => {
    const r = await returnedWithDeposit();
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 7000 }], parts: [{ method: 'cash', amount: 7000 }] }))
      .toMatchObject({ ok: true });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown: { held: 10_000, here: 0, older: 0, refund: 10_000 } })).toMatchObject({ ok: true });
    expect((await rentalBill(r.rentalId))!).toMatchObject({ total: 7000, paid: 7000, depositHeld: 0, unpaid: 0 });
  });

  it('waits while garage days wait for an admin, then the deposit covers them', async () => {
    const r = await outRental({ days: 1 });
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'deposit', rentals: [{ rentalId: r.rentalId, amount: 10_000 }], parts: [{ method: 'cash', amount: 10_000 }] }))
      .toMatchObject({ ok: true });
    // 4,500 rent + 500 damage; 1 garage day (5,000) waits.
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1100, fuel: 'full', accessories: r.accessories, checked: true, nextState: 'repair', nextReason: 'Sample dent',
      damage: { what: 'Sample dent', amount: 500 }, garageDays: 1 })).toEqual({ ok: true });
    expect((await depositState(r.rentalId))!.garageWaiting).toBe(true);
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown: { held: 10_000, here: 5000, older: 0, refund: 5000 } }))
      .toEqual({ error: 'garageWaiting' });
    const req = (await approvalsList(r.owner, 'waiting')).find((a) => a.rentalId === r.rentalId && a.kind === 'garageDays')!;
    expect(await decide(r.owner, req.id, { approve: true, partnerExtra: 0, splitReason: 'Sample: all SNS' })).toEqual({ ok: true });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown: { held: 10_000, here: 10_000, older: 0, refund: 0 } }))
      .toMatchObject({ ok: true });
    expect((await rentalBill(r.rentalId))!).toMatchObject({ total: 10_000, paid: 10_000, unpaid: 0 });
  });
});
