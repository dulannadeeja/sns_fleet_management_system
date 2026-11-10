import { describe, it, expect } from 'vitest';
import { handOver, handoverOf } from '../../src/modules/rentals/handover';
import { ensureAccessories, readyRental } from '../helpers/handover';

// AT-53: "A car goes out with its spare-wheel tool missing and a quarter tank: handover finishes once the fuel level and
// checklist are recorded; at return the missing tool is not charged to this customer" (system design 6, Confirmed;
// the return side comes with #63: the handover keeps what was missing).
describe('AT-53: a missing accessory and a quarter tank never block handover', { timeout: 30_000 }, () => {
  it('finishes once both are recorded, and keeps what was missing', async () => {
    const { rentalId, owner } = await readyRental();
    const list = await ensureAccessories();
    const accessories = list.map((item, i) => ({ item, present: i !== 0 }));
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'quarter', accessories, checked: true })).toEqual({ ok: true });
    expect(await handoverOf(rentalId)).toMatchObject({ fuel: 'quarter', accessories: [{ item: list[0], present: false }, ...list.slice(1).map((item) => ({ item, present: true }))] });
  });
});
