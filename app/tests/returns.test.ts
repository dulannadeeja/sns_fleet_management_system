import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { receiveCar, rentalBill, type ReturnInput } from '../src/modules/rentals/returns';
import { recordPayment } from '../src/modules/money/payments';
import { statusOf } from '../src/modules/cars/status';
import { carIsOut } from '../src/modules/rentals/rentals';
import { setPermission } from '../src/modules/people/people';
import { samplePerson } from './helpers/people';
import { ensureFuelPrice, outRental } from './helpers/handover';

// ST-07.1, receive the car and settle the bill (system design 7.4 "Receiving the car", 8.4; Confirmed 11 Nov 2026).
// Each test hands over its own sample car (1,000 km out, full tank, every accessory there).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const back = (accessories: { item: string; present: boolean }[], extra: Partial<ReturnInput> = {}): ReturnInput =>
  ({ inKm: 1150, fuel: 'full', accessories, checked: true, nextState: 'available', payLaterNote: 'Sample: pays Friday', ...extra });

describe('ST-07.1: receive the car', { timeout: 60_000 }, () => {
  it('the bill line by line, each with who gets it; the car is free again and the rental returned', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories))).toEqual({ ok: true });
    const bill = (await rentalBill(r.rentalId))!;
    expect(bill.lines.map((l) => [l.kind, l.amount, l.partnerShare])).toEqual([['rent', 4500, 3825], ['extraKm', 1250, 1062]]);
    expect(bill.total).toBe(5750);
    expect(bill.partnerTotal).toBe(4887);
    expect(await carIsOut(r.carId)).toBe(false);
    expect((await statusOf(r.carId)).status).toBe('available');
    const { rows } = await pool.query('select status from rental where id = $1', [r.rentalId]);
    expect(rows[0].status).toBe('returned');
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories))).toEqual({ error: 'notOut' });
  });

  it('refuses an incoming odometer below the outgoing one, an unchecked list, or a list that is not the handover\'s', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { inKm: 999 }))).toEqual({ error: 'kmLower', outKm: 1000 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { checked: false }))).toEqual({ error: 'notChecked' });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories.slice(1)))).toEqual({ error: 'listChanged' });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { nextState: 'repair' }))).toEqual({ error: 'nextReasonMissing' });
  });

  it('late: only when late; an amount needs no reason, waiving needs one; it follows the commission', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { late: { amount: 1000 } }))).toEqual({ error: 'notLate' });
    await pool.query("update rental set pickup_at = now() - interval '2 days', deadline_at = now() - interval '100 minutes' where id = $1", [r.rentalId]);
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories))).toEqual({ error: 'lateMissing', lateMinutes: expect.any(Number) });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { late: { waiveReason: ' ' } }))).toEqual({ error: 'lateMissing', lateMinutes: expect.any(Number) });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { late: { amount: 1000 } }))).toEqual({ ok: true });
    const late = (await rentalBill(r.rentalId))!.lines.find((l) => l.kind === 'late')!;
    expect(late).toMatchObject({ amount: 1000, partnerShare: 850, allocation: 'commission' });
  });

  it('same-level fuel: whole litres × the saved price, 100% SNS, or waived with a reason; fuel not counted has no line', async () => {
    const r = await outRental({ days: 1, fuel: 'sameLevel' });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { fuel: 'half' }))).toEqual({ error: 'fuelMissing' });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { fuel: 'half', fuelCharge: { litres: 8 }, fuelTakenOut: 5 }))).toEqual({ ok: true });
    const fuel = (await rentalBill(r.rentalId))!.lines.find((l) => l.kind === 'fuel')!;
    const price = (await ensureFuelPrice());
    expect(fuel).toMatchObject({ amount: 8 * price, allocation: 'sns', partnerShare: null, details: { litres: 8, price } });
    const plain = await outRental({ days: 1 });
    expect(await receiveCar(plain.owner, plain.rentalId, back(plain.accessories, { fuel: 'quarter' }))).toEqual({ ok: true });
    expect((await rentalBill(plain.rentalId))!.lines.some((l) => l.kind === 'fuel')).toBe(false);
  });

  it('unpaid beyond the deposit held needs "Allow payment after return" and a note', async () => {
    const r = await outRental({ days: 1, deposit: 1000 });
    const staff = (await samplePerson()).id;
    expect(await setPermission(r.owner, staff, 'allowPaymentAfterReturn', false)).toMatchObject({ ok: true });
    expect(await receiveCar(staff, r.rentalId, back(r.accessories, { payLaterNote: '' }))).toMatchObject({ error: 'payLaterNotAllowed' });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { payLaterNote: ' ' }))).toMatchObject({ error: 'payLaterNoteMissing', unpaid: 5750 });
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 4500 }], parts: [{ method: 'cash', amount: 4500 }] })).toMatchObject({ ok: true });
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'deposit', rentals: [{ rentalId: r.rentalId, amount: 1000 }], parts: [{ method: 'cash', amount: 1000 }] })).toMatchObject({ ok: true });
    // 5,750 − 4,500 paid − 1,000 deposit held = 250 not covered.
    expect(await receiveCar(staff, r.rentalId, back(r.accessories, { payLaterNote: '' }))).toMatchObject({ error: 'payLaterNotAllowed', unpaid: 250 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories))).toEqual({ ok: true });
    const bill = (await rentalBill(r.rentalId))!;
    expect(bill).toMatchObject({ total: 5750, paid: 4500, depositHeld: 1000, unpaid: 250 });
    // A payment after return goes on the bill, up to what is unpaid on it.
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 1251 }], parts: [{ method: 'cash', amount: 1251 }] })).toMatchObject({ error: 'overEstimate' });
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 1250 }], parts: [{ method: 'cash', amount: 1250 }] })).toMatchObject({ ok: true });
    // After return a deposit is used or refunded (#64), never taken.
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'deposit', rentals: [{ rentalId: r.rentalId, amount: 100 }], parts: [{ method: 'cash', amount: 100 }] })).toMatchObject({ error: 'notPayable' });
  });

  it('the car\'s next state is chosen by staff: Under repair needs a reason', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories, { nextState: 'repair', nextReason: 'Sample: brake noise' }))).toEqual({ ok: true });
    expect((await statusOf(r.carId))).toMatchObject({ status: 'repair', reason: 'Sample: brake noise' });
  });

  it('the return and the bill lines can never be changed', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, back(r.accessories))).toEqual({ ok: true });
    await expect(pool.query('update charge set amount = 1 where rental_id = $1', [r.rentalId])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from rental_return where rental_id = $1', [r.rentalId])).rejects.toThrow(/insert-only/);
  });
});
