import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, partnerOwner, permissionGrant, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { phoneProblem } from '../../auth/phone';
import { MIN_PASSWORD_LENGTH } from '../../auth/rules';
import { NIC, normalNic } from '../../lib/nic';
import { realDate, todayColombo } from '../../lib/dates';
import { createPartnerAccount, hashPassword, type Tx } from '../people/people';
import { isCost, linkCarToPartner, listCars, LIMITS, type Car, type Cost } from '../cars/cars';

export { unlinkedPartnerCars } from '../cars/cars';
export { normalNic } from '../../lib/nic';

// Partner owners (ST-11.1 to ST-11.3; system design 3.2 "Partner accounts", 10, 14; Proposed: Dulan, 1 Nov 2026).
// Whoever may add or edit partners (the admin by default) adds one, with their sign-in account and their cars; turning
// the account off or on stays with the owner (people module). Earnings, cash-outs and the starting balance come later.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PartnerError = 'notAllowed' | 'notFound' | 'nameMissing' | 'phoneMissing' | 'phoneInvalid' | 'phoneTaken' | 'passwordShort'
  | 'nicInvalid' | 'nicTaken' | 'bankTooLong' | 'carsMissing' | 'carsInvalid' | 'carNotFree' | 'dateInvalid';
export interface NewPartner {
  name: string; phone: string; password: string; nic: string; bankAccount?: string;
  cars: { carId: string; commissionPercent: number; ownerPays: string[] }[];
}

/** One chosen car: its commission within the limits and known costs, each once. */
function okCar(c: NewPartner['cars'][number]): boolean {
  const [lo, hi] = LIMITS.commissionPercent;
  return UUID.test(c.carId) && Number.isInteger(c.commissionPercent) && c.commissionPercent >= lo && c.commissionPercent <= hi
    && Array.isArray(c.ownerPays) && c.ownerPays.every(isCost) && new Set(c.ownerPays).size === c.ownerPays.length;
}

class Refusal extends Error { constructor(readonly code: PartnerError) { super(code); } }

async function actorMay(tx: Tx, actorId: string, permission: Permission): Promise<boolean> {
  const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!actor) return false;
  const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(actor, granted, permission);
}

/**
 * Adds a partner (ST-11.2): their sign-in account with a first password (changed at the first sign-in), NIC, optional
 * bank account, and at least one partner car not yet linked, each with its commission and the costs the owner pays.
 * One transaction: a refusal saves nothing. Logged without the password (PR-05).
 */
export async function addPartner(actorId: string, input: NewPartner): Promise<{ ok: true; id: string; userId: string } | { error: PartnerError }> {
  const name = (input.name ?? '').trim();
  if (!name) return { error: 'nameMissing' };
  const phone = (input.phone ?? '').trim();
  const phoneIssue = phoneProblem(phone);
  if (phoneIssue) return { error: phoneIssue };
  if ((input.password ?? '').length < MIN_PASSWORD_LENGTH) return { error: 'passwordShort' };
  const nic = normalNic(input.nic ?? '');
  if (!NIC.test(nic)) return { error: 'nicInvalid' };
  const bankAccount = (input.bankAccount ?? '').trim() || null;
  if (bankAccount && bankAccount.length > 120) return { error: 'bankTooLong' };
  const cars = input.cars ?? [];
  if (!cars.length) return { error: 'carsMissing' };
  if (!cars.every(okCar) || new Set(cars.map((c) => c.carId)).size !== cars.length) return { error: 'carsInvalid' };
  const passwordHash = await hashPassword(input.password);
  try {
    return await db.transaction(async (tx) => {
      if (!(await actorMay(tx, actorId, 'editPartners'))) throw new Refusal('notAllowed');
      if ((await tx.select({ id: partnerOwner.id }).from(partnerOwner).where(eq(partnerOwner.nic, nic))).length) throw new Refusal('nicTaken');
      const account = await createPartnerAccount(tx, { name, phone, passwordHash });
      if ('error' in account) throw new Refusal(account.error);
      const [partner] = await tx.insert(partnerOwner).values({ userId: account.id, nic, bankAccount, createdBy: actorId }).returning({ id: partnerOwner.id });
      // Cars in one fixed order, so two adds at once never wait on each other's locks (#20 review).
      for (const c of [...cars].sort((a, b) => a.carId.localeCompare(b.carId))) {
        const linked = await linkCarToPartner(tx, actorId, c.carId, partner.id, { commissionPercent: c.commissionPercent, ownerPays: c.ownerPays as Cost[] });
        if (linked === 'carNotFree') throw new Refusal('carNotFree');
        if (linked === 'invalid') throw new Refusal('carsInvalid');
      }
      const plates = (await tx.execute(sql`select registration from vehicle where partner_owner_id = ${partner.id} order by registration`)).rows.map((r) => String(r.registration));
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'partner.add', targetType: 'person', targetId: account.id,
        details: { name, cars: plates, bankAccount: bankAccount !== null } });
      return { ok: true, id: partner.id, userId: account.id } as const;
    });
  } catch (e) {
    if (e instanceof Refusal) return { error: e.code };
    const pg = (e as { cause?: { code?: string; constraint?: string } }).cause ?? (e as { code?: string; constraint?: string });
    if (pg.code === '23505' && pg.constraint === 'partner_owner_one_per_nic') return { error: 'nicTaken' };
    if (pg.code === '23505' && pg.constraint?.includes('phone_number')) return { error: 'phoneTaken' };
    throw e;
  }
}

