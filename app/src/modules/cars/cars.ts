import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, permissionGrant, user, vehicle, vehicleTermsVersion } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';

// Cars (ST-04.1 to ST-04.3; system design 4.1, 4.2, 4.3). A car's package and terms are dated versions: a change adds a
// new one and never alters the old (PR-08, AT-05). Decisions of 1 Nov 2026 (Proposed, Dulan): the six models, one car
// per registration number, a partner car saved before its partner, the commission behind the partner permissions.

export const MODELS = ['Wagon R', 'Spacia', 'Every', 'Alto', 'Prius', 'Axio'] as const;
export type Model = (typeof MODELS)[number];
/** System design 4.1 starting packages (Confirmed; the extra-km rates are design rates). Editable later in #21. */
export const STARTING_PACKAGES: Record<Model, { dailyRate: number; kmPerDay: number; extraKmRate: number }> = {
  'Wagon R': { dailyRate: 4500, kmPerDay: 100, extraKmRate: 25 },
  Spacia: { dailyRate: 4500, kmPerDay: 100, extraKmRate: 25 },
  Every: { dailyRate: 5000, kmPerDay: 100, extraKmRate: 25 },
  Alto: { dailyRate: 4000, kmPerDay: 100, extraKmRate: 17 },
  Prius: { dailyRate: 6500, kmPerDay: 100, extraKmRate: 27 },
  Axio: { dailyRate: 6500, kmPerDay: 100, extraKmRate: 27 },
};
/** System design 4.2 defaults (Confirmed). */
export const DEFAULT_TERMS = { commissionPercent: 15, longRentalExtra: 500, longRentalFromDay: 6, garageDayCharge: 5000 };

export type Ownership = 'sns' | 'partner';
export interface Terms {
  dailyRate: number; kmPerDay: number; extraKmRate: number; commissionPercent: number | null;
  longRentalExtra: number; longRentalFromDay: number; garageDayCharge: number;
}
export const TERM_FIELDS = ['dailyRate', 'kmPerDay', 'extraKmRate', 'longRentalExtra', 'longRentalFromDay', 'garageDayCharge', 'commissionPercent'] as const;
export type TermField = (typeof TERM_FIELDS)[number];
export type CarStatus = 'available';
export interface Car { id: string; registration: string; model: string; ownership: Ownership; status: CarStatus; terms: Terms; createdAt: Date }

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A registration number as written on the plate: capitals, single spaces, no spaces at the ends. */
export const normalPlate = (raw: string) => raw.trim().replace(/\s+/g, ' ').toUpperCase();
const PLATE = /^[A-Z0-9][A-Z0-9 -]{1,14}$/;
export const isModel = (m: string): m is Model => (MODELS as readonly string[]).includes(m);

async function actorMay(tx: Tx, actorId: string, permission: Permission): Promise<boolean> {
  const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!actor) return false;
  const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(actor, granted, permission);
}

// Whole numbers in sensible bounds; no business limit is set for these (only that money is whole rupees).
const BOUNDS: Record<TermField, [number, number]> = {
  dailyRate: [1, 1_000_000], kmPerDay: [1, 10_000], extraKmRate: [0, 100_000], longRentalExtra: [0, 1_000_000],
  longRentalFromDay: [1, 366], garageDayCharge: [0, 1_000_000], commissionPercent: [0, 100],
};
function badFields(terms: Terms, ownership: Ownership): TermField[] {
  return TERM_FIELDS.filter((f) => {
    const v = terms[f];
    if (f === 'commissionPercent' && ownership === 'sns') return v !== null;
    return !Number.isInteger(v) || (v as number) < BOUNDS[f][0] || (v as number) > BOUNDS[f][1];
  });
}

const termsColumns = {
  dailyRate: vehicleTermsVersion.dailyRate, kmPerDay: vehicleTermsVersion.kmPerDay, extraKmRate: vehicleTermsVersion.extraKmRate,
  commissionPercent: vehicleTermsVersion.commissionPercent, longRentalExtra: vehicleTermsVersion.longRentalExtra,
  longRentalFromDay: vehicleTermsVersion.longRentalFromDay, garageDayCharge: vehicleTermsVersion.garageDayCharge,
};

export type AddResult = { ok: true; id: string } | { error: 'notAllowed' | 'registrationMissing' | 'registrationInvalid' | 'registrationTaken' | 'modelInvalid' | 'ownershipInvalid' };

/**
 * Adds a car with its model's starting package and the 4.2 defaults (ST-04.3). Needs "Add or edit cars and packages";
 * logged (PR-05). The package is changed afterwards with editCar.
 */
export async function addCar(actorId: string, input: { registration: string; model: string; ownership: string }): Promise<AddResult> {
  const registration = normalPlate(input.registration ?? '');
  if (!registration) return { error: 'registrationMissing' };
  if (!PLATE.test(registration)) return { error: 'registrationInvalid' };
  if (!isModel(input.model)) return { error: 'modelInvalid' };
  if (input.ownership !== 'sns' && input.ownership !== 'partner') return { error: 'ownershipInvalid' };
  const ownership = input.ownership;
  const model = input.model;
  try {
    return await db.transaction(async (tx) => {
      if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
      const [car] = await tx.insert(vehicle).values({ registration, model, ownership, createdBy: actorId }).returning({ id: vehicle.id });
      await tx.insert(vehicleTermsVersion).values({
        vehicleId: car.id, createdBy: actorId, ...STARTING_PACKAGES[model], ...DEFAULT_TERMS,
        commissionPercent: ownership === 'partner' ? DEFAULT_TERMS.commissionPercent : null,
      });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.add', targetType: 'car', targetId: car.id, details: { plate: registration, model, ownership } });
      return { ok: true, id: car.id } as const;
    });
  } catch (e) {
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23505' && pg.constraint === 'vehicle_one_per_registration') return { error: 'registrationTaken' };
    throw e;
  }
}

