'use server';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { EMAIL_LATER_COOKIE, signedInPerson } from '../../auth/first-sign-in';
import { confirmPendingEmail, sendEmailConfirmCode, type PeopleError } from '../../modules/people/people';

export type ConfirmState = { error?: PeopleError | 'codeMissing'; sent?: boolean };

async function me() {
  const person = await signedInPerson(await headers());
  if (!person) redirect('/sign-in');
  // Nothing opens before a first or reset password is changed (ST-01.2).
  if (person.mustChangePassword) redirect('/first-sign-in');
  return person;
}

/** Screen 01.7: email a code to the person's own new email (at most one a minute). */
export async function sendConfirmCodeAction(): Promise<ConfirmState> {
  const result = await sendEmailConfirmCode((await me()).id);
  return 'error' in result ? { error: result.error } : { sent: true };
}

/** Screen 01.7: the code makes the new email theirs (logged); sign-in codes go there from now on. */
export async function confirmEmailAction(_: ConfirmState, form: FormData): Promise<ConfirmState> {
  const code = String(form.get('code') ?? '').replace(/\D/g, '');
  if (code.length !== 6) return { error: 'codeMissing' };
  const result = await confirmPendingEmail((await me()).id, code);
  if ('error' in result) return { error: result.error };
  revalidatePath('/', 'layout');
  redirect('/');
}

/** "Later": codes keep going to the old email; asked again in the next browser session. */
export async function confirmLaterAction(): Promise<void> {
  const person = await me();
  (await cookies()).set(EMAIL_LATER_COOKIE, person.id, { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  redirect('/');
}
