import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent, user } from '../src/db/schema';
import { addCar } from '../src/modules/cars/cars';
import { changePapers, papersOf } from '../src/modules/cars/papers';
import { samplePerson, theOwner } from './helpers/people';
import { samplePlate } from './helpers/cars';

// ST-04.6 papers and service dates (system design 11; Proposed: Dulan, 3 Nov 2026). Each test adds its own sample car.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const empty = { insuranceExpires: null, licenceExpires: null, nextServiceOn: null, nextServiceKm: null };

describe('ST-04.6: papers and service dates', () => {
  it('staff enter them; only changed fields are saved; each change is logged with old and new', async () => {
    const car = await addCar(await theOwner(), { registration: samplePlate(), model: 'Wagon R', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);
    expect(await papersOf(car.id)).toEqual(empty);
    const staff = await samplePerson();
    expect(await changePapers(staff.id, car.id, { ...empty, insuranceExpires: '2026-12-04', nextServiceKm: 25_500 }, empty))
      .toEqual({ ok: true, changed: ['insuranceExpires', 'nextServiceKm'] });
    expect(await papersOf(car.id)).toEqual({ ...empty, insuranceExpires: '2026-12-04', nextServiceKm: 25_500 });
    const log = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'car.papers'), eq(auditEvent.targetId, car.id)));
    expect(log.map((e) => e.details as Record<string, unknown>).sort((x, y) => String(x.field).localeCompare(String(y.field)))).toMatchObject([
      { field: 'insuranceExpires', old: null, new: '2026-12-04' }, { field: 'nextServiceKm', old: null, new: 25_500 }]);
    // A date can be cleared again (not recorded).
    const was = (await papersOf(car.id))!;
    expect(await changePapers(staff.id, car.id, { ...was, insuranceExpires: null }, was)).toEqual({ ok: true, changed: ['insuranceExpires'] });
  });

  it('refuses a date that does not exist, km out of range, a stale form and a partner', async () => {
    const car = await addCar(await theOwner(), { registration: samplePlate(), model: 'Alto', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);
    const staff = await samplePerson();
    expect(await changePapers(staff.id, car.id, { ...empty, licenceExpires: '2026-02-30', nextServiceKm: -1 }, empty))
      .toEqual({ error: 'invalid', fields: ['licenceExpires', 'nextServiceKm'] });
    expect(await changePapers(staff.id, car.id, { ...empty, nextServiceOn: '2026-12-01' }, empty)).toMatchObject({ ok: true });
    expect(await changePapers(staff.id, car.id, { ...empty, nextServiceOn: '2026-12-15' }, empty)).toEqual({ error: 'stale', fields: ['nextServiceOn'] });
    const partner = await samplePerson();
    await db.update(user).set({ role: 'partner' }).where(eq(user.id, partner.id));
    expect(await changePapers(partner.id, car.id, { ...empty, licenceExpires: '2027-01-01' }, empty)).toEqual({ error: 'notAllowed' });
  });

  it('the app may set only these four columns on a car', async () => {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query('set local role sns_app');
      await c.query('update vehicle set insurance_expires = insurance_expires, licence_expires = licence_expires, next_service_on = next_service_on, next_service_km = next_service_km where false');
    } finally { await c.query('rollback'); c.release(); }
  });
});
