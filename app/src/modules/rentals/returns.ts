import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { approvalDecision, approvalRequest, auditEvent, charge, customer, depositMovement, paymentAllocation, permissionGrant, rental, rentalEvent, rentalHandover,
  rentalReturn, rentalVehicleSegment, user, vehicle, vehicleHold, vehicleStatusEvent } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';
import { splitShare } from '../../lib/money';
import { approvedChanges, rentalTerms } from './rentals';
import { FUEL_LEVELS, KM_MAX, type FuelLevel } from './handover';
import { minutesLate } from './list';
import { rentalNumber } from './agreements';
import { closeWaiting } from '../approvals/approvals';

// Receive the car and settle the bill (07.1, 07.2; ST-07.1, ST-07.2; system design 7.4 "Receiving the car", 8.4, 6, 11;
// Confirmed 11 Nov 2026). Anyone with Customer access receives a car that is out: the incoming odometer (not below the
// outgoing one), the fuel and the accessories again (confirmed checked), the late charge (an amount, or waived with a
// reason), same-level fuel (whole litres × the saved price, or waived with a reason), each accessory missing since
// handover (an amount, or 0 with a reason), damage (what happened and an amount), garage days (only with damage and the
// car then Under repair; an admin approves them), and the car's next state. The bill is saved line by line, each with
// who gets it. An unpaid part not covered by the deposit held needs "Allow payment after return" and a note.
// Partner earning lines are made from these lines with the day close (Phase 3). rental_return and charge are insert-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const LATE_MAX = 100_000;
export const ITEM_MAX = 500_000;
export const LITRES_MAX = 100;
export const GARAGE_DAYS_MAX = 30;
export const TEXT_MAX = 500;
export const NEXT_STATES = ['available', 'repair', 'unavailable'] as const;
export type NextState = (typeof NEXT_STATES)[number];
type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
const tidy = (v: unknown) => String(v ?? '').trim();
const whole = (n: unknown, min: number, max: number) => Number.isSafeInteger(n) && (n as number) >= min && (n as number) <= max;

export interface ReturnInput {
  inKm: number; fuel: FuelLevel; accessories: { item: string; present: boolean }[]; checked: boolean; fuelTakenOut?: number | null;
  late?: { amount?: number; waiveReason?: string }; fuelCharge?: { litres?: number; waiveReason?: string };
  accessoryCharges?: { item: string; amount: number; reason?: string }[]; damage?: { what: string; amount: number }; garageDays?: number;
  nextState: NextState; nextReason?: string; payLaterNote?: string;
}
export type ReturnError = 'notAllowed' | 'notFound' | 'notOut' | 'kmInvalid' | 'kmLower' | 'fuelInvalid' | 'notChecked' | 'listChanged' | 'nextInvalid' | 'nextReasonMissing'
  | 'notLate' | 'lateMissing' | 'lateInvalid' | 'fuelMissing' | 'fuelNotLower' | 'litresInvalid' | 'accessoryMissing' | 'accessoryNotMissing' | 'amountInvalid' | 'reasonMissing'
  | 'damageInvalid' | 'garageInvalid' | 'garageNeedsDamage' | 'garageNeedsRepair' | 'tooLong' | 'payLaterNotAllowed' | 'payLaterNoteMissing' | 'noFuelPrice';
export type ReturnResult = { ok: true } | { error: ReturnError; outKm?: number; lateMinutes?: number; item?: string; unpaid?: number };

type Line = { kind: string; amount: number; details: Record<string, unknown>; reason: string | null; allocation: 'commission' | 'split' | 'sns' | 'admin'; partnerShare: number | null };

async function actor(q: Q, id: string) {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, id));
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, id))).map((g) => g.p));
  return { a, may: (p: Permission) => !!a && allows(a, granted, p) };
}

/** What is paid on a rental's bill and the deposit held now (received; applied and refunded with #64). */
export async function paidAndHeld(q: Q, rentalId: string) {
  // Paid: payments put on this bill and any deposit used for it (#64, this rental's or another's). Held: the deposit
  // received on this rental less what its settlement used or refunded. debtOf (customers/flags.ts) counts the same way.
  const [p] = await q.select({ n: sql<string>`coalesce(sum(${paymentAllocation.amount}), 0)` }).from(paymentAllocation).where(eq(paymentAllocation.rentalId, rentalId));
  const [a] = await q.select({ n: sql<string>`coalesce(sum(${depositMovement.amount}), 0)` }).from(depositMovement)
    .where(and(eq(depositMovement.toRentalId, rentalId), eq(depositMovement.kind, 'applied')));
  const [d] = await q.select({ n: sql<string>`coalesce(sum(case when ${depositMovement.kind} = 'received' then ${depositMovement.amount} else -${depositMovement.amount} end), 0)` })
    .from(depositMovement).where(eq(depositMovement.rentalId, rentalId));
  return { paid: Number(p.n) + Number(a.n), depositHeld: Number(d.n) };
}

