'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '../../auth/require';
import { mayDo } from '../../auth/access';
import { addCar, editCar, getCar, isCost, TERM_FIELDS, type Cost, type Terms } from '../../modules/cars/cars';

// Screens 04.4 and 04.8: requirePermission("Add or edit cars and packages"), then the cars module, which checks again in
// its transaction (the commission also needs "Add or edit partners") and writes the activity log (PR-05).
export type CarFormState = { error?: string; fields?: string[]; values?: Record<string, string> };

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
// Digits only; anything else becomes NaN and is refused by the module as "invalid".
const num = (raw: string) => (/^\d{1,9}$/.test(raw.trim()) ? Number(raw.trim()) : Number.NaN);

function typedTerms(form: FormData, base: Terms, partnerTermsShown: boolean): Terms {
  const t: Terms = { ...base };
  for (const f of TERM_FIELDS) {
    if (f === 'commissionPercent' && (!partnerTermsShown || base.commissionPercent === null)) continue;
    if (form.has(f)) (t as unknown as Record<string, number | null>)[f] = num(text(form, f));
  }
  // The costs the owner pays: ticked boxes, only where the form showed them (partner cars, partner permissions).
  if (partnerTermsShown && form.has('ownerPaysShown')) t.ownerPays = form.getAll('ownerPays').map(String).filter(isCost) as Cost[];
  return t;
}
function wasTerms(form: FormData, base: Terms): Terms {
  const t: Terms = { ...base };
  for (const f of TERM_FIELDS) if (form.has(`was.${f}`)) (t as unknown as Record<string, number | null>)[f] = text(form, `was.${f}`) === '' ? null : num(text(form, `was.${f}`));
  if (form.has('was.ownerPays')) t.ownerPays = text(form, 'was.ownerPays').split(',').filter(isCost) as Cost[];
  return t;
}

export async function addCarAction(_: CarFormState, form: FormData): Promise<CarFormState> {
  const person = await requirePermission('editCarsAndPackages');
  const values = Object.fromEntries([...form.entries()].filter(([k]) => !k.startsWith('$')).map(([k, v]) => [k, String(v)]));
  // The package as typed, saved with the car in one transaction; the commission only if the person may change it.
  const commissionShown = (await mayDo(person, 'editPartners')) && (await mayDo(person, 'seePartnerEarnings'));
  const typed: Partial<Terms> = Object.fromEntries(TERM_FIELDS.filter((f) => form.has(f) && (f !== 'commissionPercent' || commissionShown)).map((f) => [f, num(text(form, f))]));
  if (commissionShown && form.has('ownerPaysShown')) typed.ownerPays = form.getAll('ownerPays').map(String).filter(isCost) as Cost[];
  const added = await addCar(person.id, { registration: text(form, 'registration'), model: text(form, 'model'), ownership: text(form, 'ownership') }, typed);
  if ('error' in added) return { error: added.error, fields: 'fields' in added ? added.fields : undefined, values };
  revalidatePath('/cars');
  redirect(`/cars/${added.id}?saved=1`);
}

export async function editCarAction(carId: string, _: CarFormState, form: FormData): Promise<CarFormState> {
  const person = await requirePermission('editCarsAndPackages');
  const car = await getCar(carId);
  if (!car) return { error: 'notFound' };
  const commissionShown = (await mayDo(person, 'editPartners')) && (await mayDo(person, 'seePartnerEarnings'));
  const was = wasTerms(form, car.terms);
  const typed = typedTerms(form, was, commissionShown);
  const values = Object.fromEntries(TERM_FIELDS.filter((f) => form.has(f)).map((f) => [f, text(form, f)]));
  const result = await editCar(person.id, carId, typed, was);
  if ('error' in result) return { error: result.error, fields: 'fields' in result ? result.fields : undefined, values };
  revalidatePath('/cars');
  revalidatePath(`/cars/${carId}`);
  redirect(`/cars/${carId}?saved=1`);
}
