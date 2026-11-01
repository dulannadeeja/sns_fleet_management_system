'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '../../auth/require';
import { mayDo } from '../../auth/access';
import { addCarsToPartner, addPartner, recordAgreementSigned } from '../../modules/partners/partners';

// Screens 11.3 and 11.2: requirePermission("Add or edit partners"), then the partners module, which checks again in its
// transaction and writes the activity log (PR-05). The first password is never logged or sent back.
export type PartnerFormState = { error?: string; values?: Record<string, string>; chosen?: string[] };

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
const num = (raw: string) => (/^\d{1,3}$/.test(raw.trim()) ? Number(raw.trim()) : Number.NaN);

export async function addPartnerAction(_: PartnerFormState, form: FormData): Promise<PartnerFormState> {
  const person = await requirePermission('editPartners');
  if (!(await mayDo(person, 'seePartnerEarnings'))) return { error: 'notAllowed' };
  const chosen = form.getAll('car').map(String);
  const values = { name: text(form, 'name'), nic: text(form, 'nic'), phone: text(form, 'phone').trim(), bankAccount: text(form, 'bankAccount') };
  const result = await addPartner(person.id, {
    ...values, password: text(form, 'password'),
    cars: chosen.map((carId) => ({ carId, commissionPercent: num(text(form, `commission.${carId}`)), ownerPays: form.getAll(`ownerPays.${carId}`).map(String) })),
  });
  if ('error' in result) return { error: result.error, values, chosen };
  revalidatePath('/partners');
  revalidatePath('/cars');
  redirect(`/partners/${result.id}?saved=1`);
}

export async function recordSignedAction(partnerId: string, _: PartnerFormState, form: FormData): Promise<PartnerFormState> {
  const person = await requirePermission('editPartners');
  const result = await recordAgreementSigned(person.id, partnerId, text(form, 'signedOn'));
  if ('error' in result) return { error: result.error };
  revalidatePath(`/partners/${partnerId}`);
  return {};
}

export async function addCarsAction(partnerId: string, _: PartnerFormState, form: FormData): Promise<PartnerFormState> {
  const person = await requirePermission('editPartners');
  if (!(await mayDo(person, 'seePartnerEarnings'))) return { error: 'notAllowed' };
  const chosen = form.getAll('car').map(String);
  const result = await addCarsToPartner(person.id, partnerId, chosen.map((carId) => ({
    carId, commissionPercent: num(text(form, `commission.${carId}`)), ownerPays: form.getAll(`ownerPays.${carId}`).map(String),
  })));
  if ('error' in result) return { error: result.error, chosen };
  revalidatePath('/partners');
  revalidatePath('/cars');
  redirect(`/partners/${partnerId}?added=1`);
}
