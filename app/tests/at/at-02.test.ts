import { describe, it, expect } from 'vitest';
import { deadlineFor } from '../../src/lib/rental-days';

// AT-02 "Pickup Monday exactly 3 PM: one-day deadline Wednesday 8 AM" (system design 5.1: a pickup exactly at the
// cutoff belongs to the next rental day). Asia/Colombo times.
describe('AT-02: a pickup at or after the cutoff ends day one the morning after next', () => {
  it('Monday exactly 3 PM → Wednesday 8 AM', () => {
    expect(deadlineFor(new Date('2026-11-02T15:00:00+05:30'), 1, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-04T08:00:00+05:30').toISOString());
  });
  it('one minute before the cutoff is still the same day; late evening is the next', () => {
    expect(deadlineFor(new Date('2026-11-02T14:59:00+05:30'), 1, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-03T08:00:00+05:30').toISOString());
    expect(deadlineFor(new Date('2026-11-02T23:30:00+05:30'), 2, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-05T08:00:00+05:30').toISOString());
  });
  it('the Colombo day is used, not the server\'s: 1 AM Tuesday in Colombo is still Monday in UTC', () => {
    // 2026-11-03T01:00+05:30 = 2026-11-02T19:30Z. Before the cutoff on Tuesday → Wednesday 8 AM.
    expect(deadlineFor(new Date('2026-11-02T19:30:00Z'), 1, '15:00', '08:00').toISOString()).toBe(new Date('2026-11-04T08:00:00+05:30').toISOString());
  });
});
