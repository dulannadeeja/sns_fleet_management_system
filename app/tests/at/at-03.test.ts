import { describe, it, expect } from 'vitest';
import { estimate } from '../../src/lib/rental-days';
import { splitShare } from '../../src/lib/money';

// AT-03 "One-day Wagon R, 150 km, no adjustments: LKR 4,500 base + LKR 1,250 excess = LKR 5,750; owner 4,887 (85% =
// 4,887.50, rounded down) and SNS 863 at 15%" (system design 5.3, 17.3). Wagon R starting package (4.1): 4,500 a day,
// 100 km a day, 25 a km; long-rental extra 500 from day 6.
const wagonR = { dailyRate: 4500, kmPerDay: 100, extraKmRate: 25, longRentalExtra: 500, longRentalFromDay: 6 };

describe('AT-03: one day, 150 km', () => {
  it('bills 4,500 + 1,250 = 5,750 and splits 4,887 / 863 at 15%', () => {
    const e = estimate(wagonR, 1, 150);
    expect(e).toMatchObject({ base: 4500, includedKm: 100, extraKm: 50, extraKmCharge: 1250, longRentalDays: 0, longRental: 0, total: 5750 });
    expect(splitShare(e.total, 8500)).toEqual({ partner: 4887, sns: 863 });
  });
  it('without the km driven, the estimate is the base and extra only', () => {
    expect(estimate(wagonR, 1)).toMatchObject({ base: 4500, extraKm: null, extraKmCharge: 0, total: 4500 });
  });
  it('refuses km that are not a whole, non-negative number', () => {
    expect(() => estimate(wagonR, 1, -1)).toThrow();
    expect(() => estimate(wagonR, 1, 10.5)).toThrow();
  });
});
