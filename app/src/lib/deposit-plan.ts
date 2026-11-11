// What a rental's deposit does at settlement (ST-07.3; system design 8.2, Confirmed 11 Nov 2026). Pure: the settle
// form shows it as staff choose, and settleDeposit (modules/money/deposits.ts) works it out again under the locks.

export interface OlderBill { rentalId: string; number: number; unpaid: number }
export interface DepositPlan { here: number; older: { rentalId: string; number: number; amount: number }[]; olderTotal: number; refund: number }

/** What the deposit held does: this bill first, then (with the customer's agreement) older bills oldest first, then the
 *  rest is refunded. Never more than is held. */
export function planDeposit(held: number, billUnpaid: number, older: OlderBill[], agreed: boolean): DepositPlan {
  let left = Math.max(0, held);
  const here = Math.min(left, Math.max(0, billUnpaid));
  left -= here;
  const paid: DepositPlan['older'] = [];
  if (agreed) {
    for (const o of [...older].sort((a, b) => a.number - b.number)) {
      if (!left) break;
      const amount = Math.min(left, o.unpaid);
      if (amount > 0) { paid.push({ rentalId: o.rentalId, number: o.number, amount }); left -= amount; }
    }
  }
  return { here, older: paid, olderTotal: paid.reduce((n, o) => n + o.amount, 0), refund: left };
}
