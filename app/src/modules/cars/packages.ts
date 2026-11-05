import { and, asc, count, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, packageDefault, startingPackage, startingPackageModel, vehicle } from '../../db/schema';
import type { Permission } from '../../auth/permissions';
import { actorMay, LIMITS, type Tx } from './rules';

// Starting packages (ST-04.4; system design 4.1, 4.2). Confirmed 5 Nov 2026: each
// package has a name and its models, and a model can be in more than one package; a new car picks one of its model's
// packages (a model with one gets it). People who may add or edit cars and packages change or add packages and the
// defaults; the commission default is a partner term and also needs "Add or edit partners". The car limits apply.
// A change applies only to cars added afterwards (a car keeps its own terms) and is logged with the old and new values.

export const PACKAGE_FIELDS = ['dailyRate', 'kmPerDay', 'extraKmRate'] as const;
export type PackageField = (typeof PACKAGE_FIELDS)[number];
export const DEFAULT_FIELDS = ['longRentalExtra', 'longRentalFromDay', 'garageDayCharge', 'commissionPercent'] as const;
export type DefaultField = (typeof DEFAULT_FIELDS)[number];
export type Rates = Record<PackageField, number>;
export type Defaults = Record<DefaultField, number>;
export interface Package extends Rates { id: string; name: string; models: string[]; cars: number }

/** A name or model as typed: single spaces, none at the ends. */
const tidy = (raw: string) => String(raw ?? '').trim().replace(/\s+/g, ' ');
const NAME_MAX = 60;
/** At most this many models in one save, to stop a pasted list (#21 review). */
export const MODELS_MAX = 20;
const MODEL = /^[\p{L}\p{N}][\p{L}\p{N} ()./-]{0,39}$/u;
const outOfLimits = (f: PackageField | DefaultField, v: number) => !Number.isInteger(v) || v < LIMITS[f][0] || v > LIMITS[f][1];

/** Every package, in the order of system design 4.1 then as added, with its models and how many cars started from it. */
export async function listPackages(tx: Tx | typeof db = db): Promise<Package[]> {
  const rows = await tx.select().from(startingPackage).orderBy(asc(startingPackage.position));
  const models = await tx.select().from(startingPackageModel).orderBy(asc(startingPackageModel.position));
  const cars = await tx.select({ id: vehicle.startingPackageId, n: count() }).from(vehicle).groupBy(vehicle.startingPackageId);
  return rows.map((p) => ({
    id: p.id, name: p.name, dailyRate: p.dailyRate, kmPerDay: p.kmPerDay, extraKmRate: p.extraKmRate,
    models: models.filter((m) => m.packageId === p.id).map((m) => m.model),
    cars: cars.find((c) => c.id === p.id)?.n ?? 0,
  }));
}

/** The packages a model can start from, in package order. */
export async function packagesFor(model: string, tx: Tx | typeof db = db): Promise<Package[]> {
  const key = tidy(model).toLowerCase();
  return (await listPackages(tx)).filter((p) => p.models.some((m) => m.toLowerCase() === key));
}

/** Every model a car can be, each once, in package order. */
export async function modelsInUse(): Promise<string[]> {
  const seen = new Map<string, string>();
  for (const p of await listPackages()) for (const m of p.models) if (!seen.has(m.toLowerCase())) seen.set(m.toLowerCase(), m);
  return [...seen.values()];
}

export async function readDefaults(tx: Tx | typeof db = db): Promise<Defaults> {
  const [d] = await tx.select().from(packageDefault).where(eq(packageDefault.id, 1));
  return { longRentalExtra: d.longRentalExtra, longRentalFromDay: d.longRentalFromDay, garageDayCharge: d.garageDayCharge, commissionPercent: d.commissionPercent };
}

// All package writes take one lock: they are rare, and it keeps names unique however they are typed, and a model spelt
// one way everywhere.
const lockPackages = (tx: Tx) => tx.execute(sql`select pg_advisory_xact_lock(hashtext('sns.packages'))`);

