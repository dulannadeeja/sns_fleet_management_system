import { and, asc, desc, eq, notInArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, customer, customerGoAhead, permissionGrant, rental, rentalEvent, rentalTermsSnapshot, rentalVehicleSegment, user, vehicle, vehicleHold, vehicleStatusEvent, vehicleTermsVersion } from '../../db/schema';
import { allows } from '../../auth/permissions';
import { readSettings } from '../settings/settings';
import { listCars, type Car } from '../cars/cars';
import { isCarState, mayGoOut } from '../cars/status';
import { warningsFor } from '../customers/flags';
import { deadlineFor, estimate, type Estimate } from '../../lib/rental-days';

// The rental foundation (#50; system design 4.3, 5, 7.1; TRD › Data model "Rentals", Integrity rules). A rental is
// saved with its own copy of the terms: the car's package (on its segment) and the business-wide cutoff, deadline and
// fuel price per litre (rental_terms_snapshot, Confirmed 7 Nov 2026). Later changes to the car or the settings never
// touch it (PR-08, AT-05). The car is held for the rental's time; the database refuses a second hold that overlaps
// (AT-08, AT-30). Decided 7 Nov 2026 (system design 7.1 "Saving a new rental", Confirmed): anyone with Customer access
// saves one; the car is held from the save; the pickup is now or within the next day (later is a reservation), never in
// the past; 1 to 90 days. 8 Nov 2026: the pickup is the moment of the save; a first rental means no car ever went out. Decided 8 Nov 2026 (7.1, Confirmed): a first rental needs "Approve a first-time customer"
// (saving it is the approval); with warnings, a decision to continue for exactly those warnings, used for one rental.
// Cancelling (which frees the car) comes with #59.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Only "draft" exists yet; handover (#57), return (#63) and cancelling (#59) add their states with their tickets. */
export const RENTAL_STATES = ['draft'] as const;
export const DAYS_MAX = 90;
/** The pickup is the moment of the save (7.1, Confirmed 8 Nov 2026). A minute either way covers clocks and the save. */
const PICKUP_GRACE_MS = 60_000;
/** Rentals that never went out: they do not make a later rental "not the first" (7.1, Confirmed 8 Nov 2026). */
const NEVER_OUT = ['draft', 'cancelled'];
export type RentalState = (typeof RENTAL_STATES)[number];

export type CreateError = 'notAllowed' | 'customerNotFound' | 'carNotFound' | 'carNotAvailable' | 'carTaken' | 'daysInvalid' | 'pickupInvalid'
  | 'pickupPast' | 'pickupTooFar' | 'warningsNotCleared' | 'firstRentalNotAllowed' | 'deadlineChanged';
export type CreateResult = { ok: true; id: string } | { error: CreateError };

/** What the person may do, read again inside the transaction: saving needs Customer access (7.1, Confirmed 7 Nov
 *  2026); a customer's first rental also "Approve a first-time customer" (Confirmed 8 Nov 2026). */
async function mayRent(q: Tx, actorId: string): Promise<{ rent: boolean; first: boolean }> {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!a) return { rent: false, first: false };
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return { rent: allows(a, granted, 'customerAccess'), first: allows(a, granted, 'approveFirstCustomer') };
}

const holdRange = (from: Date, to: Date) => `[${from.toISOString()},${to.toISOString()})`;

/**
 * Saves a new rental (status draft) for a customer and a car, from `pickupAt` for `days` days: copies the car's newest
 * terms and the owner settings onto it, holds the car until the deadline, and records it. Logged as rental.create.
 */
