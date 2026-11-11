import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { askForPrice, decide } from '../../src/modules/approvals/approvals';
import { sampleRentalFor } from '../helpers/approvals';

// AT-16 (PARTIAL: the approval part, #56; the adjustment lines on final or cashed-out earnings come with the day close,
// Phase 3, and corrections, #65): "Approved correction affects earnings already final or cashed out: original lines
// unchanged; a dated adjustment line reduces or increases the balance". Here: the approval is its own dated decision;
// the rental's original terms are never changed.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('AT-16 (partial): an approved price change keeps the original terms', { timeout: 30_000 }, () => {
  it('adds a dated decision; the saved segment terms stay as they were', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('partner');
    const { rows: before } = await pool.query('select daily_rate, commission_percent from rental_vehicle_segment where rental_id = $1', [rentalId]);
    const ask = await askForPrice(staff, rentalId, { kind: 'rate', amount: 4000, reason: 'Sample' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await decide(admin, ask.id, { approve: true })).toEqual({ ok: true });
    const { rows: after } = await pool.query('select daily_rate, commission_percent from rental_vehicle_segment where rental_id = $1', [rentalId]);
    expect(after).toEqual(before);
    const { rows } = await pool.query('select outcome, created_at from approval_decision where request_id = $1', [ask.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].outcome).toBe('approved');
  });
});
