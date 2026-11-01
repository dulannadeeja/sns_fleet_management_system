'use server';
import { APIError } from 'better-auth/api';
import { redirect } from 'next/navigation';
import { auth, MIN_PASSWORD } from '../../auth/server';

export type ResetState = { error?: 'tooShort' | 'notSame' | 'linkOld' };

/** Screen 01.6: a new password from the emailed link (once, 1 hour); every session ends. */
export async function resetPasswordAction(token: string, _: ResetState, form: FormData): Promise<ResetState> {
  const password = String(form.get('password') ?? '');
  if (password.length < MIN_PASSWORD) return { error: 'tooShort' };
  if (password !== String(form.get('repeat') ?? '')) return { error: 'notSame' };
  try {
    await auth.api.resetPassword({ body: { token, newPassword: password } });
  } catch (e) {
    if (e instanceof APIError) return { error: 'linkOld' };
    throw e;
  }
  redirect('/sign-in?reset=done');
}
