import { describe, it, expect } from 'vitest';
import { addCar } from '../../src/modules/cars/cars';
import { changeStatus, mayGoOut, statusOf } from '../../src/modules/cars/status';
import { samplePerson, theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-20 (PARTIAL: the handover itself comes with rentals, Phase 2): "Vehicle marked under repair: rental handover
// blocked until authorised availability change." System design 11 and 3.2 (Confirmed; DN-01).
describe('AT-20 (partial): a car under repair does not go out until an authorised person marks it available', () => {
  it('staff mark it under repair; staff cannot mark it available; the admin can', async () => {
    const owner = await theOwner();
    const car = await addCar(owner, { registration: samplePlate(), model: 'Alto', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);
    const staff = await samplePerson();
    expect(await changeStatus(staff.id, car.id, { status: 'repair', reason: 'Sample: AC fault, at the garage' }, 'available')).toEqual({ ok: true, changed: true });
    const now = await statusOf(car.id);
    expect(now).toMatchObject({ status: 'repair', reason: 'Sample: AC fault, at the garage', expectedBack: null });
    expect(mayGoOut(now.status)).toBe(false);

    expect(await changeStatus(staff.id, car.id, { status: 'available' }, 'repair')).toEqual({ error: 'notAllowed' });
    expect((await statusOf(car.id)).status).toBe('repair');
    const admin = await samplePerson('first-pass-1', 'admin');
    expect(await changeStatus(admin.id, car.id, { status: 'available' }, 'repair')).toEqual({ ok: true, changed: true });
    expect(mayGoOut((await statusOf(car.id)).status)).toBe(true);
  });
});
