import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent, vehicle } from '../src/db/schema';
import { addCar, getCar } from '../src/modules/cars/cars';
import { addPackage, changeDefaults, changePackage, listPackages, packagesFor, readDefaults, modelsInUse } from '../src/modules/cars/packages';
import { setPermission } from '../src/modules/people/people';
import { samplePerson, theOwner } from './helpers/people';
import { samplePlate } from './helpers/cars';

// ST-04.4 starting packages (system design 4.1, 4.2; Proposed: Dulan, 2 Nov 2026). The test database is shared by every
// test file at once: these tests add sample packages (names starting "Sample") for sample models only, and never change the real ones or the
// defaults (the defaults test changes nothing: it checks refusals, and a change it saves is put back at once).
const tag = () => randomUUID().slice(0, 8);
const sample = (t: string, extra: Partial<{ models: string[]; dailyRate: number }> = {}) =>
  ({ name: `Sample package ${t}`, models: [`Sample model ${t}`], dailyRate: 5000, kmPerDay: 100, extraKmRate: 20, ...extra });

describe('ST-04.4: starting packages', () => {
  it('starts with the 4.1 packages and the 4.2 defaults', async () => {
    const real = (await listPackages()).filter((p) => !p.name.startsWith('Sample'));
    expect(real.map((p) => [p.name, p.models, p.dailyRate, p.kmPerDay, p.extraKmRate])).toEqual([
      ['Wagon R, Spacia', ['Wagon R', 'Spacia'], 4500, 100, 25], ['Every (van)', ['Every'], 5000, 100, 25],
      ['Alto', ['Alto'], 4000, 100, 17], ['Prius, Axio', ['Prius', 'Axio'], 6500, 100, 27],
    ]);
    expect(await readDefaults()).toEqual({ commissionPercent: 15, longRentalExtra: 500, longRentalFromDay: 6, garageDayCharge: 5000 });
    expect((await modelsInUse()).slice(0, 6)).toEqual(['Wagon R', 'Spacia', 'Every', 'Alto', 'Prius', 'Axio']);
  });

  it('a model can be in more than one package; a new car then picks one', async () => {
    const owner = await theOwner();
    const t = tag();
    const model = `Sample model ${t}`;
    const newer = await addPackage(owner, sample(t, { dailyRate: 7000 }));
    if (!('ok' in newer)) throw new Error(newer.error);
    // The same model in a second package, written with other spaces and case: it is the same model.
    const older = await addPackage(owner, { ...sample(`${t} old`, { dailyRate: 6000 }), models: [`  sample   MODEL ${t} `] });
    if (!('ok' in older)) throw new Error(older.error);
    expect((await packagesFor(model)).map((p) => p.dailyRate)).toEqual([7000, 6000]);

    // With two packages the person must pick; a package of another model is refused.
    expect(await addCar(owner, { registration: samplePlate(), model, ownership: 'sns' })).toEqual({ error: 'packageMissing' });
    const alto = (await packagesFor('Alto'))[0];
    expect(await addCar(owner, { registration: samplePlate(), model, ownership: 'sns', packageId: alto.id })).toEqual({ error: 'packageInvalid' });
    const car = await addCar(owner, { registration: samplePlate(), model, ownership: 'sns', packageId: older.id });
    if (!('ok' in car)) throw new Error(car.error);
    expect((await getCar(car.id))!.terms.dailyRate).toBe(6000);
    const [row] = await db.select({ p: vehicle.startingPackageId }).from(vehicle).where(eq(vehicle.id, car.id));
    expect(row.p).toBe(older.id);
    // A model with one package gets it without asking.
    const one = await addCar(owner, { registration: samplePlate(), model: 'Alto', ownership: 'sns' });
    if (!('ok' in one)) throw new Error(one.error);
    expect((await getCar(one.id))!.terms.dailyRate).toBe((await packagesFor('Alto'))[0].dailyRate);
  });

  it('adds a model to a package; names are unique; the car limits apply; stale forms are refused', async () => {
    const owner = await theOwner();
    const t = tag();
    const made = await addPackage(owner, sample(t));
    if (!('ok' in made)) throw new Error(made.error);
    expect(await addPackage(owner, { ...sample(tag()), name: ` sample  PACKAGE ${t}` })).toEqual({ error: 'nameTaken' });
    expect(await addPackage(owner, { ...sample(tag()), models: [] })).toEqual({ error: 'modelsMissing' });
    expect(await addPackage(owner, { ...sample(tag()), name: '  ' })).toEqual({ error: 'nameMissing' });
    expect(await addPackage(owner, { ...sample(tag()), dailyRate: 0, kmPerDay: 1001 })).toEqual({ error: 'invalid', fields: ['dailyRate', 'kmPerDay'] });

    const was = { name: `Sample package ${t}`, dailyRate: 5000, kmPerDay: 100, extraKmRate: 20 };
    const extra = `Sample extra ${t}`;
    expect(await changePackage(owner, made.id, { ...was, extraKmRate: 22, addModels: [extra] }, was)).toEqual({ ok: true, changed: ['extraKmRate', 'models'] });
    expect((await packagesFor(extra))[0].id).toBe(made.id);
    const [added] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'package.addModel'), eq(auditEvent.targetId, made.id)));
    expect(added.details).toEqual({ package: was.name, model: extra, old: [`Sample model ${t}`], new: [`Sample model ${t}`, extra] });
    // Someone else saved meanwhile: the form showed 20, the package now has 22.
    expect(await changePackage(owner, made.id, { ...was, extraKmRate: 30, addModels: [] }, was)).toEqual({ error: 'stale', fields: ['extraKmRate'] });
    // A model already in the package is not added twice.
    expect(await changePackage(owner, made.id, { ...was, extraKmRate: 22, addModels: [extra.toUpperCase()] }, { ...was, extraKmRate: 22 })).toEqual({ ok: true, changed: [] });
  });

  it('an Add-a-car form opened before a package change is refused, not saved with the old rate (#21 review)', async () => {
    const owner = await theOwner();
    const t = tag();
    const made = await addPackage(owner, sample(t));
    if (!('ok' in made)) throw new Error(made.error);
    const was = { name: `Sample package ${t}`, dailyRate: 5000, kmPerDay: 100, extraKmRate: 20 };
    expect(await changePackage(owner, made.id, { ...was, dailyRate: 5200, addModels: [] }, was)).toEqual({ ok: true, changed: ['dailyRate'] });
    const car = { registration: samplePlate(), model: `Sample model ${t}`, ownership: 'sns' };
    // The form showed 5,000 and the person left it: the package is now 5,200.
    expect(await addCar(owner, car, { dailyRate: 5000 }, { dailyRate: 5000 })).toEqual({ error: 'stale', fields: ['dailyRate'] });
    // The form also shows the commission default; an SNS car has none, so that is not a change.
    const fresh = await addCar(owner, car, { dailyRate: 5200 }, { dailyRate: 5200, commissionPercent: 15 });
    if (!('ok' in fresh)) throw new Error(fresh.error);
    expect((await getCar(fresh.id))!.terms.dailyRate).toBe(5200);
  });

  it('only people who may add or edit cars and packages change them; the commission needs "Add or edit partners"', async () => {
    const owner = await theOwner();
    const staff = await samplePerson();
    const t = tag();
    expect(await addPackage(staff.id, sample(t))).toEqual({ error: 'notAllowed' });
    const d = await readDefaults();
    expect(await changeDefaults(staff.id, { ...d, garageDayCharge: d.garageDayCharge }, d)).toEqual({ error: 'notAllowed' });
    await setPermission(owner, staff.id, 'editCarsAndPackages', true);
    const made = await addPackage(staff.id, sample(t));
    if (!('ok' in made)) throw new Error(made.error);
    // The commission default is a partner term.
    expect(await changeDefaults(staff.id, { ...d, commissionPercent: d.commissionPercent + 1 }, d)).toEqual({ error: 'notAllowed' });
    // Nothing changed is nothing saved.
    expect(await changeDefaults(staff.id, d, d)).toEqual({ ok: true, changed: [] });
    expect(await changeDefaults(owner, { ...d, longRentalFromDay: 1 }, d)).toEqual({ error: 'invalid', fields: ['longRentalFromDay'] });
    expect(await readDefaults()).toEqual(d);
  });
});
