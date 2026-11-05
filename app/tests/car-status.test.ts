import { describe, it, expect } from 'vitest';
import { Pool } from 'pg';
import { afterAll } from 'vitest';
import { addCar } from '../src/modules/cars/cars';
import { changeStatus, statusOf } from '../src/modules/cars/status';
import { todayColombo } from '../src/lib/dates';
import { samplePerson, theOwner } from './helpers/people';
import { samplePlate } from './helpers/cars';

// ST-04.5 (system design 11; Confirmed 5 Nov 2026: the decisions of #22. Each test adds its own sample car.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const sampleCar = async () => {
  const c = await addCar(await theOwner(), { registration: samplePlate(), model: 'Wagon R', ownership: 'sns' });
  if (!('ok' in c)) throw new Error(c.error);
  return c.id;
};
const dayOffset = (days: number) => new Date(Date.parse(`${todayColombo()}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

describe('ST-04.5: change a car\'s status', () => {
  it('Unavailable needs a reason; the expected date is optional and can be changed; stale forms are refused', async () => {
    const id = await sampleCar();
    const staff = await samplePerson();
    expect(await changeStatus(staff.id, id, { status: 'unavailable', reason: '  ' }, 'available')).toEqual({ error: 'reasonMissing' });
    expect(await changeStatus(staff.id, id, { status: 'unavailable', reason: 'Sample: owner use' }, 'available')).toEqual({ ok: true, changed: true });
    expect(await changeStatus(staff.id, id, { status: 'unavailable', reason: 'Sample: owner use', expectedBack: '2026-02-30' }, 'unavailable')).toEqual({ error: 'dateInvalid' });
    expect(await changeStatus(staff.id, id, { status: 'unavailable', reason: 'Sample: owner use', expectedBack: dayOffset(3) }, 'unavailable')).toEqual({ ok: true, changed: true });
    expect(await statusOf(id)).toMatchObject({ status: 'unavailable', expectedBack: dayOffset(3) });
    expect(await changeStatus(staff.id, id, { status: 'unavailable', reason: 'Sample: owner use', expectedBack: dayOffset(3) }, 'unavailable')).toEqual({ ok: true, changed: false });
    // The form showed Available, but the car is now Unavailable.
    expect(await changeStatus(staff.id, id, { status: 'repair', reason: 'Sample: garage' }, 'available')).toEqual({ error: 'stale' });
  });

  it('retires on today or earlier, never in the future or before the car was added', async () => {
    const id = await sampleCar();
    const owner = await theOwner();
    expect(await changeStatus(owner, id, { status: 'retired', reason: 'Sample: sold', retiredOn: dayOffset(1) }, 'available')).toEqual({ error: 'retireDateFuture' });
    expect(await changeStatus(owner, id, { status: 'retired', reason: 'Sample: sold', retiredOn: dayOffset(-30) }, 'available')).toEqual({ error: 'retireDateBeforeAdded' });
    expect(await changeStatus(owner, id, { status: 'retired', reason: 'Sample: sold', retiredOn: todayColombo() }, 'available')).toEqual({ ok: true, changed: true });
  });

  it('only the owner brings a retired car back, with a reason, as Available', async () => {
    const id = await sampleCar();
    const owner = await theOwner();
    const admin = await samplePerson('first-pass-1', 'admin');
    expect(await changeStatus(admin.id, id, { status: 'retired', reason: 'Sample: sold' }, 'available')).toEqual({ ok: true, changed: true });
    expect(await changeStatus(admin.id, id, { status: 'available', reason: 'Sample: by mistake' }, 'retired')).toEqual({ error: 'notAllowed' });
    expect(await changeStatus(owner, id, { status: 'repair', reason: 'Sample' }, 'retired')).toEqual({ error: 'retiredFirst' });
    expect(await changeStatus(owner, id, { status: 'available' }, 'retired')).toEqual({ error: 'reasonMissing' });
    expect(await changeStatus(owner, id, { status: 'available', reason: 'Sample: retired by mistake' }, 'retired')).toEqual({ ok: true, changed: true });
    expect((await statusOf(id)).status).toBe('available');
  });

  it('a status change can never be edited or removed', async () => {
    const id = await sampleCar();
    await changeStatus(await theOwner(), id, { status: 'repair', reason: 'Sample: garage' }, 'available');
    await expect(pool.query('update vehicle_status_event set reason = $2 where vehicle_id = $1', [id, 'x'])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from vehicle_status_event where vehicle_id = $1', [id])).rejects.toThrow(/insert-only/);
  });
});
