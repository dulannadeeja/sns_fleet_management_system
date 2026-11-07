import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { carIsFree, createRental, rentalEstimate, rentalTerms } from '../src/modules/rentals/rentals';
import { changeStatus } from '../src/modules/cars/status';
import { turnOff } from '../src/modules/people/people';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';

// #50 rental foundation (system design 4.3, 5.1, 7.1; TRD › Integrity rules). Each test adds its own sample car,
// customer and a pickup far in the future.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const DAY = 86_400_000;

describe('a new rental keeps its own copy of the terms', () => {
  it('copies the car\'s package and the owner settings; the deadline follows the cutoff', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const pickupAt = samplePickup();
    const r = await createRental(owner, { customerId, vehicleId: carId, pickupAt, days: 3 });
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    const t = (await rentalTerms(r.id))!;
    expect(t).toMatchObject({ status: 'draft', days: 3, customerId, segments: [{ position: 1, vehicleId: carId, dailyRate: 4500, kmPerDay: 100, extraKmRate: 25 }] });
    expect(t.pickupCutoff).toMatch(/^\d\d:\d\d$/);
    expect(t.deadlineAt.getTime()).toBeGreaterThan(pickupAt.getTime() + 2 * DAY);
    expect((await rentalEstimate(r.id))!.base).toBe(13500);
    // Logged, and its history and saved terms can never be changed.
    const log = await pool.query("select action from audit_event where target_id = $1", [r.id]);
    expect(log.rows.map((x) => x.action)).toEqual(['rental.create']);
    await expect(pool.query('update rental_event set kind = $2 where rental_id = $1', [r.id, 'x'])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from rental_terms_snapshot where rental_id = $1', [r.id])).rejects.toThrow(/insert-only/);
  });
});

describe('one rental or reservation per car at any time (AT-08, AT-30 groundwork)', () => {
  it('refuses a second rental of the same car for overlapping days, but allows the days after', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const pickupAt = samplePickup();
    const first = await createRental(owner, { customerId, vehicleId: carId, pickupAt, days: 2 });
    expect(first).toMatchObject({ ok: true });
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: new Date(pickupAt.getTime() + DAY), days: 1 })).toEqual({ error: 'carTaken' });
    expect(await carIsFree(carId, pickupAt, new Date(pickupAt.getTime() + DAY))).toBe(false);
    const after = new Date(pickupAt.getTime() + 5 * DAY);
    expect(await carIsFree(carId, after, new Date(after.getTime() + DAY))).toBe(true);
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: after, days: 1 })).toMatchObject({ ok: true });
  });

  it('two people saving the same car at the same moment: only one wins', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const pickupAt = samplePickup();
    const results = await Promise.all([owner, staff, owner, staff].map((a) => createRental(a, { customerId, vehicleId: carId, pickupAt, days: 2 })));
    expect(results.filter((x) => 'ok' in x)).toHaveLength(1);
    expect(results.filter((x) => 'error' in x && x.error === 'carTaken')).toHaveLength(3);
  });
});

describe('who may save a rental, and with what', () => {
  it('staff may; a turned-off person may not; a car under repair cannot go out; bad input is refused', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const leaver = (await samplePerson()).id;
    expect(await turnOff(owner, leaver, 'Sample: left SNS')).toMatchObject({ ok: true });
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    expect(await createRental(staff, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toMatchObject({ ok: true });
    expect(await createRental(leaver, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'notAllowed' });
    expect(await createRental(staff, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 0 })).toEqual({ error: 'daysInvalid' });
    expect(await createRental(staff, { customerId: 'nope', vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'customerNotFound' });
    expect(await createRental(staff, { customerId, vehicleId: carId, pickupAt: new Date('x'), days: 1 })).toEqual({ error: 'pickupInvalid' });
    expect(await changeStatus(owner, carId, { status: 'repair', reason: 'Sample: brakes' }, 'available' as never)).toMatchObject({ ok: true });
    expect(await createRental(staff, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'carNotAvailable' });
  });
});
