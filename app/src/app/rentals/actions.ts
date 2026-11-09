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
