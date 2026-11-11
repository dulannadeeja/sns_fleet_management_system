'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '../../auth/require';
import { createRental, rentalTerms } from '../../modules/rentals/rentals';
import { setRentalTerms, type Fuel, type RentPaid } from '../../modules/rentals/terms';
import { printAgreement, uploadSigned } from '../../modules/rentals/agreements';
import { addReference, addReferenceCopy, REF_COPY_KINDS } from '../../modules/customers/references';
import { MAX_COPY_BYTES } from '../../storage/kinds';
import { paymentNumber, recordPayment, type Method, type PaymentFor } from '../../modules/money/payments';
import { addHandoverPhoto, freeCar, handOver, type FuelLevel } from '../../modules/rentals/handover';
import { correctGarageDays, receiveCar, type NextState } from '../../modules/rentals/returns';
import { settleDeposit, type RefundMethod } from '../../modules/money/deposits';
import { askCorrection, type Fix } from '../../modules/money/corrections';
import { payBack } from '../../modules/money/writeoffs';

// New rental (#51): requirePermission("Customer access"), then the rentals module, which checks everything again in one
// transaction and writes the activity log. The pickup is the moment of the save (05.3 shows "now").
export type SaveState = { error?: string; days?: string };

export async function saveRentalAction(customerId: string, vehicleId: string, goAheadId: string | null, _: SaveState, form: FormData): Promise<SaveState> {
  const person = await requirePermission('customerAccess');
  const daysText = String(form.get('days') ?? '').trim();
  const days = /^\d{1,3}$/.test(daysText) ? Number(daysText) : NaN;
  const shown = new Date(String(form.get('shownDeadline') ?? ''));
  const result = await createRental(person.id, { customerId, vehicleId, pickupAt: new Date(), days, ...(goAheadId ? { goAheadId } : {}),
    shownDeadline: Number.isNaN(shown.getTime()) ? new Date(0) : shown });
  if ('error' in result) return { error: result.error, days: daysText };
  revalidatePath('/rentals/new/car');
  redirect(`/rentals/${result.id}/terms?saved=1`);
}

// Step 4 (05.4) and the reference person (05.6), #54. Each action checks Customer access here; the modules check
// everything again in one transaction (and "Set or waive a deposit" for step 4) and write the activity log.
export type TermsState = { error?: string; values?: Record<string, string> };

export async function saveTermsAction(rentalId: string, _: TermsState, form: FormData): Promise<TermsState> {
  const person = await requirePermission('customerAccess');
  const v = (k: string) => String(form.get(k) ?? '').trim();
  const values = { deposit: v('deposit'), waive: v('waive'), waiveReason: v('waiveReason'), rentPaid: v('rentPaid'), fuel: v('fuel'), referenceRequired: v('referenceRequired'), referencePersonId: v('referencePersonId') };
  const waived = values.waive === '1';
  const deposit = waived ? null : /^\d{1,7}$/.test(values.deposit.replace(/,/g, '')) ? Number(values.deposit.replace(/,/g, '')) : NaN;
  const result = await setRentalTerms(person.id, rentalId, {
    deposit, waiveReason: values.waiveReason, rentPaid: values.rentPaid as RentPaid, fuel: values.fuel as Fuel,
    referenceRequired: values.referenceRequired === '1', referencePersonId: values.referencePersonId || null,
  });
  if ('error' in result) return { error: result.error, values };
  revalidatePath(`/rentals/${rentalId}`);
  // "Save and add a reference person": what was typed is saved first, so nothing is lost (#54 review).
  if (String(form.get('next') ?? '') === 'reference') redirect(`/rentals/${rentalId}/reference`);
  redirect(`/rentals/${rentalId}/review?terms=1`);
}

export type RefState = { error?: string; kind?: string; values?: Record<string, string> };

export async function addReferenceAction(rentalId: string, _: RefState, form: FormData): Promise<RefState> {
  const person = await requirePermission('customerAccess');
  // The customer is the rental's own, read on the server (#54 review).
  const rentalNow = await rentalTerms(rentalId);
  if (!rentalNow) return { error: 'notFound' };
  const customerId = rentalNow.customerId;
  const v = (k: string) => String(form.get(k) ?? '');
  const values = { name: v('name'), nic: v('nic'), phone: v('phone'), relationship: v('relationship') };
  const copies: { kind: string; bytes: Uint8Array }[] = [];
  for (const kind of REF_COPY_KINDS) {
    const f = form.get(kind);
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_COPY_BYTES) return { error: 'fileTooBig', kind, values };
    copies.push({ kind, bytes: new Uint8Array(await f.arrayBuffer()) });
  }
  const result = await addReference(person.id, customerId, { ...values, relationship: values.relationship || null }, copies);
  if ('error' in result) return { error: result.error, kind: result.kind, values };
  const id = 'ok' in result ? result.id : result.existing;
  // A NIC already saved for this customer: the photos chosen now are added to that person (#54 review).
  if ('existing' in result) {
    for (const c of copies) {
      const added = await addReferenceCopy(person.id, id, c.kind, c.bytes);
      if ('error' in added) return { error: added.error, kind: c.kind, values };
    }
  }
  redirect(`/rentals/${rentalId}/terms?ref=${id}${'existing' in result ? '&existing=1' : ''}`);
}

