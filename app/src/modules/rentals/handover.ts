import { randomUUID } from 'node:crypto';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, customer, depositMovement, handoverPhoto, paymentAllocation, permissionGrant, rental, rentalEvent, rentalHandover, rentalVehicleSegment, user, vehicle, vehicleHold } from '../../db/schema';
import { allows } from '../../auth/permissions';
import { todayColombo } from '../../lib/dates';
import { dropFile, getFile, putFile } from '../../storage/files';
import { copyType, MAX_COPY_BYTES } from '../../storage/kinds';
import { statusOf, mayGoOut, type CarState } from '../cars/status';
import { getCustomer, type CopyKind } from '../customers/customers';
import { linesOf, readSettings } from '../settings/settings';
import { rentalMoney } from '../money/payments';
import { agreementState, rentalNumber } from './agreements';
import { rentalReadiness } from './terms';
import { closeWaiting } from '../approvals/approvals';
import type { RefCopyKind } from '../customers/references';

// Hand over the car (06.4, 06.5; ST-06.4; system design 6 "Handover requirements" and "Handing over the car", 7.1, 11;
// Confirmed 10 Nov 2026). Anyone with Customer access. Blocked until the customer's ID and licence copies, the signed
// agreement (current), the outgoing odometer and, when needed, the reference person's copies are in; the fuel level and
// the accessories checklist must be recorded but never block. A car under repair or unavailable cannot go out; a car
// with past or missing insurance or licence dates needs "Override expired-document warnings" and a reason. The
// odometer cannot be lower than the car's last reading. Money is shown, never required. Only one handover per rental
// (a unique row) and per car at a time (the hold) can win. Condition photos are optional, up to 10, private.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const FUEL_LEVELS = ['empty', 'quarter', 'half', 'threeQuarters', 'full'] as const;
export type FuelLevel = (typeof FUEL_LEVELS)[number];
export const KM_MAX = 999_999;
export const REASON_MAX = 500;
export const PHOTOS_MAX = 10;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type Missing = 'customerCopies' | 'signedAgreement' | 'agreementOutOfDate' | 'referencePerson' | 'referenceCopies' | 'accessoriesList' | 'carNotAvailable'
  | 'carOut' | 'deadlinePassed';
export interface Checklist {
  rentalId: string; number: number; status: string; customerId: string; customerName: string; vehicleId: string; registration: string; deadlineAt: Date;
  createdAt: Date; notCollected: boolean; nothingPaid: boolean;
  customerCopiesMissing: CopyKind[]; signedId: string | null; agreementOutOfDate: boolean;
  referenceRequired: boolean | null; referenceMissing: boolean; referenceCopiesMissing: RefCopyKind[];
  carStatus: CarState; papers: { insuranceExpires: string | null; licenceExpires: string | null; expired: boolean };
  lastKm: number | null; accessories: string[];
  money: { depositSet: number | null; depositReceived: number; rentPaid: string | null; unpaid: number } | null;
  photos: { id: string; createdAt: Date }[];
  missing: Missing[];
}

/** The car's last known odometer (Derived control, 10 Nov 2026): the reading of its most recent handover or return;
 *  a segment's return reading is newer than its handover reading. Returns (#63) add in_km; the admin's correction of
 *  a wrong reading comes with its own ticket. */
export async function lastKmOf(vehicleId: string, q: Q = db): Promise<number | null> {
  const [r] = await q.select({ km: sql<number>`coalesce(${rentalVehicleSegment.inKm}, ${rentalVehicleSegment.outKm})` }).from(rentalVehicleSegment)
    .where(and(eq(rentalVehicleSegment.vehicleId, vehicleId), sql`(${rentalVehicleSegment.outKm} is not null or ${rentalVehicleSegment.inKm} is not null)`))
    .orderBy(sql`${rentalVehicleSegment.createdAt} desc`, sql`${rentalVehicleSegment.position} desc`).limit(1);
  return r ? Number(r.km) : null;
}

