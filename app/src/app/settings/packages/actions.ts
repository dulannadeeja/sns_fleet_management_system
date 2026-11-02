'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { addPackage, changeDefaults, changePackage, DEFAULT_FIELDS, PACKAGE_FIELDS, readDefaults, type Defaults, type Rates } from '../../../modules/cars/packages';

// Screens 04.6 Starting packages and its forms (ST-04.4): requirePermission("Add or edit cars and packages"), then the
// packages module, which checks again in its transaction (the commission default also needs "Add or edit partners")
// and writes the activity log.
export type PackageFormState = { error?: string; fields?: string[]; values?: Record<string, string> };

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
// Digits only; anything else becomes NaN and is refused by the module as "invalid".
const num = (raw: string) => (/^\d{1,9}$/.test(raw.trim()) ? Number(raw.trim()) : Number.NaN);
const rates = (form: FormData, prefix = ''): Rates => Object.fromEntries(PACKAGE_FIELDS.map((f) => [f, num(text(form, `${prefix}${f}`))])) as Rates;
const values = (form: FormData) => Object.fromEntries([...form.entries()].filter(([k]) => !k.startsWith('$')).map(([k, v]) => [k, String(v)]));
const done = () => { revalidatePath('/settings/packages'); revalidatePath('/cars/new'); redirect('/settings/packages?saved=1'); };

export async function addPackageAction(_: PackageFormState, form: FormData): Promise<PackageFormState> {
  const person = await requirePermission('editCarsAndPackages');
  const result = await addPackage(person.id, { name: text(form, 'name'), models: text(form, 'models').split(','), ...rates(form) });
  if ('error' in result) return { error: result.error, fields: 'fields' in result ? result.fields : undefined, values: values(form) };
  done();
  return {};
}

export async function changePackageAction(id: string, _: PackageFormState, form: FormData): Promise<PackageFormState> {
  const person = await requirePermission('editCarsAndPackages');
  const result = await changePackage(person.id, id,
    { name: text(form, 'name'), addModels: text(form, 'addModel').split(','), ...rates(form) },
    { name: text(form, 'was.name'), ...rates(form, 'was.') });
  if ('error' in result) return { error: result.error, fields: 'fields' in result ? result.fields : undefined, values: values(form) };
  done();
  return {};
}

export async function changeDefaultsAction(_: PackageFormState, form: FormData): Promise<PackageFormState> {
  const person = await requirePermission('editCarsAndPackages');
  // The commission only where the form showed it as changeable; otherwise it stays as the form showed it.
  const commissionShown = (await mayDo(person, 'editPartners')) && (await mayDo(person, 'seePartnerEarnings'));
  const now = await readDefaults();
  const read = (prefix: string): Defaults => Object.fromEntries(DEFAULT_FIELDS.map((f) =>
    [f, f === 'commissionPercent' && !commissionShown ? now.commissionPercent : num(text(form, `${prefix}${f}`))])) as Defaults;
  const was = read('was.');
  const typed = read('');
  if (!commissionShown) { typed.commissionPercent = now.commissionPercent; was.commissionPercent = now.commissionPercent; }
  const result = await changeDefaults(person.id, typed, was);
  if ('error' in result) return { error: result.error, fields: 'fields' in result ? result.fields : undefined, values: values(form) };
  done();
  return {};
}
