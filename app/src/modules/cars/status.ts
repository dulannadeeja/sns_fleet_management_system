import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, user, vehicle, vehicleStatusEvent } from '../../db/schema';
import { realDate, todayColombo } from '../../lib/dates';
import { actorMay, type Tx } from './rules';

// A car's status (ST-04.5; system design 11). Confirmed: staff and admins set Under repair or Temporarily unavailable
// with a reason; only the authorised person (the admin by default) marks a car available again; only an admin or the
// primary owner retires a car, with a reason and date, never while rented or reserved, keeping its history (DN-01).
// The expected return date is optional for both (Confirmed: agreed by the owner, recorded by Dulan, 3 Nov 2026).
// Confirmed 5 Nov 2026: a reason of up to 500 letters, none for Available; an away status can be saved again;
// retire on today or earlier, never before the car was added; only the owner brings a retired car back, with a reason.
// Still to build (Phase 2, with rentals and reservations): refuse to retire a car that is rented or reserved (AT-52).
// Rented and Overdue come from rentals (Phase 2), not from here.

export const CAR_STATES = ['available', 'repair', 'unavailable', 'retired'] as const;
export type CarState = (typeof CAR_STATES)[number];
export const isCarState = (s: string): s is CarState => (CAR_STATES as readonly string[]).includes(s);
export interface CarStatusNow { status: CarState; reason: string | null; expectedBack: string | null; retiredOn: string | null; since: Date | null; byName: string | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const REASON_MAX = 500;
const tidy = (raw: unknown) => String(raw ?? '').trim().replace(/\s+/g, ' ');

/** A car can go out on a new rental only when it is Available (AT-20, AT-25; the handover itself comes in Phase 2). */
export const mayGoOut = (status: CarState) => status === 'available';

/** The car's status now: its newest change, or Available when it has none. */
export async function statusOf(carId: string, q: Tx | typeof db = db): Promise<CarStatusNow> {
  const [e] = await q.select({ status: vehicleStatusEvent.status, reason: vehicleStatusEvent.reason, expectedBack: vehicleStatusEvent.expectedBack,
    retiredOn: vehicleStatusEvent.retiredOn, since: vehicleStatusEvent.createdAt, byName: user.name })
    .from(vehicleStatusEvent).leftJoin(user, eq(user.id, vehicleStatusEvent.createdBy))
    .where(eq(vehicleStatusEvent.vehicleId, carId)).orderBy(desc(vehicleStatusEvent.createdAt), desc(vehicleStatusEvent.id)).limit(1);
  if (!e || !isCarState(e.status)) return { status: 'available', reason: null, expectedBack: null, retiredOn: null, since: null, byName: null };
  return { ...e, status: e.status };
}

export type StatusError = 'notAllowed' | 'notFound' | 'stale' | 'statusInvalid' | 'reasonMissing' | 'reasonTooLong' | 'dateInvalid'
  | 'retiredFirst' | 'retireDateFuture' | 'retireDateBeforeAdded';
export type StatusResult = { ok: true; changed: boolean } | { error: StatusError };

/**
 * Changes a car's status, in one transaction under the per-car lock. `was` is the status the form showed: if it changed
 * meanwhile, nothing is saved. Logged as car.status with the old and new status and the reason.
 */
export async function changeStatus(actorId: string, carId: string, input: { status: string; reason?: string; expectedBack?: string; retiredOn?: string }, was: string): Promise<StatusResult> {
  if (!UUID.test(carId)) return { error: 'notFound' };
  if (!isCarState(input.status)) return { error: 'statusInvalid' };
  const next = input.status;
  const reason = tidy(input.reason);
  if (reason.length > REASON_MAX) return { error: 'reasonTooLong' };
  const away = next === 'repair' || next === 'unavailable';
  const expectedBack = away && tidy(input.expectedBack) ? tidy(input.expectedBack) : null;
  if (expectedBack && !realDate(expectedBack)) return { error: 'dateInvalid' };
  const retiredOn = next === 'retired' ? tidy(input.retiredOn) || todayColombo() : null;
  if (retiredOn && !realDate(retiredOn)) return { error: 'dateInvalid' };
  if (retiredOn && retiredOn > todayColombo()) return { error: 'retireDateFuture' };

  return db.transaction(async (tx) => {
    // One change to a car at a time (the same lock as its terms), so "old" is always the status really replaced.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${carId}`}))`);
    const [car] = await tx.select({ registration: vehicle.registration, addedOn: sql<string>`(${vehicle.createdAt} at time zone 'Asia/Colombo')::date::text` })
      .from(vehicle).where(eq(vehicle.id, carId));
    if (!car) return { error: 'notFound' } as const;
    const now = await statusOf(carId, tx);

    // Who may make this change (system design 3.2 and 11).
    const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    if (!actor || actor.disabledAt) return { error: 'notAllowed' } as const;
    const allowed = next === 'retired' ? actor.role === 'owner' || actor.role === 'admin'
      : now.status === 'retired' ? next === 'available' && actor.role === 'owner'
        : next === 'available' ? await actorMay(tx, actorId, 'markCarAvailable')
          : await actorMay(tx, actorId, 'markCarUnavailable');
    if (!allowed) return { error: now.status === 'retired' && next !== 'available' && actor.role === 'owner' ? 'retiredFirst' : 'notAllowed' } as const;
    if (now.status !== was) return { error: 'stale' } as const;

    const needsReason = next !== 'available' || now.status === 'retired';
    if (needsReason && !reason) return { error: 'reasonMissing' } as const;
    if (retiredOn && retiredOn < car.addedOn) return { error: 'retireDateBeforeAdded' } as const;
    // TODO(Phase 2, AT-52): refuse 'retired' while the car is rented or reserved (system design 11, Confirmed).
    // Nothing new: the same status with the same date (an away status may be set again to change its date or reason).
    if (next === now.status && (!away || (expectedBack === now.expectedBack && reason === (now.reason ?? '')))) return { ok: true, changed: false } as const;

    await tx.insert(vehicleStatusEvent).values({ vehicleId: carId, status: next, reason: reason || null, expectedBack, retiredOn, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.status', targetType: 'car', targetId: carId,
      details: { plate: car.registration, old: now.status, new: next, ...(reason ? { reason } : {}), ...(expectedBack ? { expectedBack } : {}), ...(retiredOn ? { retiredOn } : {}) } });
    return { ok: true, changed: true } as const;
  });
}
