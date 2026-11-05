import { describe, it, expect } from 'vitest';
import { addCar } from '../../src/modules/cars/cars';
import { changeStatus, statusOf } from '../../src/modules/cars/status';
import { setPermission } from '../../src/modules/people/people';
import { samplePerson, theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-52 (PARTIAL: the reservation half needs reservations, Phase 2): "Staff try to retire a car; then an admin retires a
// car that is reserved next week: staff cannot; the admin is refused until the reservation is moved or cancelled."
// System design 11 (Confirmed): only an admin or the primary owner retires a car.
describe('AT-52 (partial): staff cannot retire a car', () => {
  it('refuses staff, even given every car permission; the car stays as it was', async () => {
    const owner = await theOwner();
    const car = await addCar(owner, { registration: samplePlate(), model: 'Every', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);
    const staff = await samplePerson();
    for (const p of ['editCarsAndPackages', 'markCarAvailable', 'markCarUnavailable'] as const) await setPermission(owner, staff.id, p, true);
    expect(await changeStatus(staff.id, car.id, { status: 'retired', reason: 'Sample: sold' }, 'available')).toEqual({ error: 'notAllowed' });
    expect((await statusOf(car.id)).status).toBe('available');
  });
});
