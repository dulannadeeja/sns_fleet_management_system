import { describe, it, expect } from 'vitest';
import { createRental } from '../../src/modules/rentals/rentals';
import { samplePerson, theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-08 (PARTIAL: the handover itself comes with #57): "Two employees submit handovers for same vehicle: only one
// succeeds; no duplicate active allocation" (system design 7.5 derived control, 17.3). A saved rental already holds its
// car (7.1, Confirmed 7 Nov 2026), so two people saving the same car at once: only one rental holds it.
describe('AT-08 (partial): the same car saved on two rentals at the same moment', () => {
  it('only one save succeeds; the others are told the car is taken', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const results = await Promise.all([owner, staff, owner, staff].map((a) => createRental(a, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 })));
    expect(results.filter((x) => 'ok' in x)).toHaveLength(1);
    expect(results.filter((x) => 'error' in x && x.error === 'carTaken')).toHaveLength(3);
  });
});