/** Another rental that has this car out and not back yet (a car out stays with it until it is back, Derived control). */
export async function carOutOn(vehicleId: string, exceptRentalId: string | null, q: Q = db): Promise<string | null> {
  const [r] = await q.select({ id: rental.id }).from(rentalVehicleSegment).innerJoin(rental, eq(rental.id, rentalVehicleSegment.rentalId))
    .where(and(eq(rentalVehicleSegment.vehicleId, vehicleId), eq(rental.status, 'active'), sql`${rentalVehicleSegment.inKm} is null`,
      ...(exceptRentalId ? [sql`${rental.id} <> ${exceptRentalId}`] : []))).limit(1);
  return r?.id ?? null;
}

/** A saved rental not handed over this long after it was saved shows "Not collected" (10 Nov 2026). */
export const NOT_COLLECTED_AFTER_MS = 2 * 60 * 60 * 1000;
export const notCollected = (r: { status: string; createdAt: Date }, now = new Date()) => r.status === 'draft' && now.getTime() - r.createdAt.getTime() >= NOT_COLLECTED_AFTER_MS;

/** What the handover checklist (06.4) shows, and what still blocks it. */
export async function handoverChecklist(rentalId: string, q: Q = db): Promise<Checklist | null> {
  if (!UUID.test(rentalId)) return null;
  const [r] = await q.select({ id: rental.id, number: rental.number, status: rental.status, customerId: rental.customerId, deadlineAt: rental.deadlineAt, createdAt: rental.createdAt, name: customer.name })
    .from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
  if (!r) return null;
  const [seg] = await q.select({ vehicleId: rentalVehicleSegment.vehicleId }).from(rentalVehicleSegment).where(eq(rentalVehicleSegment.rentalId, r.id)).orderBy(asc(rentalVehicleSegment.position)).limit(1);
  const [car] = await q.select({ registration: vehicle.registration, insuranceExpires: vehicle.insuranceExpires, licenceExpires: vehicle.licenceExpires })
    .from(vehicle).where(eq(vehicle.id, seg.vehicleId));
  // One query at a time on q: inside handOver q is the transaction, which runs its queries one after another.
  const c = await getCustomer(r.customerId, q);
  const ready = await rentalReadiness(r.id, q);
  const agr = await agreementState(r.id, q);
  const status = await statusOf(seg.vehicleId, q);
  const lastKm = await lastKmOf(seg.vehicleId, q);
  const settings = await readSettings(q);
  // Money is shown, never required: read only for the page, not inside the handover.
  const money = q === db ? await rentalMoney(r.id) : null;
  const outOn = await carOutOn(seg.vehicleId, r.id, q);
  const paid = await paidSoFar(r.id, q);
  const photos = await q.select({ id: handoverPhoto.id, createdAt: handoverPhoto.createdAt }).from(handoverPhoto).where(eq(handoverPhoto.rentalId, r.id)).orderBy(asc(handoverPhoto.createdAt));
  const today = todayColombo();
  const expired = !car.insuranceExpires || !car.licenceExpires || car.insuranceExpires < today || car.licenceExpires < today;
  const accessories = linesOf(settings.accessories);
  const out: Checklist = {
    rentalId: r.id, number: r.number, status: r.status, customerId: r.customerId, customerName: r.name, vehicleId: seg.vehicleId, registration: car.registration, deadlineAt: r.deadlineAt,
    createdAt: r.createdAt, notCollected: notCollected(r), nothingPaid: paid === 0,
    customerCopiesMissing: c?.copiesMissing ?? [], signedId: agr?.signedId ?? null, agreementOutOfDate: !!agr?.outOfDate,
    referenceRequired: ready?.referenceRequired ?? null, referenceMissing: !!ready?.referenceMissing, referenceCopiesMissing: ready?.referenceCopiesMissing ?? [],
    carStatus: status.status, papers: { insuranceExpires: car.insuranceExpires, licenceExpires: car.licenceExpires, expired },
    lastKm, accessories,
    money: money ? { depositSet: money.depositSet, depositReceived: money.depositReceived, rentPaid: ready?.rentPaid ?? null, unpaid: money.unpaid } : null,
    photos, missing: [],
  };
  if (out.customerCopiesMissing.length) out.missing.push('customerCopies');
  if (!out.signedId) out.missing.push('signedAgreement');
  else if (out.agreementOutOfDate) out.missing.push('agreementOutOfDate');
  if (out.referenceMissing) out.missing.push('referencePerson');
  if (out.referenceCopiesMissing.length) out.missing.push('referenceCopies');
  if (!accessories.length) out.missing.push('accessoriesList');
  if (!mayGoOut(out.carStatus)) out.missing.push('carNotAvailable');
  if (outOn) out.missing.push('carOut');
  if (r.status === 'draft' && Date.now() >= r.deadlineAt.getTime()) out.missing.push('deadlinePassed');
  return out;
}