export async function addRefCopyAction(rentalId: string, referenceId: string, kind: string, _: RefState, form: FormData): Promise<RefState> {
  const person = await requirePermission('customerAccess');
  const f = form.get('file');
  if (!(f instanceof File) || f.size === 0) return { error: 'fileType', kind };
  if (f.size > MAX_COPY_BYTES) return { error: 'fileTooBig', kind };
  const result = await addReferenceCopy(person.id, referenceId, kind, new Uint8Array(await f.arrayBuffer()));
  if ('error' in result) return { error: result.error, kind };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?copy=1`);
}

// 05.5 Review and print, and the signed copy (#55). The module checks again and writes the activity log.
export type PrintState = { error?: string; language?: string };

export async function printAgreementAction(rentalId: string, _: PrintState, form: FormData): Promise<PrintState> {
  const person = await requirePermission('customerAccess');
  const language = String(form.get('language') ?? '');
  const result = await printAgreement(person.id, rentalId, language);
  if ('error' in result) return { error: result.error, language };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}/agreement/${result.id}`);
}

export async function uploadSignedAction(rentalId: string, _: PrintState, form: FormData): Promise<PrintState> {
  const person = await requirePermission('customerAccess');
  const f = form.get('file');
  if (!(f instanceof File) || f.size === 0) return { error: 'fileType' };
  if (f.size > MAX_COPY_BYTES) return { error: 'fileTooBig' };
  const result = await uploadSigned(person.id, rentalId, new Uint8Array(await f.arrayBuffer()));
  if ('error' in result) return { error: result.error };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?signed=1`);
}

// Record a payment (09.3, 09.4; #53). The form sends its choices as one JSON field (kept in React state); the money
// module checks everything again in one transaction and writes the activity log.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type PayState = { error?: string; rentalId?: string; same?: { number: string; method: string; amount: number; at: string }[]; payload?: string };

export async function recordPaymentAction(customerId: string, rentalId: string, key: string, _: PayState, form: FormData): Promise<PayState> {
  const person = await requirePermission('customerAccess');
  const payload = String(form.get('payload') ?? '');
  if (!UUID.test(rentalId) || payload.length > 10_000) return { error: 'failed' };
  let input: { for?: unknown; rentals?: unknown; parts?: unknown; reason?: unknown };
  try { input = JSON.parse(payload); } catch { return { error: 'failed', payload }; }
  if (!input || typeof input !== 'object') return { error: 'failed', payload };
  const num = (v: unknown) => { const s = String(v ?? '').replace(/,/g, '').trim(); return /^\d{1,9}$/.test(s) ? Number(s) : NaN; };
  const rentals = (Array.isArray(input.rentals) ? input.rentals : []).map((x: { rentalId?: unknown; amount?: unknown }) => ({ rentalId: String(x?.rentalId ?? ''), amount: num(x?.amount) }))
    .filter((x) => String(x.amount) !== '0');
  const parts = (Array.isArray(input.parts) ? input.parts : []).map((x: { method?: unknown; amount?: unknown; reference?: unknown }) =>
    ({ method: String(x?.method ?? '') as Method, amount: num(x?.amount), reference: String(x?.reference ?? '') }));
  const result = await recordPayment(person.id, { key, customerId, for: String(input.for ?? '') as PaymentFor, rentals, parts, sameReferenceReason: String(input.reason ?? '') });
  if ('error' in result) {
    return { error: result.error, rentalId: result.rentalId, payload,
      same: result.same?.map((s) => ({ number: paymentNumber(s.number), method: s.method, amount: s.amount, at: s.createdAt.toISOString() })) };
  }
  for (const r of rentals) revalidatePath(`/rentals/${r.rentalId}`);
  redirect(`/rentals/${rentalId}?paid=${result.numbers.map(paymentNumber).join(',')}`);
}

// Hand over the car (06.4; #57). The form sends its choices as one JSON field (kept in React state); the handover
// module checks everything again under the car's and the rental's locks and writes the activity log.
export type HandoverState = { error?: string; lastKm?: number; missing?: string[]; payload?: string };

export async function handOverAction(rentalId: string, _: HandoverState, form: FormData): Promise<HandoverState> {
  const person = await requirePermission('customerAccess');
  const payload = String(form.get('payload') ?? '');
  if (!UUID.test(rentalId) || payload.length > 10_000) return { error: 'failed' };
  let input: { outKm?: unknown; fuel?: unknown; accessories?: unknown; checked?: unknown; papersReason?: unknown };
  try { input = JSON.parse(payload); } catch { return { error: 'failed', payload }; }
  if (!input || typeof input !== 'object') return { error: 'failed', payload };
  const km = String(input.outKm ?? '').replace(/,/g, '').trim();
  const result = await handOver(person.id, rentalId, {
    outKm: /^\d{1,7}$/.test(km) ? Number(km) : NaN, fuel: String(input.fuel ?? '') as FuelLevel,
    accessories: Array.isArray(input.accessories) ? input.accessories : [], checked: input.checked === true, papersReason: String(input.papersReason ?? ''),
  });
  if ('error' in result) return { error: result.error, lastKm: result.lastKm, missing: result.missing, payload };
  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath('/rentals/new/car');
  redirect(`/rentals/${rentalId}?handedOver=1`);
}

export async function addHandoverPhotoAction(rentalId: string, _: PrintState, form: FormData): Promise<PrintState> {
  const person = await requirePermission('customerAccess');
  const f = form.get('file');
  if (!(f instanceof File) || f.size === 0) return { error: 'fileMissing' };
  if (f.size > MAX_COPY_BYTES) return { error: 'fileTooBig' };
  const result = await addHandoverPhoto(person.id, rentalId, new Uint8Array(await f.arrayBuffer()));
  if ('error' in result) return { error: result.error };
  revalidatePath(`/rentals/${rentalId}/handover`);
  redirect(`/rentals/${rentalId}/handover?photo=1`);
}

// Free the car of a rental not collected (#57; 10 Nov 2026): the module checks the 2 hours, that nothing was paid and
// the reason, under the car's and the rental's locks.
export type FreeState = { error?: string; reason?: string };

export async function freeCarAction(rentalId: string, _: FreeState, form: FormData): Promise<FreeState> {
  const person = await requirePermission('customerAccess');
  const reason = String(form.get('reason') ?? '');
  const result = await freeCar(person.id, rentalId, reason);
  if ('error' in result) return { error: result.error, reason };
  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath('/rentals/new/car');
  redirect(`/rentals/${rentalId}?freed=1`);
}

// Receive the car (07.1, 07.2; #63). The form sends its choices as one JSON field (kept in React state); the returns
// module checks everything again under the car's and the rental's locks and writes the activity log.
export type ReturnState = { error?: string; payload?: string; outKm?: number; lateMinutes?: number; item?: string; unpaid?: number };

export async function receiveCarAction(rentalId: string, _: ReturnState, form: FormData): Promise<ReturnState> {
  const person = await requirePermission('customerAccess');
  const payload = String(form.get('payload') ?? '');
  if (!UUID.test(rentalId) || payload.length > 20_000) return { error: 'failed' };
  let input: Record<string, unknown>;
  try { input = JSON.parse(payload); } catch { return { error: 'failed', payload }; }
  if (!input || typeof input !== 'object') return { error: 'failed', payload };
  const n = (v: unknown) => { const s = String(v ?? '').replace(/,/g, '').trim(); return s === '' ? undefined : /^\d{1,9}$/.test(s) ? Number(s) : NaN; };
  const o = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
  const late = o(input.late); const fuelCharge = o(input.fuelCharge); const damage = o(input.damage);
  const result = await receiveCar(person.id, rentalId, {
    inKm: n(input.inKm) ?? NaN, fuel: String(input.fuel ?? '') as FuelLevel, checked: input.checked === true,
    accessories: Array.isArray(input.accessories) ? input.accessories : [], fuelTakenOut: n(input.fuelTakenOut) ?? null,
    ...(input.late ? { late: late.waive === true ? { waiveReason: String(late.reason ?? '') } : { amount: n(late.amount) } } : {}),
    ...(input.fuelCharge ? { fuelCharge: fuelCharge.waive === true ? { waiveReason: String(fuelCharge.reason ?? '') } : { litres: n(fuelCharge.litres) } } : {}),
    accessoryCharges: Array.isArray(input.accessoryCharges) ? (input.accessoryCharges as Record<string, unknown>[]).map((c) => ({ item: String(c?.item ?? ''), amount: n(c?.amount) ?? NaN, reason: String(c?.reason ?? '') })) : [],
    ...(input.damage ? { damage: { what: String(damage.what ?? ''), amount: n(damage.amount) ?? NaN } } : {}),
    ...(n(input.garageDays) !== undefined ? { garageDays: n(input.garageDays) } : {}),
    nextState: String(input.nextState ?? '') as NextState, nextReason: String(input.nextReason ?? ''), payLaterNote: String(input.payLaterNote ?? ''),
  });
  if ('error' in result) return { ...result, payload };
  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath('/rentals');
  redirect(`/rentals/${rentalId}?returned=1`);
}

export type GarageState = { error?: string; values?: Record<string, string> };

export async function correctGarageAction(rentalId: string, _: GarageState, form: FormData): Promise<GarageState> {
  const person = await requirePermission('allocateDamageProceeds');
  const values = { days: String(form.get('days') ?? ''), reason: String(form.get('reason') ?? ''), partnerRupees: String(form.get('partnerRupees') ?? '') };
  const num = (s: string) => (/^-?\d{1,9}$/.test(s.replace(/,/g, '').trim()) ? Number(s.replace(/,/g, '').trim()) : NaN);
  const r = await correctGarageDays(person.id, rentalId, { days: num(values.days), reason: values.reason, ...(values.partnerRupees.trim() ? { partnerRupees: num(values.partnerRupees) } : {}) });
  if ('error' in r) return { error: r.error, values };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?garage=1`);
}

