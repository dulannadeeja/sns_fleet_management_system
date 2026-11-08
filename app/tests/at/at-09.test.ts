import { describe, it, expect } from 'vitest';
import { createRental, rentalTerms } from '../../src/modules/rentals/rentals';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-09 (PARTIAL: separate agreements and bills come with #55 and #63; one payment across both with #53): "Customer
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
});
