'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '../../../auth/require';
import { changeGroup, isGroup, keysOf, type FieldError } from '../../../modules/settings/settings';

// Screen 15.7: requireOwner (system design 3.2 "Owner settings"), then the settings module, which checks the owner again
// inside its transaction and writes the activity log with the old and new values (TRD › Sign-in and permissions).
export type ChangeState = { errors?: Record<string, FieldError | 'notAllowed' | 'failed'>; values?: Record<string, string> };

export async function changeSettingsAction(group: string, _: ChangeState, form: FormData): Promise<ChangeState> {
  const owner = await requireOwner();
  if (!isGroup(group)) return { errors: { form: 'failed' } };
  const values = Object.fromEntries(keysOf(group).map((k) => [k, String(form.get(k) ?? '')]));
  const result = await changeGroup(owner.id, group, values);
  if ('error' in result) return result.error === 'invalid' ? { errors: result.errors, values } : { errors: { form: result.error }, values };
  revalidatePath('/settings', 'layout');
  redirect('/settings/business-rules?saved=1');
}
