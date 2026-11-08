import { describe, it, expect } from 'vitest';
import { createRental, freeCarsNow } from '../../src/modules/rentals/rentals';
import { changeStatus } from '../../src/modules/cars/status';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-20 (PARTIAL: the handover block itself is checked with #57): "Vehicle marked under repair: rental handover blocked
// until authorised availability change" (system design 11). A car under repair is not offered and cannot be rented.
describe('AT-20 (partial): a car under repair', () => {
  it('is not offered on 05.2 and cannot be saved on a rental until marked available again', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    expect(await changeStatus(owner, carId, { status: 'repair', reason: 'Sample: gearbox' }, 'available')).toMatchObject({ ok: true });
    expect((await freeCarsNow()).some((c) => c.id === carId)).toBe(false);
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'carNotAvailable' });
    expect(await changeStatus(owner, carId, { status: 'available' }, 'repair')).toMatchObject({ ok: true });
    expect((await freeCarsNow()).some((c) => c.id === carId)).toBe(true);
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toMatchObject({ ok: true });
    expect((await freeCarsNow()).some((c) => c.id === carId)).toBe(false); // held now by that rental
  });
});
