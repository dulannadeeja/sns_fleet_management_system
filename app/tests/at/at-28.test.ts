import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { handOver } from '../../src/modules/rentals/handover';
import { listRentals, overdueCount } from '../../src/modules/rentals/list';
import { ensureAccessories, readyRental } from '../helpers/handover';

// AT-28: "Staff open Overdue 1 from the navigation or attention summary: the rentals list opens showing only the
// overdue rental, with a visible filter that can be removed" (system design 12; ST-06.1). Here the list and the count
// behind the menu's badge; the badge link and the removable filter are in the browser journey (tests/e2e/new-rental.spec.ts).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('AT-28: the overdue filter', { timeout: 30_000 }, () => {
  it('shows only overdue rentals, and the menu counts them', async () => {
    const accessories = (await ensureAccessories()).map((item) => ({ item, present: true }));
    const late = await readyRental();
    const onTime = await readyRental();
    for (const r of [late, onTime]) expect(await handOver(r.owner, r.rentalId, { outKm: 10, fuel: 'full', accessories, checked: true })).toEqual({ ok: true });
    // A sample: the late one's deadline moved an hour into the past (only the test, as superuser, can do this).
    await pool.query("update rental set pickup_at = now() - interval '2 days', deadline_at = now() - interval '1 hour' where id = $1", [late.rentalId]);
    // The menu's count includes it (other tests' rentals share the database, so at least one).
    expect(await overdueCount()).toBeGreaterThanOrEqual(1);
    const rows = Object.values((await listRentals({ filter: 'overdue' })).groups).flat();
    expect(rows.some((r) => r.id === late.rentalId)).toBe(true);
    expect(rows.some((r) => r.id === onTime.rentalId)).toBe(false);
    expect(rows.every((r) => r.overdue)).toBe(true);
  });
});
