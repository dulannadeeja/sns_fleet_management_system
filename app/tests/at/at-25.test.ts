import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { auditEvent } from '../../src/db/schema';
import { addCar, editCar, getCar, listCars } from '../../src/modules/cars/cars';
import { changeStatus, mayGoOut, statusOf } from '../../src/modules/cars/status';
import { todayColombo } from '../../src/lib/dates';
import { samplePerson, theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-25 (PARTIAL: rentals and partner balances come in Phase 2): "Retire a vehicle: no new rental eligibility;
// historic records and financial obligations retained." System design 11 (Confirmed).
describe('AT-25 (partial): a retired car no longer goes out, and keeps its history', () => {
  it('the admin retires a car with a reason and date; it stays, with its terms and log, but cannot go out', async () => {
    const owner = await theOwner();
    const added = await addCar(owner, { registration: samplePlate(), model: 'Prius', ownership: 'sns' });
    if (!('ok' in added)) throw new Error(added.error);
    const terms = (await getCar(added.id))!.terms;
    expect(await editCar(owner, added.id, { ...terms, dailyRate: 6600 }, terms)).toMatchObject({ ok: true });
    const admin = await samplePerson('first-pass-1', 'admin');
    expect(await changeStatus(admin.id, added.id, { status: 'retired', reason: '' }, 'available')).toEqual({ error: 'reasonMissing' });
    expect(await changeStatus(admin.id, added.id, { status: 'retired', reason: 'Sample: sold' }, 'available')).toEqual({ ok: true, changed: true });

    const now = await statusOf(added.id);
    expect(now).toMatchObject({ status: 'retired', reason: 'Sample: sold', retiredOn: todayColombo() });
    expect(mayGoOut(now.status)).toBe(false);
    // History kept: the car, its terms and its log are all still there.
    const car = (await getCar(added.id))!;
    expect(car).toMatchObject({ status: 'retired', terms: { dailyRate: 6600 } });
    expect((await listCars()).some((c) => c.id === added.id)).toBe(true);
    const log = await db.select().from(auditEvent).where(and(eq(auditEvent.targetId, added.id)));
    expect(log.map((e) => e.action).sort()).toEqual(['car.add', 'car.change', 'car.status']);
    expect(log.find((e) => e.action === 'car.status')!.details).toMatchObject({ old: 'available', new: 'retired', reason: 'Sample: sold' });
  });
});