export async function createRental(actorId: string, input: { customerId: string; vehicleId: string; pickupAt: Date; days: number; goAheadId?: string; shownDeadline?: Date }): Promise<CreateResult> {
  if (!UUID.test(input.customerId)) return { error: 'customerNotFound' };
  if (input.goAheadId !== undefined && !UUID.test(input.goAheadId)) return { error: 'warningsNotCleared' };
  if (!UUID.test(input.vehicleId)) return { error: 'carNotFound' };
  if (!Number.isSafeInteger(input.days) || input.days < 1 || input.days > DAYS_MAX) return { error: 'daysInvalid' };
  if (!(input.pickupAt instanceof Date) || Number.isNaN(input.pickupAt.getTime())) return { error: 'pickupInvalid' };
  const now = Date.now();
  if (input.pickupAt.getTime() < now - PICKUP_GRACE_MS) return { error: 'pickupPast' };
  if (input.pickupAt.getTime() > now + PICKUP_GRACE_MS) return { error: 'pickupTooFar' };
  try {
    return await db.transaction(async (tx) => {
      const may = await mayRent(tx, actorId);
      if (!may.rent) return { error: 'notAllowed' } as const;
      // The customer's lock (the one flags and decisions take), so the warnings read here are the ones really there.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.customer:${input.customerId}`}))`);
      // The same per-car lock as status and term changes, so the car's status and terms read here stay true.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${input.vehicleId}`}))`);
      const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, input.customerId));
      if (!c) return { error: 'customerNotFound' } as const;
      const warnings = (await warningsFor(input.customerId, tx))!;
      const flagIds = warnings.openFlags.map((f) => f.id).sort();
      if (flagIds.length || warnings.licenceExpired) {
        // A decision for exactly these warnings, for this customer, not yet used by another rental.
        const [g] = input.goAheadId ? await tx.select({ customerId: customerGoAhead.customerId, flagIds: customerGoAhead.flagIds, licenceExpired: customerGoAhead.licenceExpired })
          .from(customerGoAhead).where(eq(customerGoAhead.id, input.goAheadId)) : [];
        const used = input.goAheadId ? (await tx.select({ id: rental.id }).from(rental).where(eq(rental.goAheadId, input.goAheadId)).limit(1)).length > 0 : true;
        if (!g || used || g.customerId !== input.customerId || [...g.flagIds].sort().join() !== flagIds.join() || g.licenceExpired !== warnings.licenceExpired) {
          return { error: 'warningsNotCleared' } as const;
        }
      }
      const firstRental = (await tx.select({ id: rental.id }).from(rental).where(and(eq(rental.customerId, input.customerId), notInArray(rental.status, NEVER_OUT))).limit(1)).length === 0;
      if (firstRental && !may.first) return { error: 'firstRentalNotAllowed' } as const;
      const goAheadId = flagIds.length || warnings.licenceExpired ? input.goAheadId! : null;
      const [car] = await tx.select({ registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, input.vehicleId));
      if (!car) return { error: 'carNotFound' } as const;
      const [state] = await tx.select({ status: vehicleStatusEvent.status }).from(vehicleStatusEvent).where(eq(vehicleStatusEvent.vehicleId, input.vehicleId))
        .orderBy(desc(vehicleStatusEvent.createdAt), desc(vehicleStatusEvent.id)).limit(1);
      if (state && isCarState(state.status) && !mayGoOut(state.status)) return { error: 'carNotAvailable' } as const;
      const [terms] = await tx.select().from(vehicleTermsVersion).where(eq(vehicleTermsVersion.vehicleId, input.vehicleId))
        .orderBy(desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).limit(1);
      if (!terms) return { error: 'carNotFound' } as const;
      const settings = await readSettings(tx);
      const deadlineAt = deadlineFor(input.pickupAt, input.days, settings.pickupCutoff, settings.returnDeadline);
      // What the customer was shown must be what is saved (ST-05.3): if the cutoff passed meanwhile, show the new one.
      if (input.shownDeadline && input.shownDeadline.getTime() !== deadlineAt.getTime()) return { error: 'deadlineChanged' } as const;
      const [r] = await tx.insert(rental).values({ customerId: input.customerId, pickupAt: input.pickupAt, days: input.days, deadlineAt, goAheadId, createdBy: actorId })
        .returning({ id: rental.id });
      await tx.insert(rentalTermsSnapshot).values({ rentalId: r.id, pickupCutoff: settings.pickupCutoff, returnDeadline: settings.returnDeadline,
        fuelPricePerLitre: settings.fuelPricePerLitre, createdBy: actorId });
      await tx.insert(rentalVehicleSegment).values({ rentalId: r.id, position: 1, vehicleId: input.vehicleId, termsVersionId: terms.id,
        dailyRate: terms.dailyRate, kmPerDay: terms.kmPerDay, extraKmRate: terms.extraKmRate, commissionPercent: terms.commissionPercent,
        longRentalExtra: terms.longRentalExtra, longRentalFromDay: terms.longRentalFromDay, garageDayCharge: terms.garageDayCharge,
        ownerPays: terms.ownerPays ?? [], createdBy: actorId });
      await tx.insert(vehicleHold).values({ vehicleId: input.vehicleId, held: holdRange(input.pickupAt, deadlineAt), rentalId: r.id, createdBy: actorId });
      await tx.insert(rentalEvent).values({ rentalId: r.id, kind: 'created', details: { vehicleId: input.vehicleId, days: input.days, firstRental, ...(goAheadId ? { goAheadId } : {}) }, createdBy: actorId });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.create', targetType: 'rental', targetId: r.id,
        details: { name: c.name, registration: car.registration, days: input.days } });
      return { ok: true, id: r.id } as const;
    });
  } catch (e) {
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23P01' && pg.constraint === 'vehicle_hold_no_overlap') return { error: 'carTaken' };
    if (pg.code === '23505' && pg.constraint === 'rental_one_per_go_ahead') return { error: 'warningsNotCleared' };
    throw e;
  }
}

