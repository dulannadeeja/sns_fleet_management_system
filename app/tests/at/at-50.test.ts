import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { auditEvent } from '../../src/db/schema';
import { addCar, getCar } from '../../src/modules/cars/cars';
import { addPackage, changePackage, listPackages } from '../../src/modules/cars/packages';
import { theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-50: "An admin changes the Alto starting package from 4,000 to 4,200 a day: Alto cars already in the system stay at
// 4,000; an Alto added afterwards starts at 4,200." System design 4.1 (Confirmed; packages per name, Proposed: Dulan,
// 2 Nov 2026). The test database is shared by every test file at once, so this test does not change the real Alto
// package: a sample model with its own sample package at the Alto's 4,000 / 100 / 17 stands in for it.
describe('AT-50: changing a starting package changes only cars added afterwards', () => {
  it('existing cars keep 4,000; a car added afterwards starts at 4,200; the log keeps old and new', async () => {
    const alto = (await listPackages()).find((p) => p.name === 'Alto')!;
    expect(alto).toMatchObject({ models: ['Alto'], dailyRate: 4000, kmPerDay: 100, extraKmRate: 17 });

    const owner = await theOwner();
    const tag = randomUUID().slice(0, 8);
    const model = `AT50 sample ${tag}`;
    const made = await addPackage(owner, { name: `AT50 sample package ${tag}`, models: [model], dailyRate: 4000, kmPerDay: 100, extraKmRate: 17 });
    if (!('ok' in made)) throw new Error(made.error);
    const before = await addCar(owner, { registration: samplePlate(), model, ownership: 'sns' });
    if (!('ok' in before)) throw new Error(before.error);
    expect((await getCar(before.id))!.terms.dailyRate).toBe(4000);

    const was = { name: `AT50 sample package ${tag}`, dailyRate: 4000, kmPerDay: 100, extraKmRate: 17 };
    expect(await changePackage(owner, made.id, { ...was, dailyRate: 4200, addModels: [] }, was)).toEqual({ ok: true, changed: ['dailyRate'] });

    expect((await getCar(before.id))!.terms.dailyRate).toBe(4000); // already in the system: stays
    const after = await addCar(owner, { registration: samplePlate(), model, ownership: 'sns' });
    if (!('ok' in after)) throw new Error(after.error);
    expect((await getCar(after.id))!.terms).toMatchObject({ dailyRate: 4200, kmPerDay: 100, extraKmRate: 17 });

    const [entry] = await db.select().from(auditEvent)
      .where(and(eq(auditEvent.action, 'package.change'), eq(auditEvent.targetId, made.id))).orderBy(desc(auditEvent.createdAt)).limit(1);
    expect(entry.details).toEqual({ package: was.name, field: 'dailyRate', old: 4000, new: 4200 });
  });
});