/**
 * Links more partner cars not yet linked to an existing partner (board 11.2 "Add a car"; #20 review): each with its
 * commission and the costs the owner pays, in one transaction, under the per-car locks in a fixed order. Logged.
 */
export async function addCarsToPartner(actorId: string, partnerId: string, cars: NewPartner['cars']): Promise<{ ok: true } | { error: PartnerError }> {
  if (!UUID.test(partnerId)) return { error: 'notFound' };
  if (!cars?.length) return { error: 'carsMissing' };
  if (!cars.every(okCar) || new Set(cars.map((c) => c.carId)).size !== cars.length) return { error: 'carsInvalid' };
  try {
    return await db.transaction(async (tx) => {
      if (!(await actorMay(tx, actorId, 'editPartners'))) throw new Refusal('notAllowed');
      const [p] = await tx.select({ userId: partnerOwner.userId }).from(partnerOwner).where(eq(partnerOwner.id, partnerId));
      if (!p) throw new Refusal('notFound');
      const before = new Set((await tx.execute(sql`select registration from vehicle where partner_owner_id = ${partnerId}`)).rows.map((r) => String(r.registration)));
      for (const c of [...cars].sort((a, b) => a.carId.localeCompare(b.carId))) {
        const linked = await linkCarToPartner(tx, actorId, c.carId, partnerId, { commissionPercent: c.commissionPercent, ownerPays: c.ownerPays as Cost[] });
        if (linked === 'carNotFree') throw new Refusal('carNotFree');
        if (linked === 'invalid') throw new Refusal('carsInvalid');
      }
      const plates = (await tx.execute(sql`select registration from vehicle where partner_owner_id = ${partnerId} order by registration`)).rows.map((r) => String(r.registration)).filter((r) => !before.has(r));
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'partner.addCars', targetType: 'person', targetId: p.userId, details: { cars: plates } });
      return { ok: true } as const;
    });
  } catch (e) {
    if (e instanceof Refusal) return { error: e.code };
    throw e;
  }
}

/** Records the date the paper agreement was signed (ST-11.3; system design 14): not in the future. Nothing waits on it. */
export async function recordAgreementSigned(actorId: string, partnerId: string, signedOn: string): Promise<{ ok: true } | { error: PartnerError }> {
  if (!UUID.test(partnerId)) return { error: 'notFound' };
  if (!realDate(signedOn) || signedOn > todayColombo()) return { error: 'dateInvalid' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editPartners'))) return { error: 'notAllowed' } as const;
    // The old date too (PR-05), read under a row lock so two records at once each log what they replaced.
    const [p] = await tx.select({ userId: partnerOwner.userId, old: partnerOwner.agreementSignedOn }).from(partnerOwner).where(eq(partnerOwner.id, partnerId)).for('update');
    if (!p) return { error: 'notFound' } as const;
    await tx.update(partnerOwner).set({ agreementSignedOn: signedOn }).where(eq(partnerOwner.id, partnerId));
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'partner.agreementSigned', targetType: 'person', targetId: p.userId, details: { signedOn, old: p.old } });
    return { ok: true } as const;
  });
}

export interface PartnerRow { id: string; userId: string; name: string; phone: string | null; active: boolean; cars: number; plates: string[]; commission: number[] }
export interface Partner extends Omit<PartnerRow, 'cars' | 'commission' | 'plates'> { nic: string; bankAccount: string | null; agreementSignedOn: string | null; cars: Car[] }

async function partnerRows() {
  return db.select({ id: partnerOwner.id, userId: partnerOwner.userId, name: user.name, phone: user.phoneNumber, disabledAt: user.disabledAt,
    nic: partnerOwner.nic, bankAccount: partnerOwner.bankAccount, agreementSignedOn: partnerOwner.agreementSignedOn })
    .from(partnerOwner).innerJoin(user, eq(user.id, partnerOwner.userId)).orderBy(user.name);
}

/** Every partner with their cars and commissions (ST-11.1). For people who may see partner terms. */
export async function listPartners(): Promise<PartnerRow[]> {
  const [rows, cars] = await Promise.all([partnerRows(), listCars()]);
  return rows.map((r) => {
    const own = cars.filter((c) => c.partnerId === r.id);
    return { id: r.id, userId: r.userId, name: r.name, phone: r.phone, active: !r.disabledAt, cars: own.length, plates: own.map((c) => c.registration),
      commission: [...new Set(own.map((c) => c.terms.commissionPercent ?? 0))].sort((a, b) => a - b) };
  });
}

/** One partner with their cars and terms (ST-11.3), or null. */
export async function getPartner(id: string): Promise<Partner | null> {
  if (!UUID.test(id)) return null;
  const [rows, cars] = await Promise.all([partnerRows(), listCars()]);
  const r = rows.find((x) => x.id === id);
  if (!r) return null;
  return { id: r.id, userId: r.userId, name: r.name, phone: r.phone, active: !r.disabledAt, nic: r.nic, bankAccount: r.bankAccount,
    agreementSignedOn: r.agreementSignedOn, cars: cars.filter((c) => c.partnerId === r.id) };
}
