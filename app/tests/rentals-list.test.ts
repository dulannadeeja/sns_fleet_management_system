import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { nextDeadlineAfter, rentalDays } from '../src/lib/rental-days';
import { handOver } from '../src/modules/rentals/handover';
import { listRentals, overdueCount, rentalHistory } from '../src/modules/rentals/list';
import { ensureAccessories, readyRental } from './helpers/handover';

// ST-06.1 to ST-06.3: the rentals list, a rental's days and history, and overdue (system design 7.1, 7.4; boards
// 06.1 to 06.3). Each test adds its own sample rentals; the list is shared, so tests look only for their own rows.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const ticks = async () => (await ensureAccessories()).map((item) => ({ item, present: true }));

describe('rental days (pure)', () => {
  it('the next return deadline after a moment, in Asia/Colombo', () => {
    // 22 Oct 11:05 Colombo (05:35 UTC) → Fri 23 Oct 08:00 Colombo (02:30 UTC).
    expect(nextDeadlineAfter(new Date('2026-10-22T05:35:00Z'), '08:00').toISOString()).toBe('2026-10-23T02:30:00.000Z');
    // 22 Oct 07:00 Colombo → the same morning, 08:00.
    expect(nextDeadlineAfter(new Date('2026-10-22T01:30:00Z'), '08:00').toISOString()).toBe('2026-10-22T02:30:00.000Z');
  });
  it('each rental day ends at a deadline (AT-14: each day is closed once, with the day close in Phase 3)', () => {
    const days = rentalDays(new Date('2026-10-20T05:12:00Z'), 2, '15:00', '08:00');
    expect(days.map((d) => d.endsAt.toISOString())).toEqual(['2026-10-21T02:30:00.000Z', '2026-10-22T02:30:00.000Z']);
    expect(days.map((d) => d.n)).toEqual([1, 2]);
  });
});

describe('ST-06.1: the rentals list', { timeout: 30_000 }, () => {
  it('groups: handover in progress (saved), overdue and the rest (out); the overdue filter shows only overdue rentals (AT-28)', async () => {
    const saved = await readyRental();
    const out = await readyRental();
    expect(await handOver(out.owner, out.rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    const late = await readyRental();
    expect(await handOver(late.owner, late.rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    // A sample: this one's deadline moved 3 hours into the past (only the test, as superuser, can do this).
    await pool.query("update rental set pickup_at = now() - interval '2 days', deadline_at = now() - interval '3 hours' where id = $1", [late.rentalId]);
    const all = await listRentals();
    const groupOf = (id: string) => Object.entries(all.groups).find(([, rows]) => rows.some((r) => r.id === id))?.[0];
    expect(groupOf(saved.rentalId)).toBe('handover');
    expect(groupOf(late.rentalId)).toBe('overdue');
    expect(['dueBack', 'other']).toContain(groupOf(out.rentalId));
    expect(all.groups.overdue.find((r) => r.id === late.rentalId)!.lateMinutes).toBeGreaterThanOrEqual(180);
    expect(all.groups.handover.find((r) => r.id === saved.rentalId)!.checklist).toEqual({ done: 5, total: 5, missing: [] });
    const overdue = await listRentals({ filter: 'overdue' });
    expect(overdue.filter).toBe('overdue');
    expect(Object.values(overdue.groups).flat().every((r) => r.overdue)).toBe(true);
    expect(Object.values(overdue.groups).flat().some((r) => r.id === late.rentalId)).toBe(true);
    expect(await overdueCount()).toBeGreaterThanOrEqual(1);
  });

  it('a rental\'s history: who did what, when, newest first (board 06.2)', async () => {
    const { rentalId, owner } = await readyRental();
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    const h = await rentalHistory(rentalId);
    expect(h.map((e) => e.kind)).toEqual(['handover', 'terms', 'created']);
    expect(h.every((e) => e.byName)).toBe(true);
  });
});
