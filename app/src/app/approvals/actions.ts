'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '../../auth/require';
import { askForPrice, decide, withdraw, type Kind } from '../../modules/approvals/approvals';

// Asking for a different price (05.7) and deciding it (10.2 to 10.4), #56. Each action checks the page's permission
// here; the approvals module checks everything again under the rental's lock and writes the activity log.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const whole = (v: FormDataEntryValue | null) => { const s = String(v ?? '').replace(/,/g, '').trim(); return /^\d{1,9}$/.test(s) ? Number(s) : NaN; };
export type FormState = { error?: string; values?: Record<string, string> };

export async function askAction(rentalId: string, _: FormState, form: FormData): Promise<FormState> {
  const person = await requirePermission('customerAccess');
  const values = { kind: String(form.get('kind') ?? ''), amount: String(form.get('amount') ?? ''), reason: String(form.get('reason') ?? '') };
  if (!UUID.test(rentalId)) return { error: 'notFound', values };
  const r = await askForPrice(person.id, rentalId, { kind: values.kind as Kind, amount: whole(values.amount), reason: values.reason });
  if ('error' in r) return { error: r.error, values };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?asked=1`);
}

export async function withdrawAction(rentalId: string, requestId: string): Promise<FormState> {
  const person = await requirePermission('customerAccess');
  const r = await withdraw(person.id, requestId);
  if ('error' in r) return { error: r.error };
  revalidatePath(`/rentals/${rentalId}`);
  redirect(`/rentals/${rentalId}?withdrawn=1`);
}

export async function decideAction(requestId: string, approve: boolean, _: FormState, form: FormData): Promise<FormState> {
  const person = await requirePermission('changePriceOrDiscount');
  const values = { note: String(form.get('note') ?? ''), partnerExtra: String(form.get('partnerExtra') ?? ''), splitReason: String(form.get('splitReason') ?? '') };
  const split = values.partnerExtra.trim() ? whole(values.partnerExtra) : undefined;
  const r = await decide(person.id, requestId, { approve, note: values.note, ...(split !== undefined ? { partnerExtra: split } : {}), splitReason: values.splitReason });
  if ('error' in r) return { error: r.error, values };
  revalidatePath('/approvals');
  redirect(`/approvals?done=${approve ? 'approved' : 'rejected'}`);
}