/** A model as already written in some package, else as typed (tidied); null if it is not a usable model name. */
async function spelling(tx: Tx, raw: string): Promise<string | null> {
  const m = tidy(raw);
  if (!MODEL.test(m)) return null;
  const [known] = await tx.select({ model: startingPackageModel.model }).from(startingPackageModel)
    .where(sql`lower(${startingPackageModel.model}) = ${m.toLowerCase()}`).limit(1);
  return known?.model ?? m;
}
async function nameTaken(tx: Tx, name: string, except?: string) {
  const rows = await tx.select({ id: startingPackage.id }).from(startingPackage).where(sql`lower(${startingPackage.name}) = ${name.toLowerCase()}`);
  return rows.some((r) => r.id !== except);
}

type NameError = 'nameMissing' | 'nameTooLong' | 'nameTaken';
const nameProblem = (name: string): NameError | null => (!name ? 'nameMissing' : name.length > NAME_MAX ? 'nameTooLong' : null);

export type AddPackageResult =
  | { ok: true; id: string }
  | { error: 'notAllowed' | NameError | 'modelsMissing' | 'modelInvalid' | 'tooManyModels' }
  | { error: 'invalid'; fields: PackageField[] };

/** Adds a package with its models (a new model comes in this way). Needs "Add or edit cars and packages". */
export async function addPackage(actorId: string, input: { name: string; models: string[] } & Rates): Promise<AddPackageResult> {
  const name = tidy(input.name);
  const bad = nameProblem(name);
  if (bad) return { error: bad };
  if (!input.models.some((m) => tidy(m))) return { error: 'modelsMissing' };
  if (input.models.filter((m) => tidy(m)).length > MODELS_MAX) return { error: 'tooManyModels' };
  const fields = PACKAGE_FIELDS.filter((f) => outOfLimits(f, input[f]));
  if (fields.length) return { error: 'invalid', fields };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
    await lockPackages(tx);
    if (await nameTaken(tx, name)) return { error: 'nameTaken' } as const;
    const models: string[] = [];
    for (const raw of input.models.filter((m) => tidy(m))) {
      const m = await spelling(tx, raw);
      if (!m) return { error: 'modelInvalid' } as const;
      if (!models.some((x) => x.toLowerCase() === m.toLowerCase())) models.push(m);
    }
    const [{ next }] = await tx.select({ next: sql<number>`coalesce(max(${startingPackage.position}), 0) + 1` }).from(startingPackage);
    const rates = { dailyRate: input.dailyRate, kmPerDay: input.kmPerDay, extraKmRate: input.extraKmRate };
    const [p] = await tx.insert(startingPackage).values({ name, position: next, ...rates, createdBy: actorId }).returning({ id: startingPackage.id });
    await tx.insert(startingPackageModel).values(models.map((model, i) => ({ packageId: p.id, model, position: i + 1 })));
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'package.add', targetType: 'package', targetId: p.id, details: { package: name, models, ...rates } });
    return { ok: true, id: p.id } as const;
  });
}

export type PackageChange = 'name' | PackageField | 'models';
export type ChangePackageResult =
  | { ok: true; changed: PackageChange[] }
  | { error: 'notAllowed' | 'notFound' | NameError | 'modelInvalid' | 'tooManyModels' | 'lastModel' }
  | { error: 'invalid' | 'stale'; fields: PackageChange[] };

/**
 * Changes a package's name and rates, and adds models to it or takes them out (a package keeps at least one; cars
 * already added keep their model and terms). `was` is what the form showed: only fields the person changed are saved, none if someone saved one of
 * them meanwhile. Cars already added keep their own terms (AT-50).
 */
