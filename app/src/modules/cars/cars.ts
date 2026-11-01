import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, partnerOwner, permissionGrant, user, vehicle, vehicleTermsVersion } from '../../db/schema';
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
/** The costs a partner may pay on their car (board 11.3; system design 3.2 "Partner accounts", Proposed). */
export const COSTS = ['service', 'tyres', 'repairs', 'battery'] as const;
export type Cost = (typeof COSTS)[number];
export const isCost = (c: string): c is Cost => (COSTS as readonly string[]).includes(c);

export type Ownership = 'sns' | 'partner';
export interface Terms {
  dailyRate: number; kmPerDay: number; extraKmRate: number; commissionPercent: number | null; ownerPays: Cost[];
  longRentalExtra: number; longRentalFromDay: number; garageDayCharge: number;
}
export const TERM_FIELDS = ['dailyRate', 'kmPerDay', 'extraKmRate', 'longRentalExtra', 'longRentalFromDay', 'garageDayCharge', 'commissionPercent'] as const;
export type TermField = (typeof TERM_FIELDS)[number];
/** Every term, the costs included. The commission and the costs are partner terms. */
export const TERM_KEYS = [...TERM_FIELDS, 'ownerPays'] as const;
export type TermKey = (typeof TERM_KEYS)[number];
export const PARTNER_TERMS: readonly TermKey[] = ['commissionPercent', 'ownerPays'];
const norm = (v: unknown) => (Array.isArray(v) ? JSON.stringify([...v].sort()) : v);
/** Whether two values of a term are the same (the costs in any order). */
export const sameTerm = (a: unknown, b: unknown) => norm(a) === norm(b);
export type CarStatus = 'available';
export interface Car {
  id: string; registration: string; model: string; ownership: Ownership; status: CarStatus; terms: Terms; createdAt: Date;
  /** A partner car's owner once linked (#20): the partner and their name. */
  partnerId: string | null; partnerName: string | null;
}

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

/** Limits to stop typing mistakes (system design 4.2; Proposed: Dulan, 1 Nov 2026). Whole numbers only. */
export const LIMITS: Record<TermField, [number, number]> = {
  dailyRate: [1, 100_000], kmPerDay: [1, 1_000], extraKmRate: [0, 1_000], longRentalExtra: [0, 100_000],
  longRentalFromDay: [2, 60], garageDayCharge: [0, 100_000], commissionPercent: [0, 100],
};
const BOUNDS = LIMITS;
function badFields(terms: Terms, ownership: Ownership): TermKey[] {
  const bad: TermKey[] = TERM_FIELDS.filter((f) => {
    const v = terms[f];
    if (f === 'commissionPercent' && ownership === 'sns') return v !== null;
    return !Number.isInteger(v) || (v as number) < BOUNDS[f][0] || (v as number) > BOUNDS[f][1];
  });
  const costs = terms.ownerPays;
  const costsOk = Array.isArray(costs) && costs.every((c) => isCost(c)) && new Set(costs).size === costs.length && (ownership === 'partner' || costs.length === 0);
  return costsOk ? bad : [...bad, 'ownerPays'];
}

const termsColumns = {
  dailyRate: vehicleTermsVersion.dailyRate, kmPerDay: vehicleTermsVersion.kmPerDay, extraKmRate: vehicleTermsVersion.extraKmRate,
  commissionPercent: vehicleTermsVersion.commissionPercent, longRentalExtra: vehicleTermsVersion.longRentalExtra,
  longRentalFromDay: vehicleTermsVersion.longRentalFromDay, garageDayCharge: vehicleTermsVersion.garageDayCharge,
  ownerPays: vehicleTermsVersion.ownerPays,
};

export type AddResult =
  | { ok: true; id: string }
  | { error: 'notAllowed' | 'registrationMissing' | 'registrationInvalid' | 'registrationTaken' | 'modelInvalid' | 'ownershipInvalid' }
  | { error: 'invalid'; fields: TermKey[] };

/**
 * Adds a car (ST-04.3): its model's starting package and the 4.2 defaults, with any changes typed on the form, in one
 * transaction. Needs "Add or edit cars and packages"; a commission other than the default also needs "Add or edit
 * partners". Logged: the car, then each typed change from the starting package with its old and new value (PR-05).
 */
