import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, customer, permissionGrant, referencePerson, rental, rentalEvent, rentalTermsSnapshot, user } from '../../db/schema';
import { allows } from '../../auth/permissions';
import { getReference, type RefCopyKind } from '../customers/references';

// Step 4 of New rental (05.4; ST-05.4, ST-05.5; system design 8.1, 8.2, 6; Confirmed 8 Nov 2026): the deposit (LKR 1
// to 500,000, typed each time) or its waiver with a reason; the rent paid now or at return; the fuel option (not
// counted, or same level, which needs the owner's fuel price saved with the rental); whether a reference person is
// needed, and which. Changeable until handover; each change is a rental_event and an activity-log entry. Needs Customer
// access and "Set or waive a deposit". A deposit is money held, never income (PR-09): the money comes with #53/#64.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const DEPOSIT_RANGE = [1, 500_000] as const;
export const REASON_MAX = 500;
export const RENT_PAID = ['return', 'now'] as const;
export const FUEL = ['notCounted', 'sameLevel'] as const;
export type RentPaid = (typeof RENT_PAID)[number];
export type Fuel = (typeof FUEL)[number];

export interface TermsInput {
  deposit: number | null; waiveReason?: string; rentPaid: RentPaid; fuel: Fuel; referenceRequired: boolean; referencePersonId?: string | null;
}
export type TermsError = 'notAllowed' | 'notFound' | 'notDraft' | 'depositInvalid' | 'reasonMissing' | 'tooLong' | 'rentPaidInvalid' | 'fuelInvalid'
  | 'fuelPriceNotSet' | 'referenceNotFound';

/** Saves step 4 on a saved rental that has not gone out yet. Logged as rental.terms with what was chosen. */
export async function setRentalTerms(actorId: string, rentalId: string, input: TermsInput): Promise<{ ok: true } | { error: TermsError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  const waived = input.deposit === null;
  const reason = String(input.waiveReason ?? '').trim().replace(/\s+/g, ' ');
  if (waived && !reason) return { error: 'reasonMissing' };
  if (reason.length > REASON_MAX) return { error: 'tooLong' };
  if (!waived && (!Number.isSafeInteger(input.deposit) || input.deposit! < DEPOSIT_RANGE[0] || input.deposit! > DEPOSIT_RANGE[1])) return { error: 'depositInvalid' };
  if (!(RENT_PAID as readonly string[]).includes(input.rentPaid)) return { error: 'rentPaidInvalid' };
  if (!(FUEL as readonly string[]).includes(input.fuel)) return { error: 'fuelInvalid' };
  const refId = input.referenceRequired ? (input.referencePersonId || null) : null;
  if (refId && !UUID.test(refId)) return { error: 'referenceNotFound' };
  return db.transaction(async (tx) => {
    const [a] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
    if (!a || !allows(a, granted, 'customerAccess') || !allows(a, granted, 'setOrWaiveDeposit')) return { error: 'notAllowed' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId}`}))`);
    const [r] = await tx.select({ status: rental.status, customerId: rental.customerId, fuelPrice: rentalTermsSnapshot.fuelPricePerLitre, name: customer.name })
      .from(rental).innerJoin(rentalTermsSnapshot, eq(rentalTermsSnapshot.rentalId, rental.id)).innerJoin(customer, eq(customer.id, rental.customerId))
      .where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    if (r.status !== 'draft') return { error: 'notDraft' } as const;
    if (input.fuel === 'sameLevel' && r.fuelPrice === null) return { error: 'fuelPriceNotSet' } as const;
    if (refId) {
      const [ref] = await tx.select({ id: referencePerson.id }).from(referencePerson).where(and(eq(referencePerson.id, refId), eq(referencePerson.customerId, r.customerId)));
      if (!ref) return { error: 'referenceNotFound' } as const;
    }
    const values = { depositAmount: waived ? null : input.deposit, depositWaivedReason: waived ? reason : null, rentPaid: input.rentPaid, fuel: input.fuel,
      referenceRequired: input.referenceRequired, referencePersonId: refId };
    await tx.update(rental).set({ ...values, termsSetAt: sql`now()`, updatedAt: sql`now()` }).where(eq(rental.id, rentalId));
    const details = { deposit: values.depositAmount, ...(waived ? { waivedReason: reason } : {}), rentPaid: values.rentPaid, fuel: values.fuel,
      referenceRequired: values.referenceRequired, ...(refId ? { referencePersonId: refId } : {}) };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'terms', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.terms', targetType: 'rental', targetId: rentalId, details: { name: r.name, ...details } });
    return { ok: true } as const;
  });
}

export interface Readiness {
  termsSet: boolean; deposit: number | null; waivedReason: string | null; rentPaid: RentPaid | null; fuel: Fuel | null;
  referenceRequired: boolean | null; referencePersonId: string | null; referenceMissing: boolean; referenceCopiesMissing: RefCopyKind[];
}

/** What step 4 holds for a rental, and what is still missing for the reference person (AT-07; the handover check uses it, #57). */
export async function rentalReadiness(rentalId: string): Promise<Readiness | null> {
  if (!UUID.test(rentalId)) return null;
  const [r] = await db.select().from(rental).where(eq(rental.id, rentalId));
  if (!r) return null;
  const ref = r.referenceRequired && r.referencePersonId ? await getReference(r.referencePersonId) : null;
  return {
    termsSet: r.termsSetAt !== null, deposit: r.depositAmount, waivedReason: r.depositWaivedReason, rentPaid: r.rentPaid as RentPaid | null, fuel: r.fuel as Fuel | null,
    referenceRequired: r.referenceRequired, referencePersonId: r.referencePersonId,
    referenceMissing: r.referenceRequired === true && !r.referencePersonId,
    referenceCopiesMissing: ref ? ref.copiesMissing : [],
  };
}