// Use the deposit and refund (07.3; #64). The form sends its choices and the amounts it showed as one JSON field; the
// deposits module works the plan out again under the customer's and the rental's locks and writes the activity log.
export type DepositState = { error?: string; payload?: string };

export async function settleDepositAction(rentalId: string, _: DepositState, form: FormData): Promise<DepositState> {
  const person = await requirePermission('customerAccess');
  const payload = String(form.get('payload') ?? '');
  if (!UUID.test(rentalId) || payload.length > 5_000) return { error: 'failed' };
  let input: Record<string, unknown>;
  try { input = JSON.parse(payload); } catch { return { error: 'failed', payload }; }
  if (!input || typeof input !== 'object') return { error: 'failed', payload };
  const shown = (input.shown && typeof input.shown === 'object' ? input.shown : {}) as Record<string, unknown>;
  const n = (v: unknown) => (Number.isSafeInteger(v) ? (v as number) : NaN);
  const method = String(input.method ?? '');
  const result = await settleDeposit(person.id, rentalId, {
    olderAgreed: input.agreed === true, agreementNote: String(input.note ?? ''),
    ...(method ? { refund: { method: method as RefundMethod, reference: String(input.reference ?? '') } } : {}),
    shown: { held: n(shown.held), here: n(shown.here), older: n(shown.older), refund: n(shown.refund) },
  });
  if ('error' in result) return { error: result.error, payload };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?deposit=1`);
}

// Ask for a payment correction (09.5; #65). The form sends its choices as one JSON field; the corrections module checks
// everything under the customer's and the rental's locks and writes the activity log.
export type CorrectState = { error?: string };

export async function askCorrectionAction(rentalId: string, paymentId: string, _: CorrectState, form: FormData): Promise<CorrectState> {
  const person = await requirePermission('customerAccess');
  const payload = String(form.get('payload') ?? '');
  if (!UUID.test(rentalId) || !UUID.test(paymentId) || payload.length > 5_000) return { error: 'failed' };
  let input: Record<string, unknown>;
  try { input = JSON.parse(payload); } catch { return { error: 'failed' }; }
  if (!input || typeof input !== 'object') return { error: 'failed' };
  const raw = String(input.amount ?? '').replace(/,/g, '').trim();
  const fix = String(input.fix ?? '') as Fix;
  const r = await askCorrection(person.id, rentalId, paymentId, {
    fix, reason: String(input.reason ?? ''),
    ...(fix === 'amount' ? { newAmount: /^\d{1,9}$/.test(raw) ? Number(raw) : NaN } : {}),
    ...(fix === 'method' ? { newMethod: String(input.method ?? '') as Method } : {}),
    ...(fix === 'method' || fix === 'reference' ? { newReference: String(input.reference ?? '') } : {}),
    ...(fix === 'rental' ? { toRentalId: String(input.toRental ?? '') } : {}),
  });
  if ('error' in r) return { error: r.error };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?correction=1`);
}

// Pay back money above a lowered bill (#65): cash or bank with its reference; checked again under the locks.
export type PayBackState = { error?: string; values?: Record<string, string> };

export async function payBackAction(rentalId: string, _: PayBackState, form: FormData): Promise<PayBackState> {
  const person = await requirePermission('refundsAndExpenses');
  const values = { amount: String(form.get('amount') ?? ''), method: String(form.get('method') ?? ''), reference: String(form.get('reference') ?? '') };
  const raw = values.amount.replace(/,/g, '').trim();
  const r = await payBack(person.id, rentalId, { amount: /^\d{1,9}$/.test(raw) ? Number(raw) : NaN, method: values.method as 'cash' | 'bank', reference: values.reference });
  if ('error' in r) return { error: r.error, values };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?paidBack=1`);
}