/** Everything paid on a rental so far: bill payments and deposit received. */
async function paidSoFar(rentalId: string, q: Q): Promise<number> {
  const [b] = await q.select({ n: sql<string>`coalesce(sum(${paymentAllocation.amount}), 0)` }).from(paymentAllocation).where(eq(paymentAllocation.rentalId, rentalId));
  const [d] = await q.select({ n: sql<string>`coalesce(sum(${depositMovement.amount}), 0)` }).from(depositMovement).where(eq(depositMovement.rentalId, rentalId));
  return Number(b.n) + Number(d.n);
}

export type FreeError = 'notAllowed' | 'notFound' | 'notDraft' | 'tooSoon' | 'paid' | 'reasonMissing' | 'tooLong';

/**
 * Frees the car of a rental that was not collected (10 Nov 2026): saved 2 hours ago or more, still not handed over,
 * and nothing paid on it (no rent and no deposit). Needs Customer access and a reason; under the car's and the
 * rental's locks. The car's hold ends, the rental is "not collected" and can no longer be handed over. Something
 * paid: the car stays held until the rental is cancelled (7.3, #59). Logged rental.carFreed and a rental_event.
 */
export async function freeCar(actorId: string, rentalId: string, reasonRaw: string): Promise<{ ok: true } | { error: FreeError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  const reason = String(reasonRaw ?? '').trim().replace(/\s+/g, ' ');
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > REASON_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
    if (!a || !allows(a, granted, 'customerAccess')) return { error: 'notAllowed' } as const;
    const [seg] = await tx.select({ vehicleId: rentalVehicleSegment.vehicleId }).from(rentalVehicleSegment).where(eq(rentalVehicleSegment.rentalId, rentalId))
      .orderBy(asc(rentalVehicleSegment.position)).limit(1);
    if (!seg) return { error: 'notFound' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${seg.vehicleId.toLowerCase()}`}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    // A payment takes the customer's lock and then the rental's: it waits here, and sees the rental no longer draft.
    const [r] = await tx.select({ status: rental.status, createdAt: rental.createdAt, number: rental.number, name: customer.name, registration: vehicle.registration })
      .from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).innerJoin(vehicle, eq(vehicle.id, seg.vehicleId)).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    if (r.status !== 'draft') return { error: 'notDraft' } as const;
    if (!notCollected(r)) return { error: 'tooSoon' } as const;
    if ((await paidSoFar(rentalId, tx)) > 0) return { error: 'paid' } as const;
    await tx.update(rental).set({ status: 'notCollected', updatedAt: sql`now()` }).where(and(eq(rental.id, rentalId), eq(rental.status, 'draft')));
    await tx.delete(vehicleHold).where(eq(vehicleHold.rentalId, rentalId));
    await closeWaiting(tx, rentalId, actorId);
    await tx.insert(rentalEvent).values({ rentalId, kind: 'carFreed', details: { reason }, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.carFreed', targetType: 'rental', targetId: rentalId,
      details: { name: r.name, number: rentalNumber(r.number), registration: r.registration, reason } });
    return { ok: true } as const;
  });
}

export interface HandoverInput { outKm: number; fuel: FuelLevel; accessories: { item: string; present: boolean }[]; checked: boolean; papersReason?: string }
export type HandoverError = 'notAllowed' | 'notFound' | 'notDraft' | 'blocked' | 'kmInvalid' | 'kmLower' | 'fuelInvalid' | 'listChanged' | 'notChecked'
  | 'papersNotAllowed' | 'reasonMissing' | 'tooLong';
export type HandoverResult = { ok: true } | { error: HandoverError; missing?: Missing[]; lastKm?: number };

/** Hands the car over: checks everything again under the car's and the rental's locks, records it, and the rental is active. */
export async function handOver(actorId: string, rentalId: string, input: HandoverInput): Promise<HandoverResult> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (!Number.isSafeInteger(input.outKm) || input.outKm < 0 || input.outKm > KM_MAX) return { error: 'kmInvalid' };
  if (!(FUEL_LEVELS as readonly string[]).includes(input.fuel)) return { error: 'fuelInvalid' };
  // The accessories are recorded only when staff confirm they checked the car (10 Nov 2026).
  if (input.checked !== true) return { error: 'notChecked' };
  const reason = String(input.papersReason ?? '').trim().replace(/\s+/g, ' ');
  if (reason.length > REASON_MAX) return { error: 'tooLong' };
  const ticked = Array.isArray(input.accessories) ? input.accessories.map((a) => ({ item: String(a?.item ?? ''), present: a?.present === true })) : [];
  return db.transaction(async (tx) => {
    const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
    if (!a || !allows(a, granted, 'customerAccess')) return { error: 'notAllowed' } as const;
    const [seg] = await tx.select({ id: rentalVehicleSegment.id, vehicleId: rentalVehicleSegment.vehicleId }).from(rentalVehicleSegment)
      .where(eq(rentalVehicleSegment.rentalId, rentalId)).orderBy(asc(rentalVehicleSegment.position)).limit(1);
    if (!seg) return { error: 'notFound' } as const;
    // The car, then the rental: the same order as every other path that takes both (createRental takes the car only).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${seg.vehicleId.toLowerCase()}`}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    const c = await handoverChecklist(rentalId, tx);
    if (!c) return { error: 'notFound' } as const;
    if (c.status !== 'draft') return { error: 'notDraft' } as const;
    if (c.missing.length) return { error: 'blocked', missing: c.missing } as const;
    if (c.lastKm !== null && input.outKm < c.lastKm) return { error: 'kmLower', lastKm: c.lastKm } as const;
    // The list as shown must be the list now, item by item (a change in Settings meanwhile shows it again).
    if (ticked.length !== c.accessories.length || ticked.some((t, i) => t.item !== c.accessories[i])) return { error: 'listChanged' } as const;
    if (c.papers.expired) {
      if (!allows(a, granted, 'overrideExpiredDocuments')) return { error: 'papersNotAllowed' } as const;
      if (!reason) return { error: 'reasonMissing' } as const;
    }
    const [r] = await tx.update(rental).set({ status: 'active', updatedAt: sql`now()` }).where(and(eq(rental.id, rentalId), eq(rental.status, 'draft'))).returning({ id: rental.id });
    if (!r) return { error: 'notDraft' } as const;
    await tx.insert(rentalHandover).values({ rentalId, vehicleId: seg.vehicleId, outKm: input.outKm, fuel: input.fuel, accessories: ticked,
      papersReason: c.papers.expired ? reason : null, createdBy: actorId });
    await tx.update(rentalVehicleSegment).set({ outKm: input.outKm }).where(eq(rentalVehicleSegment.id, seg.id));
    const missingItems = ticked.filter((t) => !t.present).map((t) => t.item);
    const details = { outKm: input.outKm, fuel: input.fuel, missingItems, ...(c.papers.expired ? { papersReason: reason } : {}) };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'handover', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.handover', targetType: 'rental', targetId: rentalId,
      details: { name: c.customerName, number: rentalNumber(c.number), registration: c.registration, ...details } });
    return { ok: true } as const;
  });
}

