import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, goliveTick, permissionGrant, startingPackage, user, vehicle, vehicleStatusEvent } from '../../db/schema';
import type { Permission } from '../../auth/permissions';

// The go-live checklist (ST-01.3; system design, starting data). Confirmed: the system goes live only when all of
// these are done: business details on printouts; every car entered; starting packages; insurance and licence dates for
// every car; every partner car linked to its owner; staff accounts; the authorised person for checking payments,
// write-offs, cancellation fees and expired papers; opening cash in the drawer; SNS's agreement wording; and every Open
// decision. Confirmed 5 Nov 2026: the owner only; the system checks what it can count; the owner ticks the rest
// (untick with a reason); items whose part is not built yet show "Not ready" and block. Going live itself is Phase 4.

export type ItemKind = 'auto' | 'tick' | 'later';
/** The three groups of board 01.3. */
export const GROUPS = { business: ['businessDetails', 'carsEntered', 'startingPackages', 'carDates', 'partnerCars'], people: ['staffAccounts', 'authorisedPerson'], firstDay: ['openingCash', 'agreementWording', 'openDecisions'] } as const;
export const ITEMS = [
  { key: 'businessDetails', kind: 'later', part: 'printouts' },
  { key: 'carsEntered', kind: 'tick' },
  { key: 'startingPackages', kind: 'tick' },
  { key: 'carDates', kind: 'auto' },
  { key: 'partnerCars', kind: 'auto' },
  { key: 'staffAccounts', kind: 'tick' },
  { key: 'authorisedPerson', kind: 'auto' },
  { key: 'openingCash', kind: 'later', part: 'money' },
  { key: 'agreementWording', kind: 'later', part: 'printouts' },
  { key: 'openDecisions', kind: 'tick' },
] as const satisfies readonly { key: string; kind: ItemKind; part?: string }[];
export type ItemKey = (typeof ITEMS)[number]['key'];
export const TICK_ITEMS = ITEMS.filter((i) => i.kind === 'tick').map((i) => i.key) as ItemKey[];
/** The tasks only an authorised person does; until the owner names one, only the owner can (ST-15.1, Derived control). */
export const AUTHORISED: Permission[] = ['reconcilePayments', 'writeOffDebt', 'keepCancellationFee', 'overrideExpiredDocuments'];
export const REASON_MAX = 500;

export interface Item {
  key: ItemKey; kind: ItemKind; part?: string; done: boolean;
  /** What the system counted, for the line under the item. */
  facts: Record<string, number | string[]>;
  /** For ticked items: who ticked or unticked it last, and when. */
  tick: { done: boolean; byName: string | null; at: Date; reason: string | null } | null;
}
export interface Checklist { items: Item[]; ready: number; total: number; blocked: boolean; blockers: ItemKey[] }

