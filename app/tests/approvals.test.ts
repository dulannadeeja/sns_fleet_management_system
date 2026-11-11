import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { askForPrice, decide, withdraw, waitingFor, approvalsList, approvedTerms } from '../src/modules/approvals/approvals';
import { rentalEstimate } from '../src/modules/rentals/rentals';
import { setRentalTerms } from '../src/modules/rentals/terms';
import { agreementState } from '../src/modules/rentals/agreements';
import { recordPayment, rentalMoney } from '../src/modules/money/payments';
import { setPermission } from '../src/modules/people/people';
import { sampleRentalFor } from './helpers/approvals';
import { readyRental } from './helpers/handover';
import { freeCar } from '../src/modules/rentals/handover';

// ST-05.7, ST-10.1, ST-10.2: asking for a different price, approving or rejecting it (system design 3.2 "Asking for a
// different price", Confirmed 11 Nov 2026). Each test adds its own sample car, customer, rental and people.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('ST-05.7: asking for a different price', { timeout: 30_000 }, () => {
  it('a new daily rate: limits, a reason, one waiting at a time, withdrawn by its sender only', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('sns');
    expect(await askForPrice(staff, rentalId, { kind: 'rate', amount: 0, reason: 'x' })).toEqual({ error: 'amountInvalid' });
    expect(await askForPrice(staff, rentalId, { kind: 'rate', amount: 100_001, reason: 'x' })).toEqual({ error: 'amountInvalid' });
    expect(await askForPrice(staff, rentalId, { kind: 'rate', amount: 4000, reason: ' ' })).toEqual({ error: 'reasonMissing' });
    expect(await askForPrice(staff, rentalId, { kind: 'rate', amount: 4000, reason: 'x'.repeat(501) })).toEqual({ error: 'tooLong' });
    expect(await askForPrice(staff, rentalId, { kind: 'rate', amount: 4500, reason: 'Sample' })).toEqual({ error: 'sameRate' });
    const first = await askForPrice(staff, rentalId, { kind: 'rate', amount: 4000, reason: 'Sample: regular customer' });
    if (!('ok' in first)) throw new Error(JSON.stringify(first));
    expect(await askForPrice(staff, rentalId, { kind: 'discount', amount: 500, reason: 'Sample' })).toEqual({ error: 'alreadyWaiting' });
    expect(await waitingFor(rentalId)).toMatchObject({ id: first.id, kind: 'rate', newDailyRate: 4000, rateWas: 4500 });
    expect(await withdraw(admin, first.id)).toEqual({ error: 'notYours' });
    expect(await withdraw(staff, first.id)).toEqual({ ok: true });
    expect(await waitingFor(rentalId)).toBeNull();
    expect(await askForPrice(staff, rentalId, { kind: 'discount', amount: 500, reason: 'Sample' })).toMatchObject({ ok: true });
  });

  it('a discount is LKR 1 up to the estimate', async () => {
    const { staff, rentalId } = await sampleRentalFor('sns');
    const est = (await rentalEstimate(rentalId))!.total;
    expect(await askForPrice(staff, rentalId, { kind: 'discount', amount: est + 1, reason: 'Sample' })).toEqual({ error: 'amountInvalid' });
    expect(await askForPrice(staff, rentalId, { kind: 'discount', amount: est, reason: 'Sample' })).toMatchObject({ ok: true });
  });

  it('needs Customer access to ask', async () => {
    const { owner, staff, rentalId } = await sampleRentalFor('sns');
    expect(await setPermission(owner, staff, 'customerAccess', false)).toMatchObject({ ok: true });
    expect(await askForPrice(staff, rentalId, { kind: 'rate', amount: 4000, reason: 'Sample' })).toEqual({ error: 'notAllowed' });
  });
});

