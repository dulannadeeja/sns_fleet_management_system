import { describe, it, expect } from 'vitest';
import { deadlineFor } from '../../src/lib/rental-days';

// AT-01 "Pickup Monday 2 PM under 3 PM/8 AM settings: one-day deadline Tuesday 8 AM" (system design 5.1, Confirmed).
// Times are read in Asia/Colombo (UTC+05:30). 2 Nov 2026 is a Monday.
describe('AT-01: a pickup before the cutoff ends day one at the next morning\'s deadline', () => {
  it('Monday 2 PM → Tuesday 8 AM', () => {
    expect(deadlineFor(new Date('2026-11-02T14:00:00+05:30'), 1, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-03T08:00:00+05:30').toISOString());
  });
  it('each further day adds one day; the settings are the rental\'s own', () => {
    expect(deadlineFor(new Date('2026-11-02T14:00:00+05:30'), 3, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-05T08:00:00+05:30').toISOString());
    expect(deadlineFor(new Date('2026-11-02T14:00:00+05:30'), 1, '13:00', '09:30').toISOString()).toBe(new Date('2026-11-04T09:30:00+05:30').toISOString());
  });
  it('an early-morning pickup is before the cutoff too: 6 AM ends day one at 8 AM the next day (Confirmed 7 Nov 2026)', () => {
    expect(deadlineFor(new Date('2026-11-03T06:00:00+05:30'), 1, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-04T08:00:00+05:30').toISOString());
  });
  it('the minimum is one full day', () => {
    expect(() => deadlineFor(new Date('2026-11-02T14:00:00+05:30'), 0, '15:00', '08:00')).toThrow();
    expect(() => deadlineFor(new Date('2026-11-02T14:00:00+05:30'), 1.5, '15:00', '08:00')).toThrow();
  });
});