/** The checklist now. Retired cars are not in the fleet, so they need no dates and no owner link. */
export async function readChecklist(): Promise<Checklist> {
  // One light read of the cars (the owner's home runs this too): only what the checks need, with each car's newest status.
  const state = db.selectDistinctOn([vehicleStatusEvent.vehicleId], { vehicleId: vehicleStatusEvent.vehicleId, status: vehicleStatusEvent.status })
    .from(vehicleStatusEvent).orderBy(vehicleStatusEvent.vehicleId, desc(vehicleStatusEvent.createdAt), desc(vehicleStatusEvent.id)).as('state');
  const [cars, named, [{ people }], [{ packages }], ticks] = await Promise.all([
    db.select({ plate: vehicle.registration, ownership: vehicle.ownership, partnerId: vehicle.partnerOwnerId, insurance: vehicle.insuranceExpires,
      licence: vehicle.licenceExpires, status: state.status }).from(vehicle).leftJoin(state, eq(state.vehicleId, vehicle.id)).orderBy(vehicle.registration),
    // Someone active, other than the owner, holds each authorised task.
    db.selectDistinct({ p: permissionGrant.permission }).from(permissionGrant).innerJoin(user, eq(user.id, permissionGrant.userId))
      .where(and(inArray(permissionGrant.permission, AUTHORISED), isNull(user.disabledAt), inArray(user.role, ['admin', 'staff']))),
    db.select({ people: sql<number>`count(*)::int` }).from(user).where(and(isNull(user.disabledAt), inArray(user.role, ['owner', 'admin', 'staff']))),
    db.select({ packages: sql<number>`count(*)::int` }).from(startingPackage),
    db.selectDistinctOn([goliveTick.item], { item: goliveTick.item, done: goliveTick.done, reason: goliveTick.reason, at: goliveTick.createdAt, byName: user.name })
      .from(goliveTick).leftJoin(user, eq(user.id, goliveTick.createdBy)).orderBy(goliveTick.item, desc(goliveTick.createdAt), desc(goliveTick.id)),
  ]);
  const fleet = cars.filter((c) => c.status !== 'retired');
  const noInsurance = fleet.filter((c) => !c.insurance).map((c) => c.plate);
  const noLicence = fleet.filter((c) => !c.licence).map((c) => c.plate);
  const unlinked = fleet.filter((c) => c.ownership === 'partner' && !c.partnerId).map((c) => c.plate);
  const partnerCars = fleet.filter((c) => c.ownership === 'partner').length;
  const notNamed = AUTHORISED.filter((p) => !named.some((n) => n.p === p));
  const tickOf = (k: string) => ticks.find((t) => t.item === k) ?? null;

  const items: Item[] = ITEMS.map((i) => {
    const t = tickOf(i.key);
    const tick = i.kind === 'tick' && t ? { done: t.done, byName: t.byName, at: t.at, reason: t.reason } : null;
    const facts: Item['facts'] =
      i.key === 'carsEntered' ? { cars: fleet.length }
        : i.key === 'startingPackages' ? { packages }
          : i.key === 'carDates' ? { cars: fleet.length, noInsurance, noLicence }
            : i.key === 'partnerCars' ? { partnerCars, unlinked }
              : i.key === 'staffAccounts' ? { people }
                : i.key === 'authorisedPerson' ? { notNamed: notNamed as string[] } : {};
    const done = i.kind === 'later' ? false
      : i.kind === 'tick' ? !!tick?.done
        : i.key === 'carDates' ? fleet.length > 0 && !noInsurance.length && !noLicence.length
          : i.key === 'partnerCars' ? !unlinked.length
            : !notNamed.length;
    return { key: i.key, kind: i.kind, ...('part' in i ? { part: i.part } : {}), done, facts, tick };
  });
  const blockers = items.filter((i) => !i.done).map((i) => i.key);
  return { items, ready: items.length - blockers.length, total: items.length, blocked: blockers.length > 0, blockers };
}

export type TickResult = { ok: true } | { error: 'notAllowed' | 'itemInvalid' | 'reasonMissing' | 'tooLong' | 'stale' };

/**
 * The owner ticks an item done, or unticks it with a reason. `was` is what the page showed (done or not): if it changed
 * meanwhile, nothing is saved. Logged as golive.tick or golive.untick.
 */
export async function tick(actorId: string, item: string, done: boolean, reasonRaw: string | undefined, was: boolean): Promise<TickResult> {
  if (!(TICK_ITEMS as string[]).includes(item)) return { error: 'itemInvalid' };
  const reason = String(reasonRaw ?? '').trim().replace(/\s+/g, ' ');
  if (!done && !reason) return { error: 'reasonMissing' };
  if (reason.length > REASON_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('sns.golive'))`);
    const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    if (!actor || actor.disabledAt || actor.role !== 'owner') return { error: 'notAllowed' } as const;
    const [now] = await tx.select({ done: goliveTick.done }).from(goliveTick).where(eq(goliveTick.item, item)).orderBy(desc(goliveTick.createdAt), desc(goliveTick.id)).limit(1);
    if ((now?.done ?? false) !== was) return { error: 'stale' } as const;
    if (was === done) return { ok: true } as const;
    await tx.insert(goliveTick).values({ item, done, reason: reason || null, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: done ? 'golive.tick' : 'golive.untick', targetType: 'golive', targetId: item,
      details: { item, ...(reason ? { reason } : {}) } });
    return { ok: true } as const;
  });
}
