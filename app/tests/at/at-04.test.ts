import { describe, it, expect } from 'vitest';
import { receiveCar, rentalBill } from '../../src/modules/rentals/returns';
import { outRental } from '../helpers/handover';
import { estimate } from '../../src/lib/rental-days';
import { splitShare } from '../../src/lib/money';

// AT-04 "Six-day Wagon R, at most 600 km, default package: LKR 27,000 base + LKR 500 surcharge = LKR 27,500; SNS 4,125
// and owner 23,375" (system design 5.2: km pooled over the rental; day 6 onward adds the long-rental extra).
const wagonR = { dailyRate: 4500, kmPerDay: 100, extraKmRate: 25, longRentalExtra: 500, longRentalFromDay: 6 };

describe('AT-04: six days, at most 600 km', () => {
  it('bills 27,000 + 500 = 27,500 with 600 km pooled', () => {
    expect(estimate(wagonR, 6, 600)).toMatchObject({ base: 27000, includedKm: 600, extraKm: 0, longRentalDays: 1, longRental: 500, total: 27500 });
    // Pooled: one long day and quieter others still fit the 600 km.
    expect(estimate(wagonR, 6, 420).total).toBe(27500);
    expect(splitShare(27500, 8500)).toEqual({ partner: 23375, sns: 4125 });
  });
  it('day seven adds another 500; days one to five add none', () => {
    expect(estimate(wagonR, 5).longRental).toBe(0);
    expect(estimate(wagonR, 7).longRental).toBe(1000);
  });
  it('uses the car\'s own surcharge amount and starting day', () => {
    expect(estimate({ ...wagonR, longRentalExtra: 300, longRentalFromDay: 3 }, 4).longRental).toBe(600);
  });

  it('at return within 600 km: 27,000 + 500 = 27,500; SNS 4,125 and the partner 23,375 (#63)', { timeout: 60_000 }, async () => {
    const r = await outRental({ days: 6 });
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1600, fuel: 'full', accessories: r.accessories, checked: true, nextState: 'available', payLaterNote: 'Sample' })).toEqual({ ok: true });
    const bill = (await rentalBill(r.rentalId))!;
    expect(bill.lines.map((l) => [l.kind, l.amount])).toEqual([['rent', 27000], ['longRental', 500]]);
    expect({ total: bill.total, partner: bill.partnerTotal, sns: bill.total - bill.partnerTotal }).toEqual({ total: 27500, partner: 23375, sns: 4125 });
  });
});