export async function addCar(actorId: string, input: { registration: string; model: string; ownership: string }, typed: Partial<Terms> = {}): Promise<AddResult> {
  const registration = normalPlate(input.registration ?? '');
  if (!registration) return { error: 'registrationMissing' };
  if (!PLATE.test(registration)) return { error: 'registrationInvalid' };
  if (!isModel(input.model)) return { error: 'modelInvalid' };
  if (input.ownership !== 'sns' && input.ownership !== 'partner') return { error: 'ownershipInvalid' };
  const ownership = input.ownership;
  const model = input.model;
  const start: Terms = { ...STARTING_PACKAGES[model], ...DEFAULT_TERMS, commissionPercent: ownership === 'partner' ? DEFAULT_TERMS.commissionPercent : null, ownerPays: [] };
  const terms: Terms = { ...start };
  for (const f of TERM_KEYS) if (f in typed && !(PARTNER_TERMS.includes(f) && ownership === 'sns')) (terms as Record<TermKey, unknown>)[f] = typed[f];
  const changed = TERM_KEYS.filter((f) => !sameTerm(terms[f], start[f]));
  const bad = badFields(terms, ownership).filter((f) => changed.includes(f));
  if (bad.length) return { error: 'invalid', fields: bad };
  try {
    return await db.transaction(async (tx) => {
      if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
      if (changed.some((f) => PARTNER_TERMS.includes(f)) && !(await actorMay(tx, actorId, 'editPartners'))) return { error: 'notAllowed' } as const;
      const [car] = await tx.insert(vehicle).values({ registration, model, ownership, createdBy: actorId }).returning({ id: vehicle.id });
      await tx.insert(vehicleTermsVersion).values({ vehicleId: car.id, createdBy: actorId, ...terms, effectiveFrom: sql`clock_timestamp()` });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.add', targetType: 'car', targetId: car.id, details: { plate: registration, model, ownership } });
      for (const field of changed) {
        await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.change', targetType: 'car', targetId: car.id,
          details: { plate: registration, field, old: start[field], new: terms[field] } });
      }
      return { ok: true, id: car.id } as const;
    });
  } catch (e) {
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23505' && pg.constraint === 'vehicle_one_per_registration') return { error: 'registrationTaken' };
    throw e;
  }
}

export type EditResult = { ok: true; changed: TermKey[] } | { error: 'notAllowed' | 'notFound' } | { error: 'invalid' | 'stale'; fields: TermKey[] };

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
    // One change to a car at a time, so "old" is always the value really replaced. An advisory lock, not a row lock:
    // the app role may not update cars, and FOR UPDATE would need that (#18 review).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${carId}`}))`);
    const [car] = await tx.select({ ownership: vehicle.ownership, registration: vehicle.registration }).from(vehicle).where(eq(vehicle.id, carId));
    if (!car) return { error: 'notFound' } as const;
    const ownership = car.ownership as Ownership;
    const current = await currentTerms(tx, carId);
    // A field the person changed (a NaN from a bad entry counts as changed and is refused below as invalid).
    const touched = TERM_KEYS.filter((f) => !sameTerm(input[f], was[f]));
    const next: Terms = { ...current };
    for (const f of touched) (next as Record<TermKey, unknown>)[f] = input[f];
    const bad = badFields(next, ownership).filter((f) => touched.includes(f));
    if (bad.length) return { error: 'invalid', fields: bad } as const;
    if (touched.some((f) => PARTNER_TERMS.includes(f)) && !(await actorMay(tx, actorId, 'editPartners'))) return { error: 'notAllowed' } as const;
    const stale = touched.filter((f) => !sameTerm(current[f], was[f]));
    if (stale.length) return { error: 'stale', fields: stale } as const;
    const changed = touched.filter((f) => !sameTerm(current[f], next[f]));
    if (!changed.length) return { ok: true, changed: [] } as const;
    // The time of this insert, after the lock (now() would be the transaction's start, which can be earlier).
    await tx.insert(vehicleTermsVersion).values({ vehicleId: carId, createdBy: actorId, ...next, effectiveFrom: sql`clock_timestamp()` });
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
  return asTerms(t);
}
const asTerms = (t: Omit<Terms, 'ownerPays'> & { ownerPays: string[] | null }): Terms => ({ ...t, ownerPays: (t.ownerPays ?? []).filter(isCost) });

