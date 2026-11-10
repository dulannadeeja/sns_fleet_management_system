import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { createRental, freeCarsNow } from '../src/modules/rentals/rentals';
import { addHandoverPhoto, freeCar, handOver, handoverChecklist, handoverOf, openHandoverPhoto } from '../src/modules/rentals/handover';
import { recordPayment } from '../src/modules/money/payments';
import { setPermission } from '../src/modules/people/people';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';
import { ensureAccessories, readyRental } from './helpers/handover';
import { JPEG, NOT_A_PHOTO } from './helpers/customers';
import { randomUUID } from 'node:crypto';

// ST-06.4, hand over the car (system design 6 "Handover requirements" and "Handing over the car", Confirmed 10 Nov
// 2026). Each test adds its own sample car, customer and rental.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const ticks = async (missing: string[] = []) => (await ensureAccessories()).map((item) => ({ item, present: !missing.includes(item) }));

// Each rental here is made ready from scratch (copies, terms, print, signature): slower than most tests.
describe('ST-06.4: hand over the car', { timeout: 30_000 }, () => {
  it('records the odometer, fuel and checklist; the rental is active and keeps what was ticked', async () => {
    const { rentalId, owner } = await readyRental();
    expect(await handoverChecklist(rentalId)).toMatchObject({ status: 'draft', missing: [] });
    expect(await handOver(owner, rentalId, { outKm: 1200, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    expect(await handoverChecklist(rentalId)).toMatchObject({ status: 'active' });
    expect(await handoverOf(rentalId)).toMatchObject({ outKm: 1200, fuel: 'full' });
    const { rows } = await pool.query("select action from audit_event where action = 'rental.handover' and target_id = $1", [rentalId]);
    expect(rows).toHaveLength(1);
    expect(await handOver(owner, rentalId, { outKm: 1200, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'notDraft' });
  });

  it('refuses a wrong odometer, fuel level, or a list that changed since it was shown', async () => {
    const { rentalId, owner } = await readyRental();
    const accessories = await ticks();
    expect(await handOver(owner, rentalId, { outKm: -1, fuel: 'full', accessories, checked: true })).toEqual({ error: 'kmInvalid' });
    expect(await handOver(owner, rentalId, { outKm: 1_000_000, fuel: 'full', accessories, checked: true })).toEqual({ error: 'kmInvalid' });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'eighth' as 'full', accessories, checked: true })).toEqual({ error: 'fuelInvalid' });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: accessories.slice(1), checked: true })).toEqual({ error: 'listChanged' });
    // The checklist counts only once staff confirm they checked the car (10 Nov 2026).
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories, checked: false })).toEqual({ error: 'notChecked' });
  });

  it('a car out stays with its rental, also past its deadline: no other rental takes it or is handed it (Derived control)', async () => {
    const { rentalId, carId, customerId, owner } = await readyRental();
    // A second saved rental for the same car whose hold no longer overlaps (a sample: the first one's hold freed).
    await pool.query('delete from vehicle_hold where rental_id = $1', [rentalId]);
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'carTaken' });
    expect((await freeCarsNow()).some((c) => c.id === carId)).toBe(false);
  });

  it('refuses a handover once the return time has passed', async () => {
    const { rentalId, owner } = await readyRental();
    // A sample: the deadline moved into the past (only the test, as superuser, can do this).
    await pool.query("update rental set pickup_at = now() - interval '2 days', deadline_at = now() - interval '1 minute' where id = $1", [rentalId]);
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'blocked', missing: ['deadlinePassed'] });
  });

  it('not collected after 2 hours: with nothing paid, staff free the car with a reason; then it cannot go out', async () => {
    const { rentalId, carId, customerId, owner } = await readyRental();
    expect(await freeCar(owner, rentalId, 'Sample: customer did not come')).toEqual({ error: 'tooSoon' });
    await pool.query("update rental set created_at = now() - interval '2 hours' where id = $1", [rentalId]);
    expect((await handoverChecklist(rentalId))!.notCollected).toBe(true);
    expect(await freeCar(owner, rentalId, ' ')).toEqual({ error: 'reasonMissing' });
    expect(await freeCar(owner, rentalId, 'Sample: customer did not come')).toEqual({ ok: true });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'notDraft' });
    // The car is free for another customer now.
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toMatchObject({ ok: true });
  });

  it('something paid: the car stays held (cancel comes with #59)', async () => {
    const { rentalId, customerId, owner } = await readyRental();
    expect(await recordPayment(owner, { key: randomUUID(), customerId, for: 'deposit', rentals: [{ rentalId, amount: 500 }], parts: [{ method: 'cash', amount: 500 }] })).toMatchObject({ ok: true });
    await pool.query("update rental set created_at = now() - interval '3 hours' where id = $1", [rentalId]);
    expect(await freeCar(owner, rentalId, 'Sample')).toEqual({ error: 'paid' });
  });

  it('the odometer cannot be lower than the car\'s last reading', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const earlier = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 });
    if (!('ok' in earlier)) throw new Error(JSON.stringify(earlier));
    // A sample earlier return reading on this car (returns come with #63; km readings are the only segment change
    // allowed), and its hold freed so the next rental can have the car.
    await pool.query('update rental_vehicle_segment set in_km = 5000 where rental_id = $1', [earlier.id]);
    await pool.query('delete from vehicle_hold where rental_id = $1', [earlier.id]);
    const { rentalId } = await readyRental({ carId });
    expect((await handoverChecklist(rentalId))!.lastKm).toBe(5000);
    expect(await handOver(owner, rentalId, { outKm: 4999, fuel: 'half', accessories: await ticks(), checked: true })).toEqual({ error: 'kmLower', lastKm: 5000 });
    expect(await handOver(owner, rentalId, { outKm: 5000, fuel: 'half', accessories: await ticks(), checked: true })).toEqual({ ok: true });
  });

  it('a car with past or missing papers needs "Override expired-document warnings" and a reason', async () => {
    const { rentalId, owner } = await readyRental({ papers: false });
    const staff = (await samplePerson()).id;
    const accessories = await ticks();
    expect((await handoverChecklist(rentalId))!.papers.expired).toBe(true);
    expect(await handOver(staff, rentalId, { outKm: 10, fuel: 'full', accessories, checked: true, papersReason: 'Sample' })).toEqual({ error: 'papersNotAllowed' });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories, checked: true })).toEqual({ error: 'reasonMissing' });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories, checked: true, papersReason: 'x'.repeat(501) })).toEqual({ error: 'tooLong' });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories, checked: true, papersReason: 'Sample: renewal paid, paper comes Monday' })).toEqual({ ok: true });
    expect((await handoverOf(rentalId))!.papersReason).toBe('Sample: renewal paid, paper comes Monday');
  });

  it('money is shown, never required', async () => {
    const { rentalId, customerId, owner } = await readyRental({ terms: { rentPaid: 'now' } });
    const c = (await handoverChecklist(rentalId))!;
    expect(c.money).toMatchObject({ depositSet: 10_000, depositReceived: 0, rentPaid: 'now' });
    expect(c.money!.unpaid).toBeGreaterThan(0);
    expect(c.missing).toEqual([]);
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    // A payment can still be recorded on the active rental.
    expect(await recordPayment(owner, { key: randomUUID(), customerId, for: 'bill', rentals: [{ rentalId, amount: 100 }], parts: [{ method: 'cash', amount: 100 }] })).toMatchObject({ ok: true });
  });

  it('needs Customer access', async () => {
    const { rentalId, owner } = await readyRental();
    const staff = (await samplePerson()).id;
    expect(await setPermission(owner, staff, 'customerAccess', false)).toMatchObject({ ok: true });
    expect(await handOver(staff, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'notAllowed' });
  });

  it('condition photos: optional, private, up to 10, only before the car goes out; opening one is logged', async () => {
    const { rentalId, owner } = await readyRental();
    expect(await addHandoverPhoto(owner, rentalId, NOT_A_PHOTO)).toEqual({ error: 'fileType' });
    expect(await addHandoverPhoto(owner, rentalId, JPEG)).toEqual({ ok: true });
    const [photo] = (await handoverChecklist(rentalId))!.photos;
    expect(await openHandoverPhoto(owner, rentalId, photo.id)).toMatchObject({ ok: true, contentType: 'image/jpeg' });
    const { rows } = await pool.query("select 1 from audit_event where action = 'rental.photoOpened' and target_id = $1", [rentalId]);
    expect(rows).toHaveLength(1);
    for (let i = 1; i < 10; i++) expect(await addHandoverPhoto(owner, rentalId, JPEG)).toEqual({ ok: true });
    expect(await addHandoverPhoto(owner, rentalId, JPEG)).toEqual({ error: 'tooMany' });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
    await expect(pool.query('delete from handover_photo where rental_id = $1', [rentalId])).rejects.toThrow(/insert-only/);
    await expect(pool.query('update rental_handover set out_km = 1 where rental_id = $1', [rentalId])).rejects.toThrow(/insert-only/);
  });
});
