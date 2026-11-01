import { describe, it, expect } from 'vitest';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent } from '../src/db/schema';
import { MODELS, STARTING_PACKAGES, addCar, editCar, getCar, listCars, normalPlate } from '../src/modules/cars/cars';
import { setPermission } from '../src/modules/people/people';
import { samplePerson, theOwner } from './helpers/people';
import { samplePlate } from './helpers/cars';

// ST-04.1 to ST-04.3 (system design 4.1, 4.2; decisions of 1 Nov 2026, Proposed). Each test adds its own sample cars,
// with random sample plates; the car tables are never cleaned up.
describe('ST-04.3: add or edit a car and its package', () => {
  it('starts a new car with its model\'s starting package and the agreed defaults', async () => {
    expect(MODELS).toEqual(['Wagon R', 'Spacia', 'Every', 'Alto', 'Prius', 'Axio']);
    expect(STARTING_PACKAGES.Alto).toEqual({ dailyRate: 4000, kmPerDay: 100, extraKmRate: 17 });
    const owner = await theOwner();
    const plate = samplePlate();
    const added = await addCar(owner, { registration: `  ${plate.toLowerCase()} `, model: 'Alto', ownership: 'partner' });
    if (!('ok' in added)) throw new Error(added.error);
    const car = (await getCar(added.id))!;
    expect(car).toMatchObject({ registration: plate, model: 'Alto', ownership: 'partner', status: 'available' });
    expect(car.terms).toEqual({ dailyRate: 4000, kmPerDay: 100, extraKmRate: 17, commissionPercent: 15, longRentalExtra: 500, longRentalFromDay: 6, garageDayCharge: 5000, ownerPays: [] });
    expect(car).toMatchObject({ partnerId: null, partnerName: null });
    // One car per number, however it is typed.
    expect(await addCar(owner, { registration: plate.replace(' ', '  ').toLowerCase(), model: 'Alto', ownership: 'sns' })).toEqual({ error: 'registrationTaken' });
    expect(normalPlate(' cbk   4127 ')).toBe('CBK 4127');
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'car.add'), eq(auditEvent.targetId, added.id)));
    expect(log.details).toMatchObject({ plate, model: 'Alto', ownership: 'partner' });
  });

  it('an SNS car has no commission; a model outside the list and bad numbers are refused', async () => {
    const owner = await theOwner();
    const sns = await addCar(owner, { registration: samplePlate(), model: 'Prius', ownership: 'sns' });
    if (!('ok' in sns)) throw new Error(sns.error);
    expect((await getCar(sns.id))!.terms.commissionPercent).toBeNull();
    expect(await addCar(owner, { registration: samplePlate(), model: 'Vitz', ownership: 'sns' })).toEqual({ error: 'modelInvalid' });
    expect(await addCar(owner, { registration: '', model: 'Alto', ownership: 'sns' })).toEqual({ error: 'registrationMissing' });
    const car = (await getCar(sns.id))!;
    expect(await editCar(owner, sns.id, { ...car.terms, dailyRate: 4500.5 }, car.terms)).toEqual({ error: 'invalid', fields: ['dailyRate'] });
    expect(await editCar(owner, sns.id, { ...car.terms, longRentalFromDay: 1 }, car.terms)).toEqual({ error: 'invalid', fields: ['longRentalFromDay'] });
    expect(await editCar(owner, sns.id, { ...car.terms, dailyRate: 100_001 }, car.terms)).toEqual({ error: 'invalid', fields: ['dailyRate'] });
    expect(await editCar(owner, sns.id, { ...car.terms, dailyRate: 100_000, longRentalFromDay: 60 }, car.terms)).toEqual({ ok: true, changed: ['dailyRate', 'longRentalFromDay'] });
  });

  it('only people who may edit cars change them; the commission needs "Add or edit partners"', async () => {
    const owner = await theOwner();
    const added = await addCar(owner, { registration: samplePlate(), model: 'Every', ownership: 'partner' });
    if (!('ok' in added)) throw new Error(added.error);
    const terms = (await getCar(added.id))!.terms;
    const staff = await samplePerson();
    expect(await addCar(staff.id, { registration: samplePlate(), model: 'Every', ownership: 'sns' })).toEqual({ error: 'notAllowed' });
    expect(await editCar(staff.id, added.id, { ...terms, dailyRate: 5100 }, terms)).toEqual({ error: 'notAllowed' });
    // Staff given "Add or edit cars and packages" change the package, but not the commission.
    await setPermission(owner, staff.id, 'editCarsAndPackages', true);
    expect(await editCar(staff.id, added.id, { ...terms, dailyRate: 5100, commissionPercent: 10 }, terms)).toEqual({ error: 'notAllowed' });
    expect(await editCar(staff.id, added.id, { ...terms, dailyRate: 5100 }, terms)).toEqual({ ok: true, changed: ['dailyRate'] });
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'car.change'), eq(auditEvent.targetId, added.id)))
      .orderBy(desc(auditEvent.createdAt)).limit(1);
    expect(log.details).toMatchObject({ field: 'dailyRate', old: 5000, new: 5100 });
    // The admin may (both permissions by default).
    const admin = await samplePerson('first-pass-1', 'admin');
    const now = (await getCar(added.id))!.terms;
    expect(await editCar(admin.id, added.id, { ...now, commissionPercent: 20 }, now)).toEqual({ ok: true, changed: ['commissionPercent'] });
  });

  it('a form left open never puts back an older value', async () => {
    const owner = await theOwner();
    const added = await addCar(owner, { registration: samplePlate(), model: 'Axio', ownership: 'sns' });
    if (!('ok' in added)) throw new Error(added.error);
    const opened = (await getCar(added.id))!.terms;
    expect(await editCar(owner, added.id, { ...opened, kmPerDay: 120 }, opened)).toEqual({ ok: true, changed: ['kmPerDay'] });
    expect(await editCar(owner, added.id, opened, opened)).toEqual({ ok: true, changed: [] });
    expect(await editCar(owner, added.id, { ...opened, kmPerDay: 150 }, opened)).toEqual({ error: 'stale', fields: ['kmPerDay'] });
    expect((await getCar(added.id))!.terms.kmPerDay).toBe(120);
  });
});