/** The recorded handover of a rental, if it went out. */
export async function handoverOf(rentalId: string) {
  if (!UUID.test(rentalId)) return null;
  const [h] = await db.select({ outKm: rentalHandover.outKm, fuel: rentalHandover.fuel, accessories: rentalHandover.accessories, papersReason: rentalHandover.papersReason,
    createdAt: rentalHandover.createdAt, byName: user.name }).from(rentalHandover).innerJoin(user, eq(user.id, rentalHandover.createdBy)).where(eq(rentalHandover.rentalId, rentalId));
  return h ? { ...h, fuel: h.fuel as FuelLevel, accessories: h.accessories as { item: string; present: boolean }[] } : null;
}

export type PhotoError = 'notAllowed' | 'notFound' | 'notDraft' | 'fileMissing' | 'fileTooBig' | 'fileType' | 'tooMany';

async function mayAdd(tx: Q, actorId: string, rentalId: string): Promise<PhotoError | null> {
  const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  if (!a || !allows(a, granted, 'customerAccess')) return 'notAllowed';
  const [r] = await tx.select({ status: rental.status }).from(rental).where(eq(rental.id, rentalId));
  if (!r) return 'notFound';
  if (r.status !== 'draft') return 'notDraft';
  const [n] = await tx.select({ n: sql<number>`count(*)::int` }).from(handoverPhoto).where(eq(handoverPhoto.rentalId, rentalId));
  return n.n >= PHOTOS_MAX ? 'tooMany' : null;
}

