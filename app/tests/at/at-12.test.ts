import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { cashMovement, depositMovement, paymentAllocation } from '../../src/db/schema';
import { depositState, planDeposit, settleDeposit } from '../../src/modules/money/deposits';
import { recordPayment } from '../../src/modules/money/payments';
import { rentalBill } from '../../src/modules/rentals/returns';
import { debtOf } from '../../src/modules/customers/flags';
import { returnedWithDeposit } from '../helpers/deposits';

// AT-12: "LKR 10,000 deposit, LKR 7,000 bill: apply 7,000, refund 3,000; no double-counted earnings" (ST-07.3; system
// design 8.2, Confirmed 11 Nov 2026). The deposit is held money: using it pays the bill without any new payment.
describe('AT-12: the deposit pays the bill and the rest is refunded', { timeout: 60_000 }, () => {
  it('applies 7,000, refunds 3,000 in cash, and nothing is counted twice', async () => {
    const r = await returnedWithDeposit();
    const s = (await depositState(r.rentalId))!;
    expect(s).toMatchObject({ returned: true, held: 10_000, billUnpaid: 7000, older: [], settlement: null, garageWaiting: false });
    const plan = planDeposit(s.held, s.billUnpaid, s.older, false);
    expect(plan).toEqual({ here: 7000, older: [], olderTotal: 0, refund: 3000 });
    const done = await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown: { held: 10_000, here: 7000, older: 0, refund: 3000 } });
    expect(done).toMatchObject({ ok: true });

    const bill = (await rentalBill(r.rentalId))!;
    expect(bill).toMatchObject({ total: 7000, paid: 7000, depositHeld: 0, unpaid: 0 });
    expect((await debtOf(r.customerId)).total).toBe(0);
    // No payment was made for the bill: the deposit used is not new money.
    expect(await db.select().from(paymentAllocation).where(eq(paymentAllocation.rentalId, r.rentalId))).toEqual([]);
    const moves = await db.select({ kind: depositMovement.kind, amount: depositMovement.amount, method: depositMovement.method, id: depositMovement.id })
      .from(depositMovement).where(eq(depositMovement.rentalId, r.rentalId));
    expect(moves.map((m) => [m.kind, m.amount]).sort()).toEqual([['applied', 7000], ['received', 10_000], ['refunded', 3000]]);
    // The cash refund is its own drawer line.
    const refunded = moves.find((m) => m.kind === 'refunded')!;
    expect(await db.select({ kind: cashMovement.kind, amount: cashMovement.amount }).from(cashMovement).where(eq(cashMovement.depositMovementId, refunded.id)))
      .toEqual([{ kind: 'refundOut', amount: 3000 }]);
    // The bill is paid: another payment on it is refused, and settling again is refused.
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 1 }], parts: [{ method: 'cash', amount: 1 }] }))
      .toMatchObject({ error: 'overEstimate' });
    expect(await settleDeposit(r.owner, r.rentalId, { olderAgreed: false, refund: { method: 'cash' }, shown: { held: 10_000, here: 7000, older: 0, refund: 3000 } }))
      .toEqual({ error: 'alreadySettled' });
    expect((await depositState(r.rentalId))!.settlement).toMatchObject({ here: 7000, older: [], refund: 3000, method: 'cash' });
  });
});
