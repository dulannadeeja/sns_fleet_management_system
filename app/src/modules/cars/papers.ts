import { randomUUID } from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, user, vehicle, vehiclePhoto } from '../../db/schema';
import { realDate } from '../../lib/dates';
import { getFile, putFile } from '../../storage/files';
import { copyType, MAX_COPY_BYTES } from '../../storage/kinds';
import { actorMay, type Tx } from './rules';

// Car papers, service dates and the catalogue photo (ST-04.6, ST-04.7; system design 11 and 4.2).
// Confirmed: one optional catalogue photo per car (CR-001, ADD-003); until one is added the model's standard image shows;
// it is not a condition photo, not a handover requirement and not a customer document.
// Proposed (Dulan, 3 Nov 2026): everyone at SNS enters and changes the papers and service dates; the photo needs "Add or
// edit cars and packages"; JPEG, PNG or WebP up to 10 MB, stored privately; removing it brings back the standard image.

export const PAPER_FIELDS = ['insuranceExpires', 'licenceExpires', 'nextServiceOn', 'nextServiceKm'] as const;
export type PaperField = (typeof PAPER_FIELDS)[number];
export type Papers = { insuranceExpires: string | null; licenceExpires: string | null; nextServiceOn: string | null; nextServiceKm: number | null };
export const SERVICE_KM_MAX = 2_000_000;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const lockCar = (tx: Tx, carId: string) => tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${carId}`}))`);

/** Whether the person works at SNS (owner, admin or staff, not turned off), read inside the caller's transaction. */
async function employee(tx: Tx, actorId: string): Promise<boolean> {
  const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  return !!a && !a.disabledAt && ['owner', 'admin', 'staff'].includes(a.role);
}

/** A form's text as a paper value: an empty box is "not recorded" (null); NaN marks something unreadable. */
export function readPaper(field: PaperField, raw: string): string | number | null {
  const v = raw.trim();
  if (!v) return null;
  if (field === 'nextServiceKm') return /^\d{1,7}$/.test(v.replace(/,/g, '')) ? Number(v.replace(/,/g, '')) : Number.NaN;
  return v;
}
const badPaper = (field: PaperField, v: string | number | null) => v !== null && (field === 'nextServiceKm'
  ? !Number.isInteger(v) || (v as number) < 0 || (v as number) > SERVICE_KM_MAX
  : typeof v !== 'string' || !realDate(v));

export async function papersOf(carId: string, q: Tx | typeof db = db): Promise<Papers | null> {
  if (!UUID.test(carId)) return null;
  const [p] = await q.select({ insuranceExpires: vehicle.insuranceExpires, licenceExpires: vehicle.licenceExpires, nextServiceOn: vehicle.nextServiceOn, nextServiceKm: vehicle.nextServiceKm })
    .from(vehicle).where(eq(vehicle.id, carId));
  return p ?? null;
}

export type PapersResult = { ok: true; changed: PaperField[] } | { error: 'notAllowed' | 'notFound' } | { error: 'invalid' | 'stale'; fields: PaperField[] };

/**
 * Records a car's papers and service dates. `was` is what the form showed: only fields the person changed are saved,
 * none if someone saved one of them meanwhile. Each changed field is logged with its old and new value.
 */
export async function changePapers(actorId: string, carId: string, input: Record<PaperField, string | number | null>, was: Record<PaperField, string | number | null>): Promise<PapersResult> {
  if (!UUID.test(carId)) return { error: 'notFound' };
  const touched = PAPER_FIELDS.filter((f) => input[f] !== was[f]);
  const bad = touched.filter((f) => badPaper(f, input[f]));
  if (bad.length) return { error: 'invalid', fields: bad };
  return db.transaction(async (tx) => {
    if (!(await employee(tx, actorId))) return { error: 'notAllowed' } as const;
    await lockCar(tx, carId);
    const [car] = await tx.select({ registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, carId));
    if (!car) return { error: 'notFound' } as const;
    const now = (await papersOf(carId, tx))!;
    const stale = touched.filter((f) => now[f] !== was[f]);
    if (stale.length) return { error: 'stale', fields: stale } as const;
    if (!touched.length) return { ok: true, changed: [] } as const;
    await tx.update(vehicle).set(Object.fromEntries(touched.map((f) => [f, input[f]]))).where(eq(vehicle.id, carId));
    for (const field of touched) {
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.papers', targetType: 'car', targetId: carId,
        details: { plate: car.registration, field, old: now[field], new: input[field] } });
    }
    return { ok: true, changed: touched } as const;
  });
}

