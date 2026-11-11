import { randomUUID } from 'node:crypto';
import { recordPayment } from '../../src/modules/money/payments';
import { receiveCar } from '../../src/modules/rentals/returns';
import { outRental } from './handover';

/** Pays a sample deposit in cash, then receives the car with `inKm` (the Wagon R sample: 4,500 a day, 100 km a day, 25 a
 *  km, out at 1,000 km; 1 day and 1,200 km is a 7,000 bill). Not real data. */
export async function returnedWithDeposit(opts: { deposit?: number; inKm?: number; customerId?: string; payLater?: boolean } = {}) {
  const deposit = opts.deposit ?? 10_000;
  const r = await outRental({ days: 1, deposit, customerId: opts.customerId });
  const p = await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'deposit', rentals: [{ rentalId: r.rentalId, amount: deposit }], parts: [{ method: 'cash', amount: deposit }] });
  if (!('ok' in p)) throw new Error(`deposit: ${JSON.stringify(p)}`);
  const back = await receiveCar(r.owner, r.rentalId, { inKm: opts.inKm ?? 1200, fuel: 'full', accessories: r.accessories, checked: true, nextState: 'available',
    ...(opts.payLater ? { payLaterNote: 'Sample: pays later' } : {}) });
  if (!('ok' in back)) throw new Error(`return: ${JSON.stringify(back)}`);
  return r;
}
