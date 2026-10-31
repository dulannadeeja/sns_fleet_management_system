import { describe, it, expect } from 'vitest';
import { splitShare } from '../src/lib/money';

// System design §17.3: whole rupees; the partner's share is rounded down and SNS takes the difference.
describe('splitShare', () => {
  it('gives the partner 85% rounded down and SNS the rest (AT-03 figures)', () => {
    expect(splitShare(5750, 8500)).toEqual({ partner: 4887, sns: 863 });
  });

  it('always adds up to the amount', () => {
    for (const amount of [0, 1, 99, 4500, 5750, 123457, -1, -5750]) {
      for (const bp of [0, 1, 7500, 8500, 10000]) {
        const { partner, sns } = splitShare(amount, bp);
        expect(partner + sns).toBe(amount);
        expect(Number.isInteger(partner) && Number.isInteger(sns)).toBe(true);
      }
    }
  });

  it('splits a negative line as the mirror of the positive one (DN-21; AT-84 figures)', () => {
    expect(splitShare(-5750, 8500)).toEqual({ partner: -4887, sns: -863 });
  });

  it('a full correction undoes the original to the rupee', () => {
    for (const amount of [1, 99, 5750, 123457]) {
      for (const bp of [1, 7500, 8500, 9999]) {
        const plus = splitShare(amount, bp);
        const minus = splitShare(-amount, bp);
        expect(plus.partner + minus.partner).toBe(0);
        expect(plus.sns + minus.sns).toBe(0);
      }
    }
  });

  it('refuses amounts that are not whole rupees', () => {
    expect(() => splitShare(4887.5, 8500)).toThrow();
  });

  it('refuses a share outside 0 to 100%', () => {
    expect(() => splitShare(1000, 10001)).toThrow();
    expect(() => splitShare(1000, -1)).toThrow();
  });
});