/** Adds one optional condition photo before the car goes out (up to 10). Checked before the file is stored and again
 *  under the rental's lock; a refused save removes the stored file. */
export async function addHandoverPhoto(actorId: string, rentalId: string, bytes: Uint8Array): Promise<{ ok: true } | { error: PhotoError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (!bytes.length) return { error: 'fileMissing' };
  if (bytes.length > MAX_COPY_BYTES) return { error: 'fileTooBig' };
  const type = copyType(bytes);
  if (!type || !(PHOTO_TYPES as readonly string[]).includes(type)) return { error: 'fileType' };
  const first = await mayAdd(db, actorId, rentalId);
  if (first) return { error: first };
  // The file is stored before its row, as for agreement copies (#55): a crash between the two leaves a private file
  // with no row, which nobody can open (accepted, as there); a refused or failed save removes it.
  const storageKey = `rentals/${rentalId.toLowerCase()}/handover/${randomUUID()}`;
  await putFile(storageKey, bytes, type);
  let result: { ok: true } | { error: PhotoError };
  try {
    result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
      const again = await mayAdd(tx, actorId, rentalId);
      if (again) return { error: again } as const;
      const [r] = await tx.select({ number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
      await tx.insert(handoverPhoto).values({ rentalId, storageKey, contentType: type, size: bytes.length, createdBy: actorId });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.photoAdd', targetType: 'rental', targetId: rentalId, details: { name: r.name, number: rentalNumber(r.number) } });
      return { ok: true } as const;
    });
  } catch (e) { await dropFile(storageKey); throw e; }
  if ('error' in result) await dropFile(storageKey);
  return result;
}

/** Opens a condition photo for someone with Customer access; the opening is logged, as for ID copies. */
export async function openHandoverPhoto(actorId: string, rentalId: string, photoId: string): Promise<{ ok: true; bytes: Uint8Array; contentType: string } | { error: 'notAllowed' | 'notFound' }> {
  if (!UUID.test(rentalId) || !UUID.test(photoId)) return { error: 'notFound' };
  const [a] = await db.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  const granted = new Set((await db.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  if (!a || !allows(a, granted, 'customerAccess')) return { error: 'notAllowed' };
  const [p] = await db.select().from(handoverPhoto).where(and(eq(handoverPhoto.id, photoId), eq(handoverPhoto.rentalId, rentalId)));
  if (!p) return { error: 'notFound' };
  const bytes = await getFile(p.storageKey);
  if (!bytes) return { error: 'notFound' };
  const [r] = await db.select({ number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
  await db.insert(auditEvent).values({ createdBy: actorId, action: 'rental.photoOpened', targetType: 'rental', targetId: rentalId, details: { name: r?.name ?? '', number: r ? rentalNumber(r.number) : '' } });
  return { ok: true, bytes, contentType: p.contentType };
}
