import { describe, it, expect } from 'vitest';
import { receiveCar } from '../../src/modules/rentals/returns';
import { outRental } from '../helpers/handover';

// AT-63: "A car goes to the garage for a planned service after a rental: no garage-day charge can be added to that
// customer's bill" (ST-07.2; 7.4 "Receiving the car": garage days only on a return that records damage).
describe('AT-63: a planned service is never garage days', { timeout: 60_000 }, () => {
  it('refuses garage days without damage, also with the car under repair', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1100, fuel: 'full', accessories: r.accessories, checked: true, payLaterNote: 'Sample',
      nextState: 'repair', nextReason: 'Sample: planned service', garageDays: 2 })).toEqual({ error: 'garageNeedsDamage' });
  });
});
