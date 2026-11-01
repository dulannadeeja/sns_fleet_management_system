'use server';
import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '../../auth/server';
import { signInProblems, type SignInProblems } from '../../auth/sign-in-check';

export type SignInState = { problems?: SignInProblems; error?: 'wrong' | 'locked'; phone?: string };

/**
 * Signs in with phone number and password (ST-01.1). What was typed is checked box by box first, the same check the
 * browser makes (system design 3.1, Proposed). A locked account says so (AT-60); a well-formed number and password that
 * do not match give one message that does not say which was wrong.
 */
export async function signInAction(_: SignInState, form: FormData): Promise<SignInState> {
  const phone = String(form.get('phone') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const problems = signInProblems(phone, password);
  if (problems.phone || problems.password) return { problems, phone };
  let needsCode = false;
  try {
    const result = await auth.api.signInPhoneNumber({ body: { phoneNumber: phone, password }, headers: await headers() });
    needsCode = 'twoFactorRedirect' in result && result.twoFactorRedirect === true;
  } catch (e) {
    if (e instanceof APIError) return { error: e.body?.code === 'ACCOUNT_LOCKED' ? 'locked' : 'wrong', phone };
    throw e;
  }
  // The owner or the admin on a new device: email the code, then ask for it (01.4; AT-61).
  if (needsCode) {
    const problem = await sendSignInCode();
    redirect(problem ? `/sign-in/code?problem=${problem}` : '/sign-in/code');
  }
  // The language can change here; refresh the root layout too, so <html lang> follows (the layout is otherwise kept).
  revalidatePath('/', 'layout');
  redirect('/');
}

/** Emails the sign-in code to the person waiting for one (the plugin's cookie, just set). Returns what went wrong. */
export async function sendSignInCode(): Promise<'tooSoon' | 'notSent' | 'expired' | null> {
  const jar = await cookies();
  const cookie = jar.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  try {
    await auth.api.sendTwoFactorOTP({ headers: new Headers({ cookie }), body: {} });
    return null;
  } catch (e) {
    if (e instanceof APIError && e.body?.code === 'CODE_TOO_SOON') return 'tooSoon';
    if (e instanceof APIError && e.body?.code === 'INVALID_TWO_FACTOR_COOKIE') return 'expired';
    return 'notSent';
  }
}
