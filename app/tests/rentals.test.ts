import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { carIsFree, createRental, rentalEstimate, rentalTerms } from '../src/modules/rentals/rentals';
import { changeStatus } from '../src/modules/cars/status';
import { setPermission, turnOff } from '../src/modules/people/people';
import { addFlag, goAhead } from '../src/modules/customers/flags';
import { addCustomer } from '../src/modules/customers/customers';
import { sampleCustomer } from './helpers/customers';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';

// #50 rental foundation (system design 4.3, 5.1, 7.1; TRD › Integrity rules). Each test adds its own sample car,
// customer and a pickup a few minutes ahead.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const DAY = 86_400_000;

describe('a new rental keeps its own copy of the terms', () => {
  it('copies the car\'s package and the owner settings; the deadline follows the cutoff', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const pickupAt = samplePickup();
    const r = await createRental(owner, { customerId, vehicleId: carId, pickupAt, days: 3 });
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    const t = (await rentalTerms(r.id))!;
    expect(t).toMatchObject({ status: 'draft', days: 3, customerId, segments: [{ position: 1, vehicleId: carId, dailyRate: 4500, kmPerDay: 100, extraKmRate: 25 }] });
    expect(t.pickupCutoff).toMatch(/^\d\d:\d\d$/);
    expect(t.deadlineAt.getTime()).toBeGreaterThan(pickupAt.getTime() + 2 * DAY);
    expect((await rentalEstimate(r.id))!.base).toBe(13500);
    // Logged, and its history and saved terms can never be changed.
    const log = await pool.query("select action from audit_event where target_id = $1", [r.id]);
    expect(log.rows.map((x) => x.action)).toEqual(['rental.create']);
    await expect(pool.query('update rental_event set kind = $2 where rental_id = $1', [r.id, 'x'])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from rental_terms_snapshot where rental_id = $1', [r.id])).rejects.toThrow(/insert-only/);
  });
});

describe('one rental or reservation per car at any time (AT-08, AT-30 groundwork)', () => {
  it('refuses a second rental of the same car for overlapping days; the car is free after the deadline', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const pickupAt = samplePickup();
    const first = await createRental(owner, { customerId, vehicleId: carId, pickupAt, days: 2 });
    if (!('ok' in first)) throw new Error(JSON.stringify(first));
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(60), days: 1 })).toEqual({ error: 'carTaken' });
    expect(await carIsFree(carId, pickupAt, new Date(pickupAt.getTime() + DAY))).toBe(false);
    const { deadlineAt } = (await rentalTerms(first.id))!;
    expect(await carIsFree(carId, deadlineAt, new Date(deadlineAt.getTime() + DAY))).toBe(true);
    expect(await carIsFree(carId, deadlineAt, deadlineAt)).toBe(false); // not a real time span
  });

  it('two people saving the same car at the same moment: only one wins', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const pickupAt = samplePickup();
    const results = await Promise.all([owner, staff, owner, staff].map((a) => createRental(a, { customerId, vehicleId: carId, pickupAt, days: 2 })));
    expect(results.filter((x) => 'ok' in x)).toHaveLength(1);
    expect(results.filter((x) => 'error' in x && x.error === 'carTaken')).toHaveLength(3);
  });
});

describe('who may save a rental, and with what (system design 7.1, Confirmed 7 Nov 2026)', () => {
  it('needs Customer access; a turned-off person may not; a car under repair cannot go out', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const leaver = (await samplePerson()).id;
    const noAccess = (await samplePerson()).id;
    expect(await turnOff(owner, leaver, 'Sample: left SNS')).toMatchObject({ ok: true });
    expect(await setPermission(owner, noAccess, 'customerAccess', false)).toMatchObject({ ok: true });
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    expect(await createRental(leaver, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'notAllowed' });
    expect(await createRental(noAccess, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'notAllowed' });
    expect(await changeStatus(owner, carId, { status: 'repair', reason: 'Sample: brakes' }, 'available' as never)).toMatchObject({ ok: true });
    expect(await createRental(staff, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'carNotAvailable' });
  });

  it('a pickup is now or within the next day, never in the past; 1 to 90 days', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const at = (pickupAt: Date, days = 1) => createRental(owner, { customerId, vehicleId: carId, pickupAt, days });
    expect(await at(new Date(Date.now() - 10 * 60_000))).toEqual({ error: 'pickupPast' });
    expect(await at(new Date(Date.now() + DAY + 10 * 60_000))).toEqual({ error: 'pickupTooFar' });
    expect(await at(new Date('x'))).toEqual({ error: 'pickupInvalid' });
    expect(await at(samplePickup(), 0)).toEqual({ error: 'daysInvalid' });
    expect(await at(samplePickup(), 91)).toEqual({ error: 'daysInvalid' });
    expect(await at(samplePickup(), 3e9)).toEqual({ error: 'daysInvalid' });
    expect(await createRental(owner, { customerId: 'nope', vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'customerNotFound' });
    expect(await at(samplePickup(), 90)).toMatchObject({ ok: true });
  });
});