export async function changePackage(actorId: string, id: string, input: { name: string; addModels: string[]; removeModels?: string[] } & Rates, was: { name: string } & Rates): Promise<ChangePackageResult> {
  const name = tidy(input.name);
  const typed = PACKAGE_FIELDS.filter((f) => input[f] !== was[f]);
  const fields = typed.filter((f) => outOfLimits(f, input[f]));
  if (fields.length) return { error: 'invalid', fields };
  if (input.addModels.filter((m) => tidy(m)).length > MODELS_MAX) return { error: 'tooManyModels' };
  const renamed = name !== tidy(was.name);
  if (renamed) { const bad = nameProblem(name); if (bad) return { error: bad }; }
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editCarsAndPackages'))) return { error: 'notAllowed' } as const;
    await lockPackages(tx);
    const [now] = await tx.select().from(startingPackage).where(eq(startingPackage.id, id));
    if (!now) return { error: 'notFound' } as const;
    const stale: PackageChange[] = [...(renamed && now.name !== tidy(was.name) ? ['name' as const] : []), ...typed.filter((f) => now[f] !== was[f])];
    if (stale.length) return { error: 'stale', fields: stale } as const;
    if (renamed && (await nameTaken(tx, name, id))) return { error: 'nameTaken' } as const;
    const have = (await tx.select({ model: startingPackageModel.model, position: startingPackageModel.position }).from(startingPackageModel)
      .where(eq(startingPackageModel.packageId, id)));
    const adding: string[] = [];
    for (const raw of input.addModels.filter((m) => tidy(m))) {
      const m = await spelling(tx, raw);
      if (!m) return { error: 'modelInvalid' } as const;
      if (![...have.map((h) => h.model), ...adding].some((x) => x.toLowerCase() === m.toLowerCase())) adding.push(m);
    }
    // Models taken out: those the package has now (one taken out meanwhile is already gone). A package keeps at least
    // one model (Derived control, 4.1).
    const removing = have.map((h) => h.model).filter((m) => (input.removeModels ?? []).some((r) => tidy(r).toLowerCase() === m.toLowerCase()));
    if (have.length - removing.length + adding.length < 1) return { error: 'lastModel' } as const;
    const changed: PackageChange[] = [...(renamed ? ['name' as const] : []), ...typed];
    if (changed.length) {
      await tx.update(startingPackage).set({ ...(renamed ? { name } : {}), ...Object.fromEntries(typed.map((f) => [f, input[f]])) }).where(eq(startingPackage.id, id));
      for (const f of changed) {
        await tx.insert(auditEvent).values({ createdBy: actorId, action: 'package.change', targetType: 'package', targetId: id,
          details: { package: now.name, field: f, old: f === 'name' ? now.name : now[f as PackageField], new: f === 'name' ? name : input[f as PackageField] } });
      }
    }
    const last = Math.max(0, ...have.map((h) => h.position));
    let models = have.sort((a, b) => a.position - b.position).map((h) => h.model);
    for (const [i, model] of adding.entries()) {
      await tx.insert(startingPackageModel).values({ packageId: id, model, position: last + i + 1 });
      // The package's models before and after, as for any other change (4.1).
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'package.addModel', targetType: 'package', targetId: id,
        details: { package: renamed ? name : now.name, model, old: models, new: [...models, model] } });
      models = [...models, model];
    }
    for (const model of removing) {
      await tx.delete(startingPackageModel).where(and(eq(startingPackageModel.packageId, id), eq(startingPackageModel.model, model)));
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'package.removeModel', targetType: 'package', targetId: id,
        details: { package: renamed ? name : now.name, model, old: models, new: models.filter((m) => m !== model) } });
      models = models.filter((m) => m !== model);
    }
    return { ok: true, changed: adding.length || removing.length ? [...changed, 'models'] : changed } as const;
  });
}

export type ChangeDefaultsResult = { ok: true; changed: DefaultField[] } | { error: 'notAllowed' } | { error: 'invalid' | 'stale'; fields: DefaultField[] };

/** Changes the defaults every new car starts with (4.2). The commission also needs "Add or edit partners". */
export async function changeDefaults(actorId: string, input: Defaults, was: Defaults): Promise<ChangeDefaultsResult> {
  const typed = DEFAULT_FIELDS.filter((f) => input[f] !== was[f]);
  const fields = typed.filter((f) => outOfLimits(f, input[f]));
  if (fields.length) return { error: 'invalid', fields };
  return db.transaction(async (tx) => {
    const needs: Permission[] = typed.includes('commissionPercent') ? ['editCarsAndPackages', 'editPartners'] : ['editCarsAndPackages'];
    for (const p of needs) if (!(await actorMay(tx, actorId, p))) return { error: 'notAllowed' } as const;
    if (!typed.length) return { ok: true, changed: [] } as const;
    await lockPackages(tx);
    const now = await readDefaults(tx);
    const stale = typed.filter((f) => now[f] !== was[f]);
    if (stale.length) return { error: 'stale', fields: stale } as const;
    await tx.update(packageDefault).set(Object.fromEntries(typed.map((f) => [f, input[f]]))).where(eq(packageDefault.id, 1));
    for (const f of typed) {
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'package.defaults', targetType: 'package', targetId: 'defaults', details: { field: f, old: now[f], new: input[f] } });
    }
    return { ok: true, changed: typed } as const;
  });
}