describe('ST-10.2: approve or reject', { timeout: 30_000 }, () => {
  it('approving a lower rate: the saved terms stay, the estimate uses the approved rate; the history keeps who, when and the note', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('sns');
    const before = (await rentalEstimate(rentalId))!;
    const ask = await askForPrice(staff, rentalId, { kind: 'rate', amount: 4000, reason: 'Sample: regular customer' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    // Nothing changes until it is decided.
    expect((await rentalEstimate(rentalId))!.total).toBe(before.total);
    expect(await decide(staff, ask.id, { approve: true })).toEqual({ error: 'notAllowed' });
    expect(await decide(admin, ask.id, { approve: true, note: 'Sample: fine' })).toEqual({ ok: true });
    const after = (await rentalEstimate(rentalId))!;
    expect(after.base).toBe(before.base - 3 * 500);
    expect(await approvedTerms(rentalId)).toMatchObject({ dailyRate: 4000, discount: 0 });
    const { rows: seg } = await pool.query('select daily_rate from rental_vehicle_segment where rental_id = $1', [rentalId]);
    expect(Number(seg[0].daily_rate)).toBe(4500);
    const { rows: ev } = await pool.query("select details from rental_event where rental_id = $1 and kind = 'approval'", [rentalId]);
    expect(ev[0].details).toMatchObject({ outcome: 'approved', note: 'Sample: fine', reason: 'Sample: regular customer' });
    expect(await decide(admin, ask.id, { approve: false, note: 'x' })).toEqual({ error: 'decided' });
  });

  it('rejecting needs a note; nothing changes', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('sns');
    const before = (await rentalEstimate(rentalId))!.total;
    const ask = await askForPrice(staff, rentalId, { kind: 'discount', amount: 1000, reason: 'Sample' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await decide(admin, ask.id, { approve: false, note: ' ' })).toEqual({ error: 'noteMissing' });
    expect(await decide(admin, ask.id, { approve: false, note: 'Sample: not this time' })).toEqual({ ok: true });
    expect((await rentalEstimate(rentalId))!.total).toBe(before);
  });

  it('nobody approves their own request; the primary owner may, marked self-approved (DN-01)', async () => {
    const { owner, admin, rentalId } = await sampleRentalFor('sns');
    const own = await askForPrice(admin, rentalId, { kind: 'discount', amount: 100, reason: 'Sample' });
    if (!('ok' in own)) throw new Error(JSON.stringify(own));
    expect(await decide(admin, own.id, { approve: true })).toEqual({ error: 'ownRequest' });
    expect((await approvalsList(admin, 'waiting')).some((a) => a.id === own.id)).toBe(false);
    expect(await withdraw(admin, own.id)).toEqual({ ok: true });
    const mine = await askForPrice(owner, rentalId, { kind: 'discount', amount: 100, reason: 'Sample' });
    if (!('ok' in mine)) throw new Error(JSON.stringify(mine));
    expect(await decide(owner, mine.id, { approve: true })).toEqual({ ok: true });
    expect((await approvalsList(owner, 'approved')).find((a) => a.id === mine.id)).toMatchObject({ selfApproved: true });
    expect((await rentalEstimate(rentalId))!.discount).toBe(100);
  });

  it('before handover an approval puts the signed agreement out of date; a lower price than paid goes ahead', async () => {
    const { rentalId, customerId, owner } = await readyRental();
    const staff = owner;
    expect(await recordPayment(owner, { key: randomUUID(), customerId, for: 'bill', rentals: [{ rentalId, amount: 9000 }], parts: [{ method: 'cash', amount: 9000 }] })).toMatchObject({ ok: true });
    expect(await agreementState(rentalId)).toMatchObject({ outOfDate: false });
    const ask = await askForPrice(staff, rentalId, { kind: 'discount', amount: 2000, reason: 'Sample' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await decide(owner, ask.id, { approve: true })).toEqual({ ok: true });
    expect(await agreementState(rentalId)).toMatchObject({ outOfDate: true });
    const m = (await rentalMoney(rentalId))!;
    expect(m.paid).toBe(9000);
    expect(m.unpaid).toBeLessThan(0);
    // The deposit form still works as before on the same rental.
    expect(await setRentalTerms(owner, rentalId, { deposit: 10_000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false })).toEqual({ ok: true });
  });

  it('requests and decisions can never be changed', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('sns');
    const ask = await askForPrice(staff, rentalId, { kind: 'discount', amount: 100, reason: 'Sample' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await decide(admin, ask.id, { approve: true })).toEqual({ ok: true });
    await expect(pool.query('update approval_request set discount = 1 where id = $1', [ask.id])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from approval_decision where request_id = $1', [ask.id])).rejects.toThrow(/insert-only/);
  });

  it('a request still waiting when the rental ends closes by itself and leaves the list (11 Nov 2026)', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('sns');
    const ask = await askForPrice(staff, rentalId, { kind: 'discount', amount: 100, reason: 'Sample:  two  spaces kept' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await waitingFor(rentalId)).toMatchObject({ reason: 'Sample:  two  spaces kept' });
    // Not collected 2 hours after saving, nothing paid: the car is freed (#57), and the request closes.
    await pool.query("update rental set created_at = now() - interval '3 hours' where id = $1", [rentalId]);
    expect(await freeCar(admin, rentalId, 'Sample: customer did not come')).toEqual({ ok: true });
    expect(await waitingFor(rentalId)).toBeNull();
    expect((await approvalsList(admin, 'waiting')).some((a) => a.id === ask.id)).toBe(false);
    const { rows } = await pool.query('select outcome from approval_decision where request_id = $1', [ask.id]);
    expect(rows).toEqual([{ outcome: 'closed' }]);
  });
});
