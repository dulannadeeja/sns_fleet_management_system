import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { handOver } from '../../src/modules/rentals/handover';
import { ensureAccessories, readyRental } from '../helpers/handover';
import { carIsOut, createRental } from '../../src/modules/rentals/rentals';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
import { samplePerson, theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-08 (the handover since #57): "Two employees submit handovers for same vehicle: only one
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

const ticks = async (missing: string[] = []) => (await ensureAccessories()).map((item) => ({ item, present: !missing.includes(item) }));

describe('AT-08: two people hand over the same car at the same moment (#57)', { timeout: 30_000 }, () => {
  it('only one handover succeeds', async () => {
    const { rentalId, carId, owner } = await readyRental();
    const staff = (await samplePerson()).id;
    const accessories = await ticks();
    const results = await Promise.all([owner, staff, owner, staff].map((a) => handOver(a, rentalId, { outKm: 10, fuel: 'full', accessories, checked: true })));
    expect(results.filter((r) => 'ok' in r)).toHaveLength(1);
    expect(results.filter((r) => 'error' in r && r.error === 'notDraft')).toHaveLength(3);
    const { rows } = await pool.query('select count(*)::int as n from rental_handover where rental_id = $1', [rentalId]);
    expect(rows[0].n).toBe(1);
    // The car is now out: a second rental cannot take it (also past this one's deadline; tests/handover.test.ts).
    expect(await carIsOut(carId)).toBe(true);
  });
});
