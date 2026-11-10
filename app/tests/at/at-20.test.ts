import { describe, it, expect } from 'vitest';
import { handOver } from '../../src/modules/rentals/handover';
import { ensureAccessories, readyRental } from '../helpers/handover';
import { addCar } from '../../src/modules/cars/cars';
import { changeStatus, mayGoOut, statusOf } from '../../src/modules/cars/status';
import { createRental, freeCarsNow } from '../../src/modules/rentals/rentals';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';
import { samplePerson, theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-20 (the handover since #57): "Vehicle marked under repair: rental handover
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

// New rental (#51): until the handover check (#57), a car under repair is not offered on 05.2 and cannot be saved.
describe('AT-20 (partial): a car under repair is not offered and cannot be rented', () => {
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

const ticks = async (missing: string[] = []) => (await ensureAccessories()).map((item) => ({ item, present: !missing.includes(item) }));

describe('AT-20: a car under repair cannot be handed over (#57)', { timeout: 30_000 }, () => {
  it('blocks the handover until the car is available again', async () => {
    const { rentalId, carId, owner } = await readyRental();
    expect(await changeStatus(owner, carId, { status: 'repair', reason: 'Sample: brakes' }, 'available')).toMatchObject({ ok: true });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'blocked', missing: ['carNotAvailable'] });
    expect(await changeStatus(owner, carId, { status: 'available' }, 'repair')).toMatchObject({ ok: true });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
  });
});