export interface CarPhoto { id: string; contentType: PhotoType; size: number; createdAt: Date }

/** The car's catalogue photo now, or null when it has none (the model's standard image shows). */
export async function photoOf(carId: string, q: Tx | typeof db = db): Promise<(CarPhoto & { storageKey: string }) | null> {
  if (!UUID.test(carId)) return null;
  const [p] = await q.select().from(vehiclePhoto).where(eq(vehiclePhoto.vehicleId, carId))
    .orderBy(desc(vehiclePhoto.createdAt), desc(vehiclePhoto.id)).limit(1);
  if (!p?.storageKey || !p.contentType || p.size === null) return null;
  return { id: p.id, contentType: p.contentType as PhotoType, size: p.size, createdAt: p.createdAt, storageKey: p.storageKey };
}

export type PhotoResult = { ok: true; changed: boolean } | { error: 'notAllowed' | 'notFound' | 'fileMissing' | 'fileTooBig' | 'fileType' };

/** Adds or replaces the catalogue photo: a JPEG, PNG or WebP (read from its own bytes) up to 10 MB, kept privately. */
export async function setPhoto(actorId: string, carId: string, bytes: Uint8Array): Promise<PhotoResult> {
  if (!UUID.test(carId)) return { error: 'notFound' };
  if (!bytes.length) return { error: 'fileMissing' };
  if (bytes.length > MAX_COPY_BYTES) return { error: 'fileTooBig' };
  const type = copyType(bytes);
  if (!type || !(PHOTO_TYPES as readonly string[]).includes(type)) return { error: 'fileType' };
  // Checked before the file is stored, and again in the transaction that records it.
  if (!(await db.transaction((tx) => actorMay(tx, actorId, 'editCarsAndPackages')))) return { error: 'notAllowed' };
  const storageKey = `cars/${carId.toLowerCase()}/${randomUUID()}`;
  await putFile(storageKey, bytes, type);
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
    await lockCar(tx, carId);
    const [car] = await tx.select({ registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, carId));
    if (!car) return { error: 'notFound' } as const;
    const before = await photoOf(carId, tx);
    await tx.insert(vehiclePhoto).values({ vehicleId: carId, storageKey, contentType: type, size: bytes.length, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: before ? 'car.photoReplace' : 'car.photoAdd', targetType: 'car', targetId: carId, details: { plate: car.registration } });
    return { ok: true, changed: true } as const;
  });
}

/** Removes the catalogue photo, so the model's standard image shows again. The old file stays in private storage. */
export async function removePhoto(actorId: string, carId: string): Promise<PhotoResult> {
  if (!UUID.test(carId)) return { error: 'notFound' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
    await lockCar(tx, carId);
    const [car] = await tx.select({ registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, carId));
    if (!car) return { error: 'notFound' } as const;
    if (!(await photoOf(carId, tx))) return { ok: true, changed: false } as const;
    await tx.insert(vehiclePhoto).values({ vehicleId: carId, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.photoRemove', targetType: 'car', targetId: carId, details: { plate: car.registration } });
    return { ok: true, changed: true } as const;
  });
}

/** The bytes of one of a car's photos, for its app route, to someone who works at SNS. Not a customer document: not logged. */
export async function readPhoto(actorId: string, carId: string, photoId: string): Promise<{ bytes: Uint8Array; contentType: PhotoType } | null> {
  if (!UUID.test(carId) || !UUID.test(photoId)) return null;
  const row = await db.transaction(async (tx) => {
    if (!(await employee(tx, actorId))) return null;
    const [p] = await tx.select().from(vehiclePhoto).where(eq(vehiclePhoto.id, photoId));
    return p && p.vehicleId === carId && p.storageKey && p.contentType ? p : null;
  });
  if (!row?.storageKey) return null;
  const bytes = await getFile(row.storageKey);
  return bytes ? { bytes, contentType: row.contentType as PhotoType } : null;
}