describe('many rentals at once', () => {
  it('twelve saves for twelve cars at the same moment all finish (no waiting on a second connection)', async () => {
    const owner = await theOwner();
    const pairs = await Promise.all(Array.from({ length: 12 }, () => sampleCarAndCustomer(owner)));
    const results = await Promise.all(pairs.map(({ carId, customerId }) => createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })));
    expect(results.every((r) => 'ok' in r)).toBe(true);
  }, 30_000);
});

describe('warnings and the first rental at New rental (system design 7.1, Confirmed 8 Nov 2026)', () => {
  it('a customer with an open flag is rented only with a decision to continue for those warnings, used once', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const other = await sampleCarAndCustomer(owner);
    const flag = await addFlag(owner, customerId, { kind: 'unpaid', details: 'Sample: unpaid bill from an earlier rental' });
    if (!('ok' in flag)) throw new Error(JSON.stringify(flag));
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'warningsNotCleared' });
    const ok = await goAhead(owner, customerId, { reason: 'Sample: regular customer, paying on Monday', shownFlagIds: [flag.id], shownLicenceExpired: false });
    if (!('ok' in ok)) throw new Error(JSON.stringify(ok));
    const r = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1, goAheadId: ok.id });
    expect(r).toMatchObject({ ok: true });
    // The same decision cannot start a second rental; nor can a decision for another customer.
    expect(await createRental(owner, { customerId, vehicleId: other.carId, pickupAt: samplePickup(), days: 1, goAheadId: ok.id })).toEqual({ error: 'warningsNotCleared' });
    expect(await createRental(owner, { customerId: other.customerId, vehicleId: other.carId, pickupAt: samplePickup(), days: 1, goAheadId: ok.id })).toMatchObject({ ok: true });
  });

  it('a decision made before a new flag was added does not cover it', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const f1 = await addFlag(owner, customerId, { kind: 'other', details: 'Sample: first' });
    if (!('ok' in f1)) throw new Error(JSON.stringify(f1));
    const ok = await goAhead(owner, customerId, { reason: 'Sample: fine', shownFlagIds: [f1.id], shownLicenceExpired: false });
    if (!('ok' in ok)) throw new Error(JSON.stringify(ok));
    expect(await addFlag(owner, customerId, { kind: 'damage', details: 'Sample: second' })).toMatchObject({ ok: true });
    expect(await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1, goAheadId: ok.id })).toEqual({ error: 'warningsNotCleared' });
  });

  it('a first rental needs "Approve a first-time customer"; a later one does not', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    expect(await setPermission(owner, staff, 'approveFirstCustomer', false)).toMatchObject({ ok: true });
    const a = await sampleCarAndCustomer(owner);
    const b = await sampleCarAndCustomer(owner);
    expect(await createRental(staff, { customerId: a.customerId, vehicleId: a.carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'firstRentalNotAllowed' });
    const first = await createRental(owner, { customerId: a.customerId, vehicleId: a.carId, pickupAt: samplePickup(), days: 1 });
    if (!('ok' in first)) throw new Error(JSON.stringify(first));
    const ev = await pool.query("select details from rental_event where rental_id = $1", [first.id]);
    expect(ev.rows[0].details).toMatchObject({ firstRental: true });
    expect(await createRental(staff, { customerId: a.customerId, vehicleId: b.carId, pickupAt: samplePickup(), days: 1 })).toMatchObject({ ok: true });
  });

  it('two saves with the same decision at the same moment: only one rental starts', async () => {
    const owner = await theOwner();
    const { customerId } = await sampleCarAndCustomer(owner);
    const cars = await Promise.all([sampleCarAndCustomer(owner), sampleCarAndCustomer(owner)]);
    const f = await addFlag(owner, customerId, { kind: 'other', details: 'Sample: check' });
    if (!('ok' in f)) throw new Error(JSON.stringify(f));
    const ok = await goAhead(owner, customerId, { reason: 'Sample: fine', shownFlagIds: [f.id], shownLicenceExpired: false });
    if (!('ok' in ok)) throw new Error(JSON.stringify(ok));
    const results = await Promise.all(cars.map((c) => createRental(owner, { customerId, vehicleId: c.carId, pickupAt: samplePickup(), days: 1, goAheadId: ok.id })));
    expect(results.filter((r) => 'ok' in r)).toHaveLength(1);
    expect(results.filter((r) => 'error' in r && r.error === 'warningsNotCleared')).toHaveLength(1);
  });

  it('an expired licence alone also needs the decision', async () => {
    const owner = await theOwner();
    const { carId } = await sampleCarAndCustomer(owner);
    const c = await addCustomer(owner, { ...sampleCustomer(), licenceExpires: '2020-01-31' });
    if (!('ok' in c)) throw new Error(JSON.stringify(c));
    expect(await createRental(owner, { customerId: c.id, vehicleId: carId, pickupAt: samplePickup(), days: 1 })).toEqual({ error: 'warningsNotCleared' });
    const ok = await goAhead(owner, c.id, { reason: 'Sample: renewal shown at the counter', shownFlagIds: [], shownLicenceExpired: true });
    if (!('ok' in ok)) throw new Error(JSON.stringify(ok));
    expect(await createRental(owner, { customerId: c.id, vehicleId: carId, pickupAt: samplePickup(), days: 1, goAheadId: ok.id })).toMatchObject({ ok: true });
  });
});
