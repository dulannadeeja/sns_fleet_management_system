import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { addCar, editCar, getCar, termsAt } from '../../src/modules/cars/cars';
import { theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-05, the car half only (PARTIAL: the "active rental keeps its old terms" half needs rentals, Phase 2):
// "Admin changes package while rental active: old rental/extension retains old snapshot; new rental uses new version".
// System design 4.3 (Confirmed), PR-08. A package change is a new dated version; the old one is never changed.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('AT-05 (car half, partial): a package change applies to new rentals; the old terms are kept', () => {
  it('keeps the terms that applied before the change, and gives the new ones from then on', async () => {
    const owner = await theOwner();
    const added = await addCar(owner, { registration: samplePlate(), model: 'Wagon R', ownership: 'sns' });
    if (!('ok' in added)) throw new Error(added.error);
    const before = new Date();
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