export type EditResult = { ok: true; changed: TermField[] } | { error: 'notAllowed' | 'notFound' } | { error: 'invalid' | 'stale'; fields: TermField[] };

/**
 * Changes a car's package and terms: a new dated version from now, for new rentals only (4.3, PR-08). `was` is what the
 * form showed; only fields the person changed are saved, and none if someone saved one of them meanwhile. The package
 * needs "Add or edit cars and packages"; the commission (partner cars) also "Add or edit partners" (Proposed, 1 Nov
 * 2026). Each changed field is logged with its old and new value (PR-05).
 */
export async function editCar(actorId: string, carId: string, input: Terms, was: Terms): Promise<EditResult> {
  if (!UUID.test(carId)) return { error: 'notFound' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
    // One change to a car at a time, so "old" is always the value really replaced.
    const [car] = await tx.select({ ownership: vehicle.ownership, registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, carId)).for('update');
    if (!car) return { error: 'notFound' } as const;
    const ownership = car.ownership as Ownership;
    const current = await currentTerms(tx, carId);
    const touched = TERM_FIELDS.filter((f) => input[f] !== was[f]);
    const next: Terms = { ...current };
    for (const f of touched) (next as Record<TermField, number | null>)[f] = input[f];
    const bad = badFields(next, ownership).filter((f) => touched.includes(f));
    if (bad.length) return { error: 'invalid', fields: bad } as const;
    if (touched.includes('commissionPercent') && !(await actorMay(tx, actorId, 'editPartners'))) return { error: 'notAllowed' } as const;
    const stale = touched.filter((f) => current[f] !== was[f]);
    if (stale.length) return { error: 'stale', fields: stale } as const;
    const changed = touched.filter((f) => current[f] !== next[f]);
    if (!changed.length) return { ok: true, changed: [] } as const;
    await tx.insert(vehicleTermsVersion).values({ vehicleId: carId, createdBy: actorId, ...next });
    for (const field of changed) {
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.change', targetType: 'car', targetId: carId,
        details: { plate: car.registration, field, old: current[field], new: next[field] } });
    }
    return { ok: true, changed } as const;
  });
}

async function currentTerms(q: Tx | typeof db, carId: string): Promise<Terms> {
  const [t] = await q.select(termsColumns).from(vehicleTermsVersion).where(eq(vehicleTermsVersion.vehicleId, carId))
    .orderBy(desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).limit(1);
  return t;
}

/** The terms that applied to a car at a moment: what a rental agreed then keeps (AT-05; Phase 2 copies them). */
export async function termsAt(carId: string, at: Date): Promise<Terms | null> {
  if (!UUID.test(carId)) return null;
  const [t] = await db.select(termsColumns).from(vehicleTermsVersion)
    .where(and(eq(vehicleTermsVersion.vehicleId, carId), lte(vehicleTermsVersion.effectiveFrom, at)))
    .orderBy(desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).limit(1);
  return t ?? null;
}

// Every car with its newest terms, by model then plate (about 30 cars at launch).
function carsQuery() {
  const newest = db.selectDistinctOn([vehicleTermsVersion.vehicleId], { vehicleId: vehicleTermsVersion.vehicleId, ...termsColumns })
    .from(vehicleTermsVersion).orderBy(vehicleTermsVersion.vehicleId, desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).as('newest');
  return db.select({
    id: vehicle.id, registration: vehicle.registration, model: vehicle.model, ownership: vehicle.ownership, createdAt: vehicle.createdAt,
    dailyRate: newest.dailyRate, kmPerDay: newest.kmPerDay, extraKmRate: newest.extraKmRate, commissionPercent: newest.commissionPercent,
    longRentalExtra: newest.longRentalExtra, longRentalFromDay: newest.longRentalFromDay, garageDayCharge: newest.garageDayCharge,
  }).from(vehicle).innerJoin(newest, eq(newest.vehicleId, vehicle.id));
}
type Row = Awaited<ReturnType<ReturnType<typeof carsQuery>['execute']>>[number];
const toCar = (r: Row): Car => ({
  id: r.id, registration: r.registration, model: r.model, ownership: r.ownership as Ownership, createdAt: r.createdAt,
  status: 'available', // status changes come with #22
  terms: { dailyRate: r.dailyRate, kmPerDay: r.kmPerDay, extraKmRate: r.extraKmRate, commissionPercent: r.commissionPercent,
    longRentalExtra: r.longRentalExtra, longRentalFromDay: r.longRentalFromDay, garageDayCharge: r.garageDayCharge },
});

/** Every car (ST-04.1). Callers decide what a person may see: the commission is a partner term. */
export async function listCars(): Promise<Car[]> {
  return (await carsQuery().orderBy(sql`array_position(${sql.raw(`array[${MODELS.map((m) => `'${m}'`).join(',')}]`)}::text[], ${vehicle.model})`, vehicle.registration)).map(toCar);
}

export async function getCar(id: string): Promise<Car | null> {
  if (!UUID.test(id)) return null;
  const [r] = await carsQuery().where(eq(vehicle.id, id));
  return r ? toCar(r) : null;
}
