import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, customer, rental, rentalEvent, rentalTermsSnapshot, rentalVehicleSegment, user, vehicle, vehicleHold, vehicleStatusEvent, vehicleTermsVersion } from '../../db/schema';
import { readSettings } from '../settings/settings';
import { isCarState, mayGoOut } from '../cars/status';
import { deadlineFor, estimate, type Estimate } from '../../lib/rental-days';

// The rental foundation (#50; system design 4.3, 5, 7.1; TRD › Data model "Rentals", Integrity rules). A rental is
// saved with its own copy of the terms: the car's package (on its segment) and the business-wide cutoff, deadline and
// fuel price per litre (rental_terms_snapshot, Confirmed 7 Nov 2026). Later changes to the car or the settings never
// touch it (PR-08, AT-05). The car is held for the rental's time; the database refuses a second hold that overlaps
// (AT-08, AT-30). The screens, the customer's warnings and when a draft gives its car back come with #51.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const RENTAL_STATES = ['draft', 'out', 'returned', 'cancelled'] as const;
export type RentalState = (typeof RENTAL_STATES)[number];

export type CreateError = 'notAllowed' | 'customerNotFound' | 'carNotFound' | 'carNotAvailable' | 'carTaken' | 'daysInvalid' | 'pickupInvalid';
export type CreateResult = { ok: true; id: string } | { error: CreateError };

/** Owner, admin and staff record rentals; partners and turned-off people do not (system design 3.2). */
async function isEmployee(q: Tx, actorId: string): Promise<boolean> {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  return !!a && !a.disabledAt && ['owner', 'admin', 'staff'].includes(a.role);
}

const holdRange = (from: Date, to: Date) => `[${from.toISOString()},${to.toISOString()})`;

/**
 * Saves a new rental (status draft) for a customer and a car, from `pickupAt` for `days` days: copies the car's newest
 * terms and the owner settings onto it, holds the car until the deadline, and records it. Logged as rental.create.
 */
export async function createRental(actorId: string, input: { customerId: string; vehicleId: string; pickupAt: Date; days: number }): Promise<CreateResult> {
  if (!UUID.test(input.customerId)) return { error: 'customerNotFound' };
  if (!UUID.test(input.vehicleId)) return { error: 'carNotFound' };
  if (!Number.isSafeInteger(input.days) || input.days < 1) return { error: 'daysInvalid' };
  if (!(input.pickupAt instanceof Date) || Number.isNaN(input.pickupAt.getTime())) return { error: 'pickupInvalid' };
  try {
    return await db.transaction(async (tx) => {
      if (!(await isEmployee(tx, actorId))) return { error: 'notAllowed' } as const;
      // The same per-car lock as status and term changes, so the car's status and terms read here stay true.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${input.vehicleId}`}))`);
      const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, input.customerId));
      if (!c) return { error: 'customerNotFound' } as const;
      const [car] = await tx.select({ registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, input.vehicleId));
      if (!car) return { error: 'carNotFound' } as const;
      const [state] = await tx.select({ status: vehicleStatusEvent.status }).from(vehicleStatusEvent).where(eq(vehicleStatusEvent.vehicleId, input.vehicleId))
        .orderBy(desc(vehicleStatusEvent.createdAt), desc(vehicleStatusEvent.id)).limit(1);
      if (state && isCarState(state.status) && !mayGoOut(state.status)) return { error: 'carNotAvailable' } as const;
      const [terms] = await tx.select().from(vehicleTermsVersion).where(eq(vehicleTermsVersion.vehicleId, input.vehicleId))
        .orderBy(desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).limit(1);
      if (!terms) return { error: 'carNotFound' } as const;
      const settings = await readSettings();
      const deadlineAt = deadlineFor(input.pickupAt, input.days, settings.pickupCutoff, settings.returnDeadline);
      const [r] = await tx.insert(rental).values({ customerId: input.customerId, pickupAt: input.pickupAt, days: input.days, deadlineAt, createdBy: actorId })
        .returning({ id: rental.id });
      await tx.insert(rentalTermsSnapshot).values({ rentalId: r.id, pickupCutoff: settings.pickupCutoff, returnDeadline: settings.returnDeadline,
        fuelPricePerLitre: settings.fuelPricePerLitre, createdBy: actorId });
      await tx.insert(rentalVehicleSegment).values({ rentalId: r.id, position: 1, vehicleId: input.vehicleId, termsVersionId: terms.id,
        dailyRate: terms.dailyRate, kmPerDay: terms.kmPerDay, extraKmRate: terms.extraKmRate, commissionPercent: terms.commissionPercent,
        longRentalExtra: terms.longRentalExtra, longRentalFromDay: terms.longRentalFromDay, garageDayCharge: terms.garageDayCharge,
        ownerPays: terms.ownerPays ?? [], createdBy: actorId });
      await tx.insert(vehicleHold).values({ vehicleId: input.vehicleId, held: holdRange(input.pickupAt, deadlineAt), rentalId: r.id, createdBy: actorId });
      await tx.insert(rentalEvent).values({ rentalId: r.id, kind: 'created', details: { vehicleId: input.vehicleId, days: input.days }, createdBy: actorId });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.create', targetType: 'rental', targetId: r.id,
        details: { name: c.name, registration: car.registration, days: input.days } });
      return { ok: true, id: r.id } as const;
    });
  } catch (e) {
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23P01' && pg.constraint === 'vehicle_hold_no_overlap') return { error: 'carTaken' };
    throw e;
  }
}

export interface RentalTerms {
  id: string; customerId: string; status: RentalState; pickupAt: Date; days: number; deadlineAt: Date;
  pickupCutoff: string; returnDeadline: string; fuelPricePerLitre: number | null;
  segments: { position: number; vehicleId: string; dailyRate: number; kmPerDay: number; extraKmRate: number; commissionPercent: number | null;
    longRentalExtra: number; longRentalFromDay: number; garageDayCharge: number; ownerPays: string[] }[];
}

/** A rental with its own saved terms: what every calculation reads (never the car's live package). */
export async function rentalTerms(id: string, q: Tx | typeof db = db): Promise<RentalTerms | null> {
  if (!UUID.test(id)) return null;
  const [r] = await q.select({ r: rental, s: rentalTermsSnapshot }).from(rental).innerJoin(rentalTermsSnapshot, eq(rentalTermsSnapshot.rentalId, rental.id))
    .where(eq(rental.id, id));
  if (!r) return null;
  const segs = await q.select().from(rentalVehicleSegment).where(eq(rentalVehicleSegment.rentalId, id)).orderBy(asc(rentalVehicleSegment.position));
  return {
    id: r.r.id, customerId: r.r.customerId, status: r.r.status as RentalState, pickupAt: r.r.pickupAt, days: r.r.days, deadlineAt: r.r.deadlineAt,
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
  if (!UUID.test(vehicleId)) return false;
  const rows = await db.select({ id: vehicleHold.id }).from(vehicleHold)
    .where(and(eq(vehicleHold.vehicleId, vehicleId), sql`${vehicleHold.held} && ${holdRange(from, to)}::tstzrange`)).limit(1);
  return rows.length === 0;
}