describe('ST-04.3: a new car with its package changed before saving (#18 review: one transaction)', () => {
  it('saves the car and the typed package together; the log shows each change from the starting package', async () => {
    const owner = await theOwner();
    const added = await addCar(owner, { registration: samplePlate(), model: 'Wagon R', ownership: 'partner' }, { dailyRate: 4700, commissionPercent: 12 });
    if (!('ok' in added)) throw new Error(added.error);
    expect((await getCar(added.id))!.terms).toMatchObject({ dailyRate: 4700, commissionPercent: 12, kmPerDay: 100 });
    const logs = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'car.change'), eq(auditEvent.targetId, added.id)));
    expect(logs.map((l) => l.details).sort((a, b) => String((a as { field: string }).field).localeCompare(String((b as { field: string }).field))))
      .toEqual([expect.objectContaining({ field: 'commissionPercent', old: 15, new: 12 }), expect.objectContaining({ field: 'dailyRate', old: 4500, new: 4700 })]);
  });
  it('a mistake saves nothing; a commission needs "Add or edit partners"', async () => {
    const owner = await theOwner();
    const plate = samplePlate();
    expect(await addCar(owner, { registration: plate, model: 'Alto', ownership: 'sns' }, { kmPerDay: Number.NaN })).toEqual({ error: 'invalid', fields: ['kmPerDay'] });
    expect((await listCars()).some((c) => c.registration === plate)).toBe(false);
    const staff = await samplePerson();
    await setPermission(owner, staff.id, 'editCarsAndPackages', true);
    expect(await addCar(staff.id, { registration: plate, model: 'Alto', ownership: 'partner' }, { commissionPercent: 5 })).toEqual({ error: 'notAllowed' });
    expect((await listCars()).some((c) => c.registration === plate)).toBe(false);
  });
});

describe('ST-04.1: all cars', () => {
  it('lists every car with its owner, package and status', async () => {
    const owner = await theOwner();
    const plate = samplePlate();
    await addCar(owner, { registration: plate, model: 'Spacia', ownership: 'sns' });
    const row = (await listCars()).find((c) => c.registration === plate);
    expect(row).toMatchObject({ model: 'Spacia', ownership: 'sns', status: 'available', terms: { dailyRate: 4500, kmPerDay: 100, extraKmRate: 25 } });
  });
});