export interface RentalTerms {
  id: string; number: number; customerId: string; status: RentalState; pickupAt: Date; days: number; deadlineAt: Date;
  pickupCutoff: string; returnDeadline: string; fuelPricePerLitre: number | null;
  segments: { position: number; vehicleId: string; dailyRate: number; kmPerDay: number; extraKmRate: number; commissionPercent: number | null;
    longRentalExtra: number; longRentalFromDay: number; garageDayCharge: number; ownerPays: string[] }[];
}

/** A rental with its own saved terms: what every calculation reads (never the car's live package). The commission is a
 *  partner term: callers show it only to people with "See partner earnings and terms". */
export async function rentalTerms(id: string, q: Tx | typeof db = db): Promise<RentalTerms | null> {
  if (!UUID.test(id)) return null;
  const [r] = await q.select({ r: rental, s: rentalTermsSnapshot }).from(rental).innerJoin(rentalTermsSnapshot, eq(rentalTermsSnapshot.rentalId, rental.id))
    .where(eq(rental.id, id));
  if (!r) return null;
  const segs = await q.select().from(rentalVehicleSegment).where(eq(rentalVehicleSegment.rentalId, id)).orderBy(asc(rentalVehicleSegment.position));
  return {
    id: r.r.id, number: r.r.number, customerId: r.r.customerId, status: r.r.status as RentalState, pickupAt: r.r.pickupAt, days: r.r.days, deadlineAt: r.r.deadlineAt,
    pickupCutoff: r.s.pickupCutoff, returnDeadline: r.s.returnDeadline, fuelPricePerLitre: r.s.fuelPricePerLitre,
    segments: segs.map((s) => ({ position: s.position, vehicleId: s.vehicleId, dailyRate: s.dailyRate, kmPerDay: s.kmPerDay, extraKmRate: s.extraKmRate,
      commissionPercent: s.commissionPercent, longRentalExtra: s.longRentalExtra, longRentalFromDay: s.longRentalFromDay, garageDayCharge: s.garageDayCharge,
      ownerPays: s.ownerPays })),
  };
}

/** The estimate for a one-car rental from its saved terms (5.3); swaps split by segment come with #62. */
export async function rentalEstimate(id: string, km?: number): Promise<Estimate | null> {
  const t = await rentalTerms(id);
  if (!t || t.segments.length !== 1) return null;
  const { dailyRate, kmPerDay, extraKmRate, longRentalExtra, longRentalFromDay } = t.segments[0];
  return estimate({ dailyRate, kmPerDay, extraKmRate, longRentalExtra, longRentalFromDay }, t.days, km);
}

/** Whether a car is free for the whole time from `from` to `to` (nothing holds it then). */
export async function carIsFree(vehicleId: string, from: Date, to: Date): Promise<boolean> {
  if (!UUID.test(vehicleId) || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) return false;
  const rows = await db.select({ id: vehicleHold.id }).from(vehicleHold)
    .where(and(eq(vehicleHold.vehicleId, vehicleId), sql`${vehicleHold.held} && ${holdRange(from, to)}::tstzrange`)).limit(1);
  return rows.length === 0;
}

/** The cars that can be rented now (05.2, ST-05.2): Available, and nothing holds them during the shortest rental
 *  from now (one day, to its deadline). A hold later in longer chosen days is refused at the save (carTaken). */
export async function freeCarsNow(): Promise<Car[]> {
  const now = new Date();
  const settings = await readSettings();
  const until = deadlineFor(now, 1, settings.pickupCutoff, settings.returnDeadline);
  const held = new Set((await db.select({ v: vehicleHold.vehicleId }).from(vehicleHold).where(sql`${vehicleHold.held} && ${holdRange(now, until)}::tstzrange`)).map((r) => r.v));
  return (await listCars()).filter((c) => mayGoOut(c.status) && !held.has(c.id));
}

/** Whether no car was ever handed over to the customer (their next rental is a first one, needing "Approve a first-time customer"). */
export async function isFirstRental(customerId: string): Promise<boolean> {
  if (!UUID.test(customerId)) return false;
  return (await db.select({ id: rental.id }).from(rental).where(and(eq(rental.customerId, customerId), notInArray(rental.status, NEVER_OUT))).limit(1)).length === 0;
}