/** The terms that applied to a car at a moment: what a rental agreed then keeps (AT-05; Phase 2 copies them). */
export async function termsAt(carId: string, at: Date): Promise<Terms | null> {
  if (!UUID.test(carId)) return null;
  const [t] = await db.select(termsColumns).from(vehicleTermsVersion)
    .where(and(eq(vehicleTermsVersion.vehicleId, carId), lte(vehicleTermsVersion.effectiveFrom, at)))
    .orderBy(desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).limit(1);
  return t ? asTerms(t) : null;
}

// Every car with its newest terms, by model then plate (about 30 cars at launch).
function carsQuery() {
  const newest = db.selectDistinctOn([vehicleTermsVersion.vehicleId], { vehicleId: vehicleTermsVersion.vehicleId, ...termsColumns })
    .from(vehicleTermsVersion).orderBy(vehicleTermsVersion.vehicleId, desc(vehicleTermsVersion.effectiveFrom), desc(vehicleTermsVersion.id)).as('newest');
  return db.select({
    id: vehicle.id, registration: vehicle.registration, model: vehicle.model, ownership: vehicle.ownership, createdAt: vehicle.createdAt,
    dailyRate: newest.dailyRate, kmPerDay: newest.kmPerDay, extraKmRate: newest.extraKmRate, commissionPercent: newest.commissionPercent,
    longRentalExtra: newest.longRentalExtra, longRentalFromDay: newest.longRentalFromDay, garageDayCharge: newest.garageDayCharge,
    ownerPays: newest.ownerPays, partnerId: vehicle.partnerOwnerId, partnerName: user.name,
  }).from(vehicle).innerJoin(newest, eq(newest.vehicleId, vehicle.id))
    .leftJoin(partnerOwner, eq(partnerOwner.id, vehicle.partnerOwnerId)).leftJoin(user, eq(user.id, partnerOwner.userId));
}
type Row = Awaited<ReturnType<ReturnType<typeof carsQuery>['execute']>>[number];
const toCar = (r: Row): Car => ({
  id: r.id, registration: r.registration, model: r.model, ownership: r.ownership as Ownership, createdAt: r.createdAt,
  status: 'available', // status changes come with #22
  terms: { dailyRate: r.dailyRate, kmPerDay: r.kmPerDay, extraKmRate: r.extraKmRate, commissionPercent: r.commissionPercent,
    longRentalExtra: r.longRentalExtra, longRentalFromDay: r.longRentalFromDay, garageDayCharge: r.garageDayCharge, ownerPays: (r.ownerPays ?? []).filter(isCost) },
  partnerId: r.partnerId, partnerName: r.partnerName,
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

/**
 * Links a partner car not yet linked to its new partner (ST-11.2), inside the caller's transaction, with the partner
 * terms agreed for it: a new terms version only if they differ, each change logged with old and new (PR-05). The
 * caller checks "Add or edit partners". Refuses an SNS car or one already linked.
 */
export async function linkCarToPartner(tx: Tx, actorId: string, carId: string, partnerId: string, agreed: { commissionPercent: number; ownerPays: Cost[] }): Promise<'ok' | 'carNotFree' | 'invalid'> {
  if (!UUID.test(carId)) return 'carNotFree';
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${carId}`}))`);
  const [car] = await tx.select({ ownership: vehicle.ownership, registration: vehicle.registration, partnerOwnerId: vehicle.partnerOwnerId }).from(vehicle).where(eq(vehicle.id, carId));
  if (!car || car.ownership !== 'partner' || car.partnerOwnerId) return 'carNotFree';
  const current = await currentTerms(tx, carId);
  const next: Terms = { ...current, commissionPercent: agreed.commissionPercent, ownerPays: [...agreed.ownerPays] };
  if (badFields(next, 'partner').some((f) => PARTNER_TERMS.includes(f))) return 'invalid';
  await tx.update(vehicle).set({ partnerOwnerId: partnerId }).where(eq(vehicle.id, carId));
  const changed = PARTNER_TERMS.filter((f) => !sameTerm(current[f], next[f]));
  if (changed.length) {
    await tx.insert(vehicleTermsVersion).values({ vehicleId: carId, createdBy: actorId, ...next, effectiveFrom: sql`clock_timestamp()` });
    for (const field of changed) {
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'car.change', targetType: 'car', targetId: carId,
        details: { plate: car.registration, field, old: current[field], new: next[field] } });
    }
  }
  return 'ok';
}

/** Partner cars not linked to an owner yet (ST-11.1, 11.3). */
export async function unlinkedPartnerCars(): Promise<Car[]> {
  return (await listCars()).filter((c) => c.ownership === 'partner' && !c.partnerId);
}