/** Receives the car: checks everything again under the car's and the rental's locks, saves the return and the bill. */
export async function receiveCar(actorId: string, rentalId: string, input: ReturnInput): Promise<ReturnResult> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (!whole(input.inKm, 0, KM_MAX)) return { error: 'kmInvalid' };
  if (!(FUEL_LEVELS as readonly string[]).includes(input.fuel)) return { error: 'fuelInvalid' };
  if (input.checked !== true) return { error: 'notChecked' };
  if (!(NEXT_STATES as readonly string[]).includes(input.nextState)) return { error: 'nextInvalid' };
  const nextReason = tidy(input.nextReason);
  if (input.nextState !== 'available' && !nextReason) return { error: 'nextReasonMissing' };
  if (input.fuelTakenOut !== undefined && input.fuelTakenOut !== null && !whole(input.fuelTakenOut, 0, LITRES_MAX)) return { error: 'litresInvalid' };
  const texts = [nextReason, tidy(input.late?.waiveReason), tidy(input.fuelCharge?.waiveReason), tidy(input.damage?.what), tidy(input.payLaterNote),
    ...(input.accessoryCharges ?? []).map((c) => tidy(c.reason))];
  if (texts.some((t) => t.length > TEXT_MAX)) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    const me = await actor(tx, actorId);
    if (!me.may('customerAccess')) return { error: 'notAllowed' } as const;
    const [seg] = await tx.select({ id: rentalVehicleSegment.id, vehicleId: rentalVehicleSegment.vehicleId }).from(rentalVehicleSegment)
      .where(eq(rentalVehicleSegment.rentalId, rentalId)).orderBy(asc(rentalVehicleSegment.position)).limit(1);
    if (!seg) return { error: 'notFound' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.vehicle:${seg.vehicleId.toLowerCase()}`}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    const [r] = await tx.select({ status: rental.status, deadlineAt: rental.deadlineAt, number: rental.number, fuelOption: rental.fuel, name: customer.name, registration: vehicle.registration })
      .from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).innerJoin(vehicle, eq(vehicle.id, seg.vehicleId)).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    if (r.status !== 'active') return { error: 'notOut' } as const;
    const [h] = await tx.select({ outKm: rentalHandover.outKm, fuel: rentalHandover.fuel, accessories: rentalHandover.accessories }).from(rentalHandover).where(eq(rentalHandover.rentalId, rentalId));
    const terms = (await rentalTerms(rentalId, tx))!;
    // One car per rental until swaps (#62) add segments: that ticket returns the car on the last segment.
    const s = terms.segments[0];
    if (input.inKm < h.outKm) return { error: 'kmLower', outKm: h.outKm } as const;
    // The list is the one ticked at handover, item by item (each handover keeps its own list).
    const out = h.accessories as { item: string; present: boolean }[];
    const now = Array.isArray(input.accessories) ? input.accessories.map((a) => ({ item: String(a?.item ?? ''), present: a?.present === true })) : [];
    if (now.length !== out.length || now.some((a, i) => a.item !== out[i].item)) return { error: 'listChanged' } as const;
    const partner = s.commissionPercent !== null;
    const bp = partner ? (100 - s.commissionPercent!) * 100 : 0;
    const byCommission = (kind: string, amount: number, details: Record<string, unknown>, reason: string | null = null): Line =>
      partner ? { kind, amount, details, reason, allocation: 'commission', partnerShare: splitShare(amount, bp).partner } : { kind, amount, details, reason, allocation: 'sns', partnerShare: null };
    const toAdmin = (kind: string, amount: number, details: Record<string, unknown>, reason: string | null = null): Line =>
      ({ kind, amount, details, reason, allocation: partner && amount !== 0 ? 'admin' : 'sns', partnerShare: null });
    const lines: Line[] = [];
    // Rent, long-rental extra and the approved price (8.4): the package amount follows the commission; the extra above a
    // partner car's package goes as the admin set when approving it (#56); a discount follows the commission.
    const changes = await approvedChanges(rentalId, tx);
    const rate = changes.rate?.dailyRate ?? s.dailyRate;
    const days = terms.days;
    if (partner && rate > s.dailyRate) {
      lines.push(byCommission('rent', days * s.dailyRate, { days, rate: s.dailyRate }));
      lines.push({ kind: 'rentExtra', amount: days * (rate - s.dailyRate), details: { days, rate, packageRate: s.dailyRate }, reason: changes.rate?.splitReason ?? null,
        allocation: 'split', partnerShare: changes.rate?.partnerExtra ?? 0 });
    } else lines.push(byCommission('rent', days * rate, { days, rate }));
    const longDays = Math.max(0, days - s.longRentalFromDay + 1);
    if (longDays && s.longRentalExtra) lines.push(byCommission('longRental', longDays * s.longRentalExtra, { days: longDays, rate: s.longRentalExtra }));
    // The discount never takes the rent below 0 (as the estimate's cap).
    const discount = Math.min(changes.discount, lines.reduce((n, l) => n + l.amount, 0));
    if (discount) lines.push(byCommission('discount', -discount, {}));
    const driven = input.inKm - h.outKm;
    const extraKm = Math.max(0, driven - days * s.kmPerDay);
    if (extraKm) lines.push(byCommission('extraKm', extraKm * s.extraKmRate, { driven, included: days * s.kmPerDay, extraKm, rate: s.extraKmRate }));
    // Late: only when late; an amount, or waived with a reason (11 Nov 2026). Nothing runs on its own.
    const late = minutesLate({ status: r.status, deadlineAt: r.deadlineAt });
    if (late > 0) {
      const waive = tidy(input.late?.waiveReason);
      if (input.late?.amount !== undefined && input.late.amount !== null) {
        if (!whole(input.late.amount, 1, LATE_MAX)) return { error: 'lateInvalid' } as const;
        lines.push(byCommission('late', input.late.amount, { minutes: late }));
      } else if (waive) lines.push(byCommission('late', 0, { minutes: late, waived: true }, waive));
      else return { error: 'lateMissing', lateMinutes: late } as const;
    } else if (input.late && (input.late.amount !== undefined || tidy(input.late.waiveReason))) return { error: 'notLate' } as const;
    // Same-level fuel: lower than at handover → whole litres × the saved price, 100% SNS, or waived with a reason.
    const lower = FUEL_LEVELS.indexOf(input.fuel) < FUEL_LEVELS.indexOf(h.fuel as FuelLevel);
    if (r.fuelOption === 'sameLevel' && lower) {
      const waive = tidy(input.fuelCharge?.waiveReason);
      if (input.fuelCharge?.litres !== undefined && input.fuelCharge.litres !== null) {
        if (!whole(input.fuelCharge.litres, 1, LITRES_MAX)) return { error: 'litresInvalid' } as const;
        const price = terms.fuelPricePerLitre;
        if (!price) return { error: 'noFuelPrice' } as const;
        lines.push({ kind: 'fuel', amount: input.fuelCharge.litres * price, details: { litres: input.fuelCharge.litres, price, out: h.fuel, in: input.fuel }, reason: null, allocation: 'sns', partnerShare: null });
      } else if (waive) lines.push({ kind: 'fuel', amount: 0, details: { out: h.fuel, in: input.fuel, waived: true }, reason: waive, allocation: 'sns', partnerShare: null });
      else return { error: 'fuelMissing' } as const;
    } else if (input.fuelCharge && (input.fuelCharge.litres !== undefined || tidy(input.fuelCharge.waiveReason))) return { error: 'fuelNotLower' } as const;
    // Each accessory there at handover and missing now: an amount, or 0 with a reason; one missing at handover never.
    const newlyMissing = now.filter((a, i) => out[i].present && !a.present).map((a) => a.item);
    const charges = input.accessoryCharges ?? [];
    for (const c of charges) if (!newlyMissing.includes(String(c?.item))) return { error: 'accessoryNotMissing', item: String(c?.item) } as const;
    for (const item of newlyMissing) {
      const c = charges.find((x) => x.item === item);
      if (!c) return { error: 'accessoryMissing', item } as const;
      if (!whole(c.amount, 0, ITEM_MAX)) return { error: 'amountInvalid', item } as const;
      if (c.amount === 0 && !tidy(c.reason)) return { error: 'reasonMissing', item } as const;
      lines.push(toAdmin('accessory', c.amount, { item }, c.amount === 0 ? tidy(c.reason) : null));
    }
    // Damage (staff decide the amount; on a partner car the admin decides who gets it).
    if (input.damage) {
      const what = tidy(input.damage.what);
      if (!what || !whole(input.damage.amount, 1, ITEM_MAX)) return { error: 'damageInvalid' } as const;
      lines.push(toAdmin('damage', input.damage.amount, { what }));
    }
    // Garage days: only with damage, and the car then Under repair (never a planned service, AT-63); approved by an admin.
    if (input.garageDays !== undefined && input.garageDays !== null) {
      if (!whole(input.garageDays, 1, GARAGE_DAYS_MAX)) return { error: 'garageInvalid' } as const;
      if (!input.damage) return { error: 'garageNeedsDamage' } as const;
      if (input.nextState !== 'repair') return { error: 'garageNeedsRepair' } as const;
    }
    const total = lines.reduce((n, l) => n + l.amount, 0);
    const money = await paidAndHeld(tx, rentalId);
    const unpaid = total - money.paid - money.depositHeld;
    const note = tidy(input.payLaterNote);
    if (unpaid > 0) {
      if (!me.may('allowPaymentAfterReturn')) return { error: 'payLaterNotAllowed', unpaid } as const;
      if (!note) return { error: 'payLaterNoteMissing', unpaid } as const;
    }
    await tx.insert(rentalReturn).values({ rentalId, vehicleId: seg.vehicleId, inKm: input.inKm, fuel: input.fuel, accessories: now, fuelTakenOut: input.fuelTakenOut ?? null,
      lateMinutes: late, nextState: input.nextState, nextReason: input.nextState === 'available' ? null : nextReason, payLaterNote: unpaid > 0 ? note : null, createdBy: actorId });
    const saved = await tx.insert(charge).values(lines.map((l) => ({ rentalId, ...l, createdBy: actorId }))).returning({ id: charge.id, kind: charge.kind, amount: charge.amount, allocation: charge.allocation, details: charge.details });
    await tx.update(rentalVehicleSegment).set({ inKm: input.inKm }).where(eq(rentalVehicleSegment.id, seg.id));
    await tx.update(rental).set({ status: 'returned', updatedAt: sql`now()` }).where(and(eq(rental.id, rentalId), eq(rental.status, 'active')));
    await tx.delete(vehicleHold).where(eq(vehicleHold.rentalId, rentalId));
    if (input.nextState !== 'available') await tx.insert(vehicleStatusEvent).values({ vehicleId: seg.vehicleId, status: input.nextState, reason: nextReason, createdBy: actorId });
    await closeWaiting(tx, rentalId, actorId);
    // On a partner car, each line the admin splits waits on Approvals; garage days wait for their approval.
    for (const c of saved.filter((x) => x.allocation === 'admin')) {
      await tx.insert(approvalRequest).values({ rentalId, kind: 'split', chargeId: c.id, rateWas: rate, estimateWas: total, createdBy: actorId,
        reason: c.kind === 'damage' ? String((c.details as { what?: string }).what ?? '') : String((c.details as { item?: string }).item ?? '') });
    }
    if (input.garageDays) await tx.insert(approvalRequest).values({ rentalId, kind: 'garageDays', days: input.garageDays, rateWas: rate, estimateWas: total, createdBy: actorId,
      reason: tidy(input.damage!.what) });
    const details = { inKm: input.inKm, driven, total, unpaid: Math.max(0, unpaid), nextState: input.nextState, ...(input.garageDays ? { garageDays: input.garageDays } : {}), ...(unpaid > 0 ? { payLaterNote: note } : {}) };
    await tx.insert(rentalEvent).values({ rentalId, kind: 'return', details, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.return', targetType: 'rental', targetId: rentalId,
      details: { name: r.name, number: rentalNumber(r.number), registration: r.registration, ...details } });
    return { ok: true } as const;
  });
}

export interface BillLine { id: string; kind: string; amount: number; details: Record<string, unknown>; reason: string | null; allocation: string; partnerShare: number | null; waiting: boolean; createdAt: Date }
export interface Bill { lines: BillLine[]; total: number; partnerTotal: number; paid: number; depositHeld: number; unpaid: number; returnedAt: Date | null }

/** A returned rental's bill: each line with who gets it (a line the admin splits shows the admin's decision, or waits). */
export async function rentalBill(rentalId: string, q: Q = db): Promise<Bill | null> {
  if (!UUID.test(rentalId)) return null;
  const rows = await q.select().from(charge).where(eq(charge.rentalId, rentalId)).orderBy(asc(charge.createdAt), asc(charge.id));
  const [ret] = await q.select({ at: rentalReturn.createdAt }).from(rentalReturn).where(eq(rentalReturn.rentalId, rentalId));
  if (!ret) return null;
  const adminIds = rows.filter((r) => r.allocation === 'admin').map((r) => r.id);
  const splits = adminIds.length ? await q.select({ chargeId: approvalRequest.chargeId, partnerExtra: approvalDecision.partnerExtra }).from(approvalRequest)
    .innerJoin(approvalDecision, eq(approvalDecision.requestId, approvalRequest.id))
    .where(and(eq(approvalRequest.kind, 'split'), inArray(approvalRequest.chargeId, adminIds), eq(approvalDecision.outcome, 'approved'))) : [];
  const lines: BillLine[] = rows.map((r) => {
    const s = splits.find((x) => x.chargeId === r.id);
    const share = r.allocation === 'admin' ? (s ? Number(s.partnerExtra) : null) : r.partnerShare === null ? null : Number(r.partnerShare);
    return { id: r.id, kind: r.kind, amount: Number(r.amount), details: (r.details ?? {}) as Record<string, unknown>, reason: r.reason, allocation: r.allocation,
      partnerShare: share, waiting: r.allocation === 'admin' && !s, createdAt: r.createdAt };
  });
  const total = lines.reduce((n, l) => n + l.amount, 0);
  const m = await paidAndHeld(q, rentalId);
  return { lines, total, partnerTotal: lines.reduce((n, l) => n + (l.partnerShare ?? 0), 0), paid: m.paid, depositHeld: m.depositHeld,
    unpaid: total - m.paid - m.depositHeld, returnedAt: ret.at };
}

/** The sum of a rental's bill lines (payments on a returned rental are capped by it). */
export async function billTotal(q: Q, rentalId: string): Promise<number | null> {
  const [ret] = await q.select({ id: rentalReturn.id }).from(rentalReturn).where(eq(rentalReturn.rentalId, rentalId));
  if (!ret) return null;
  const [t] = await q.select({ n: sql<string>`coalesce(sum(${charge.amount}), 0)` }).from(charge).where(eq(charge.rentalId, rentalId));
  return Number(t.n);
}

export type GarageError = 'notAllowed' | 'notFound' | 'notReturned' | 'daysInvalid' | 'reasonMissing' | 'tooLong' | 'noGarageDays' | 'sameDays' | 'splitMissing' | 'splitInvalid';

/** An admin corrects the garage days when the car is back (ST-07.2): a dated line for the difference; the first stays.
 *  On a partner car the admin gives the partner's rupees of the difference (same sign, at most the difference). */
export async function correctGarageDays(actorId: string, rentalId: string, input: { days: number; reason: string; partnerRupees?: number }): Promise<{ ok: true } | { error: GarageError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (!whole(input.days, 0, GARAGE_DAYS_MAX)) return { error: 'daysInvalid' };
  const reason = tidy(input.reason);
  if (!reason) return { error: 'reasonMissing' };
  if (reason.length > TEXT_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await actor(tx, actorId)).may('allocateDamageProceeds')) return { error: 'notAllowed' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    const [r] = await tx.select({ status: rental.status, number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    if (r.status !== 'returned') return { error: 'notReturned' } as const;
    const lines = await tx.select({ amount: charge.amount, details: charge.details }).from(charge).where(and(eq(charge.rentalId, rentalId), eq(charge.kind, 'garageDays')));
    if (!lines.length) return { error: 'noGarageDays' } as const;
    const terms = (await rentalTerms(rentalId, tx))!;
    const rate = terms.segments[0].garageDayCharge;
    const current = lines.reduce((n, l) => n + Number((l.details as { days?: number }).days ?? 0), 0);
    const diff = input.days - current;
    if (!diff) return { error: 'sameDays' } as const;
    const amount = diff * rate;
    const partner = terms.segments[0].commissionPercent !== null;
    let share: number | null = null;
    if (partner) {
      if (input.partnerRupees === undefined || input.partnerRupees === null) return { error: 'splitMissing' } as const;
      if (!Number.isSafeInteger(input.partnerRupees) || input.partnerRupees < Math.min(0, amount) || input.partnerRupees > Math.max(0, amount)) return { error: 'splitInvalid' } as const;
      share = input.partnerRupees;
    }
    await tx.insert(charge).values({ rentalId, kind: 'garageDays', amount, details: { days: diff, rate, correction: true }, reason, allocation: partner ? 'split' : 'sns', partnerShare: share, createdBy: actorId });
    await tx.insert(rentalEvent).values({ rentalId, kind: 'garageCorrected', details: { days: input.days, was: current, amount, reason }, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.garageCorrected', targetType: 'rental', targetId: rentalId,
      details: { name: r.name, number: rentalNumber(r.number), days: input.days, was: current, reason } });
    return { ok: true } as const;
  });
}
