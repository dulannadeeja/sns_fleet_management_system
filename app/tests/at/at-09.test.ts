import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createRental, rentalTerms } from '../../src/modules/rentals/rentals';
import { recordPayment, rentalMoney } from '../../src/modules/money/payments';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-09 (PARTIAL: separate bills come with #63): "Customer
// rents two vehicles: separate rentals, agreements, bills; one payment may be allocated across both" (system design 7.1).
describe('AT-09 (partial): one customer, two cars, two rentals', () => {
  it('saves two separate rentals, each with its own car and terms', async () => {
    const owner = await theOwner();
    const a = await sampleCarAndCustomer(owner);
    const b = await sampleCarAndCustomer(owner);
    const r1 = await createRental(owner, { customerId: a.customerId, vehicleId: a.carId, pickupAt: samplePickup(), days: 2 });
    const r2 = await createRental(owner, { customerId: a.customerId, vehicleId: b.carId, pickupAt: samplePickup(), days: 3 });
    if (!('ok' in r1) || !('ok' in r2)) throw new Error(JSON.stringify([r1, r2]));
    expect(r1.id).not.toBe(r2.id);
    expect((await rentalTerms(r1.id))!).toMatchObject({ customerId: a.customerId, days: 2, segments: [{ vehicleId: a.carId }] });
    expect((await rentalTerms(r2.id))!).toMatchObject({ customerId: a.customerId, days: 3, segments: [{ vehicleId: b.carId }] });
  });

  it('one payment is shared across both rentals (#53)', async () => {
    const owner = await theOwner();
    const a = await sampleCarAndCustomer(owner);
    const b = await sampleCarAndCustomer(owner);
    const r1 = await createRental(owner, { customerId: a.customerId, vehicleId: a.carId, pickupAt: samplePickup(), days: 2 });
    const r2 = await createRental(owner, { customerId: a.customerId, vehicleId: b.carId, pickupAt: samplePickup(), days: 3 });
    if (!('ok' in r1) || !('ok' in r2)) throw new Error(JSON.stringify([r1, r2]));
    const p = await recordPayment(owner, { key: randomUUID(), customerId: a.customerId, for: 'bill',
      rentals: [{ rentalId: r1.id, amount: 3000 }, { rentalId: r2.id, amount: 2000 }], parts: [{ method: 'cash', amount: 5000 }] });
    if (!('ok' in p)) throw new Error(JSON.stringify(p));
    expect(p.paymentIds).toHaveLength(1);
    expect((await rentalMoney(r1.id))!.paid).toBe(3000);
    expect((await rentalMoney(r2.id))!.paid).toBe(2000);
  });
});
