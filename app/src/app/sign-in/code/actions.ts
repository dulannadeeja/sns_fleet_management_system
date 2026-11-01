'use server';
import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '../../../auth/server';
import { sendSignInCode } from '../actions';

export type CodeState = { error?: 'codeMissing' | 'codeWrong' | 'codeExpired' | 'codeTooMany' | 'locked' | 'tooSoon' | 'notSent'; sent?: boolean };

/** Screen 01.4: the emailed code finishes sign-in and remembers this device for 30 days (AT-61). */
export async function checkCodeAction(_: CodeState, form: FormData): Promise<CodeState> {
  const code = String(form.get('code') ?? '').replace(/\D/g, '');
  if (code.length !== 6) return { error: 'codeMissing' };
  try {
    await auth.api.verifyTwoFactorOTP({ body: { code, trustDevice: true }, headers: await headers() });
  } catch (e) {
    if (!(e instanceof APIError)) throw e;
    const c = e.body?.code;
    if (c === 'INVALID_TWO_FACTOR_COOKIE') redirect('/sign-in');
    if (c === 'ACCOUNT_LOCKED') return { error: 'locked' };
    if (c === 'OTP_HAS_EXPIRED') return { error: 'codeExpired' };
    if (c === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE') return { error: 'codeTooMany' };
    return { error: 'codeWrong' };
  }
  revalidatePath('/', 'layout');
  redirect('/');
}

/** "Send a new code": at most one a minute. */
export async function resendCodeAction(): Promise<CodeState> {
  const problem = await sendSignInCode();
  if (problem === 'expired') redirect('/sign-in');
  return problem ? { error: problem } : { sent: true };
}
