import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { addCar, editCar, getCar, termsAt } from '../../src/modules/cars/cars';
import { theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';
import { createRental, rentalEstimate, rentalTerms } from '../../src/modules/rentals/rentals';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-05 (PARTIAL: an extension keeping the original rates is checked with #61, Extend by phone):
// "Admin changes package while rental active: old rental/extension retains old snapshot; new rental uses new version".
// System design 4.3 (Confirmed), PR-08. A package change is a new dated version; the old one is never changed.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('AT-05 (car half, partial): a package change applies to new rentals; the old terms are kept', () => {
  it('keeps the terms that applied before the change, and gives the new ones from then on', async () => {
    const owner = await theOwner();
    const added = await addCar(owner, { registration: samplePlate(), model: 'Wagon R', ownership: 'sns' });
    if (!('ok' in added)) throw new Error(added.error);
    // The database's own time of the first version (not the app's clock): a rental agreed then keeps it.
    const [{ effective_from: first }] = (await pool.query('select effective_from from vehicle_terms_version where vehicle_id = $1', [added.id])).rows;
    const before = new Date((first as Date).getTime() + 1); // a JS date drops the database's microseconds
    const car = (await getCar(added.id))!;
    const changed = await editCar(owner, added.id, { ...car.terms, dailyRate: 4800 }, car.terms);
    expect(changed).toEqual({ ok: true, changed: ['dailyRate'] });

    expect((await termsAt(added.id, before))!.dailyRate).toBe(4500); // a rental agreed before keeps 4,500
    expect((await termsAt(added.id, new Date()))!.dailyRate).toBe(4800); // a new rental gets 4,800
    expect((await getCar(added.id))!.terms.dailyRate).toBe(4800);
    // The old version can never be changed or removed.
    await expect(pool.query('update vehicle_terms_version set daily_rate = 1 where vehicle_id = $1', [added.id])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from vehicle_terms_version where vehicle_id = $1', [added.id])).rejects.toThrow(/insert-only/);
  });
});

describe('AT-05 (rental half): a rental keeps the terms it was agreed with', () => {
  it('a rental saved before the package change keeps 4,500; one saved after gets 4,800', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const before = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 });
    if (!('ok' in before)) throw new Error(JSON.stringify(before));
    const car = (await getCar(carId))!;
    expect(await editCar(owner, carId, { ...car.terms, dailyRate: 4800, kmPerDay: 120 }, car.terms)).toMatchObject({ ok: true });
    const after = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 });
    if (!('ok' in after)) throw new Error(JSON.stringify(after));

    expect((await rentalTerms(before.id))!.segments[0]).toMatchObject({ dailyRate: 4500, kmPerDay: 100 });
    expect((await rentalEstimate(before.id))!.base).toBe(9000);
    expect((await rentalTerms(after.id))!.segments[0]).toMatchObject({ dailyRate: 4800, kmPerDay: 120 });
    expect((await rentalEstimate(after.id))!.base).toBe(9600);
    // The saved copy can never be changed afterwards.
    await expect(pool.query('update rental_vehicle_segment set daily_rate = 1 where rental_id = $1', [before.id])).rejects.toThrow(/insert-only/);
    await pool.query('update rental_vehicle_segment set out_km = 12000 where rental_id = $1', [before.id]); // readings may be added
  });
});
