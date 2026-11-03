import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import { and, eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { auditEvent } from '../../src/db/schema';
import { addCar } from '../../src/modules/cars/cars';
import { photoOf, readPhoto, removePhoto, setPhoto } from '../../src/modules/cars/papers';
import { samplePerson, theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-29 (CR-001): "Vehicle with no catalogue photo; an admin then adds one: card and profile show the model's standard
// image, then the photo; handover requirements are unchanged; staff without admin rights cannot add or replace it."
// System design 4.2 (Confirmed; who and which files Proposed: Dulan, 3 Nov 2026). The card and page are checked in the
// browser (tests/e2e/car-papers.spec.ts); handovers come in Phase 2, and nothing here touches them.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());
const SAMPLE_PHOTO = new Uint8Array(readFileSync(new URL('../../../brand/vehicles/256/sns-vehicle-alto.png', import.meta.url)));

describe('AT-29: a catalogue photo, added by an admin; staff cannot add or replace it', () => {
  it('has none at first; staff are refused; the admin adds, replaces and removes it; each change is logged', async () => {
    const owner = await theOwner();
    const car = await addCar(owner, { registration: samplePlate(), model: 'Alto', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);
    expect(await photoOf(car.id)).toBeNull(); // the model's standard image shows

    const staff = await samplePerson();
    expect(await setPhoto(staff.id, car.id, SAMPLE_PHOTO)).toEqual({ error: 'notAllowed' });
    expect(await photoOf(car.id)).toBeNull();

    const admin = await samplePerson('first-pass-1', 'admin');
    expect(await setPhoto(admin.id, car.id, SAMPLE_PHOTO)).toEqual({ ok: true, changed: true });
    const first = (await photoOf(car.id))!;
    expect(first).toMatchObject({ contentType: 'image/png', size: SAMPLE_PHOTO.length });
    // A photo row is never changed or removed, by anyone.
    await expect(pool.query('update vehicle_photo set size = 1 where id = $1', [first.id])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from vehicle_photo where id = $1', [first.id])).rejects.toThrow(/insert-only/);
    // Staff see it (it is shown to everyone at SNS) but still cannot replace or remove it.
    expect((await readPhoto(staff.id, car.id, first.id))!.bytes).toEqual(SAMPLE_PHOTO);
    expect(await setPhoto(staff.id, car.id, SAMPLE_PHOTO)).toEqual({ error: 'notAllowed' });
    expect(await removePhoto(staff.id, car.id)).toEqual({ error: 'notAllowed' });

    expect(await setPhoto(admin.id, car.id, SAMPLE_PHOTO)).toEqual({ ok: true, changed: true });
    expect((await photoOf(car.id))!.id).not.toBe(first.id);
    expect(await removePhoto(admin.id, car.id)).toEqual({ ok: true, changed: true });
    expect(await photoOf(car.id)).toBeNull(); // back to the standard image
    const log = await db.select({ action: auditEvent.action }).from(auditEvent).where(and(eq(auditEvent.targetId, car.id)));
    expect(log.map((e) => e.action).sort()).toEqual(['car.add', 'car.photoAdd', 'car.photoRemove', 'car.photoReplace']);
  });

  it('takes only a JPEG, PNG or WebP up to 10 MB, read from the file itself', async () => {
    const owner = await theOwner();
    const car = await addCar(owner, { registration: samplePlate(), model: 'Prius', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);
    const pdf = new TextEncoder().encode('%PDF-1.4 sample, not a photo');
    expect(await setPhoto(owner, car.id, pdf)).toEqual({ error: 'fileType' });
    const heic = new Uint8Array([0, 0, 0, 24, ...new TextEncoder().encode('ftypheic'), 0, 0, 0, 0]);
    expect(await setPhoto(owner, car.id, heic)).toEqual({ error: 'fileType' });
    expect(await setPhoto(owner, car.id, new Uint8Array(10 * 1024 * 1024 + 1))).toEqual({ error: 'fileTooBig' });
    expect(await setPhoto(owner, car.id, new Uint8Array())).toEqual({ error: 'fileMissing' });
    // A car that does not exist: refused before anything is stored.
    expect(await setPhoto(owner, '00000000-0000-4000-8000-000000000000', SAMPLE_PHOTO)).toEqual({ error: 'notFound' });
    expect(await photoOf(car.id)).toBeNull();
  });
});
