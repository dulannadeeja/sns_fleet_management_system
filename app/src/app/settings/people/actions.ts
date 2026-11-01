'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '../../../auth/require';
import type { Role } from '../../../auth/permissions';
import { addPerson, resetPassword, setEmail, turnOff, turnOn, type PeopleError } from '../../../modules/people/people';

// Screens 15.4 and 15.6. Each action: requireOwner (system design 3.2), then one people-module change, which checks the
// owner again inside its transaction and writes the activity log (TRD › Integrity rules).

export type FormState = { error?: PeopleError; done?: boolean; values?: Record<string, string> };
const text = (form: FormData, key: string) => String(form.get(key) ?? '');

export async function addPersonAction(_: FormState, form: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const values = { name: text(form, 'name'), phone: text(form, 'phone').trim(), role: text(form, 'role'), language: text(form, 'language'), email: text(form, 'email') };
  // The module refuses any role but staff or admin from this screen.
  const result = await addPerson(owner.id, { name: values.name, phone: values.phone, password: text(form, 'password'), role: values.role as Role, language: values.language === 'en' ? 'en' : 'si', email: values.email || undefined });
  if ('error' in result) return { error: result.error, values };
  revalidatePath('/settings', 'layout');
  redirect('/settings/people');
}

export async function resetPasswordAction(personId: string, _: FormState, form: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const result = await resetPassword(owner.id, personId, text(form, 'password'));
  if ('error' in result) return { error: result.error };
  revalidatePath(`/settings/people/${personId}`);
  return { done: true };
}

export async function turnOffAction(personId: string, _: FormState, form: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const result = await turnOff(owner.id, personId, text(form, 'reason'));
  if ('error' in result) return { error: result.error, values: { reason: text(form, 'reason') } };
  revalidatePath('/settings', 'layout');
  return { done: true };
}

export async function turnOnAction(personId: string): Promise<FormState> {
  const owner = await requireOwner();
  const result = await turnOn(owner.id, personId);
  if ('error' in result) return { error: result.error };
  revalidatePath('/settings', 'layout');
  return { done: true };
}

/** 15.6: the owner sets or changes the owner's or an admin's email; it counts once a code sent to it is typed in (#28). */
export async function setEmailAction(personId: string, _: FormState, form: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const result = await setEmail(owner.id, personId, text(form, 'email'));
  if ('error' in result) return { error: result.error, values: { email: text(form, 'email') } };
  revalidatePath('/settings', 'layout');
  return { done: true };
}
