import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, partnerOwner, permissionGrant, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { phoneProblem } from '../../auth/phone';
import { MIN_PASSWORD_LENGTH } from '../../auth/rules';
import { createPartnerAccount, hashPassword, type Tx } from '../people/people';
import { isCost, linkCarToPartner, listCars, LIMITS, type Car, type Cost } from '../cars/cars';

export { unlinkedPartnerCars } from '../cars/cars';

// Partner owners (ST-11.1 to ST-11.3; system design 3.2 "Partner accounts", 10, 14; Proposed: Dulan, 1 Nov 2026).
// Whoever may add or edit partners (the admin by default) adds one, with their sign-in account and their cars; turning
// the account off or on stays with the owner (people module). Earnings, cash-outs and the starting balance come later.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A NIC as on the card: 9 digits and V or X (old cards), or 12 digits (new cards). */
const NIC = /^(\d{9}[VX]|\d{12})$/;
export const normalNic = (raw: string) => raw.replace(/\s+/g, '').toUpperCase();

export type PartnerError = 'notAllowed' | 'notFound' | 'nameMissing' | 'phoneMissing' | 'phoneInvalid' | 'phoneTaken' | 'passwordShort'
  | 'nicInvalid' | 'nicTaken' | 'bankTooLong' | 'carsMissing' | 'carsInvalid' | 'carNotFree' | 'dateInvalid';
export interface NewPartner {
  name: string; phone: string; password: string; nic: string; bankAccount?: string;
  cars: { carId: string; commissionPercent: number; ownerPays: string[] }[];
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
  const phoneIssue = phoneProblem(input.phone ?? '');
  if (phoneIssue) return { error: phoneIssue };
  if ((input.password ?? '').length < MIN_PASSWORD_LENGTH) return { error: 'passwordShort' };
  const nic = normalNic(input.nic ?? '');
  if (!NIC.test(nic)) return { error: 'nicInvalid' };
  const bankAccount = (input.bankAccount ?? '').trim() || null;
  if (bankAccount && bankAccount.length > 120) return { error: 'bankTooLong' };
  const cars = input.cars ?? [];
  if (!cars.length) return { error: 'carsMissing' };
  const [lo, hi] = LIMITS.commissionPercent;
  const okCar = (c: NewPartner['cars'][number]) => UUID.test(c.carId) && Number.isInteger(c.commissionPercent) && c.commissionPercent >= lo && c.commissionPercent <= hi
    && Array.isArray(c.ownerPays) && c.ownerPays.every(isCost) && new Set(c.ownerPays).size === c.ownerPays.length;
  if (!cars.every(okCar) || new Set(cars.map((c) => c.carId)).size !== cars.length) return { error: 'carsInvalid' };
  const passwordHash = await hashPassword(input.password);
  try {
    return await db.transaction(async (tx) => {
      if (!(await actorMay(tx, actorId, 'editPartners'))) throw new Refusal('notAllowed');
      if ((await tx.select({ id: partnerOwner.id }).from(partnerOwner).where(eq(partnerOwner.nic, nic))).length) throw new Refusal('nicTaken');
      const account = await createPartnerAccount(tx, { name, phone: input.phone, passwordHash });
      if ('error' in account) throw new Refusal(account.error);
      const [partner] = await tx.insert(partnerOwner).values({ userId: account.id, nic, bankAccount, createdBy: actorId }).returning({ id: partnerOwner.id });
      for (const c of cars) {
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

/** Today in Sri Lanka, as YYYY-MM-DD. */
const todayColombo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Records the date the paper agreement was signed (ST-11.3; system design 14): not in the future. Nothing waits on it. */
export async function recordAgreementSigned(actorId: string, partnerId: string, signedOn: string): Promise<{ ok: true } | { error: PartnerError }> {
  if (!UUID.test(partnerId)) return { error: 'notFound' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(signedOn) || Number.isNaN(Date.parse(`${signedOn}T00:00:00Z`)) || signedOn > todayColombo() || signedOn < '2000-01-01') return { error: 'dateInvalid' };
  return db.transaction(async (tx) => {
    if (!(await actorMay(tx, actorId, 'editPartners'))) return { error: 'notAllowed' } as const;
    const [p] = await tx.update(partnerOwner).set({ agreementSignedOn: signedOn }).where(eq(partnerOwner.id, partnerId)).returning({ userId: partnerOwner.userId });
    if (!p) return { error: 'notFound' } as const;
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'partner.agreementSigned', targetType: 'person', targetId: p.userId, details: { signedOn } });
    return { ok: true } as const;
  });
}

export interface PartnerRow { id: string; userId: string; name: string; phone: string | null; active: boolean; cars: number; commission: number[] }
export interface Partner extends Omit<PartnerRow, 'cars' | 'commission'> { nic: string; bankAccount: string | null; agreementSignedOn: string | null; cars: Car[] }

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
    return { id: r.id, userId: r.userId, name: r.name, phone: r.phone, active: !r.disabledAt, cars: own.length,
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
