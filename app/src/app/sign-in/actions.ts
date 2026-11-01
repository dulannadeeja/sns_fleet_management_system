'use server';
import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
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
  try {
    await auth.api.signInPhoneNumber({ body: { phoneNumber: phone, password }, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError) return { error: e.body?.code === 'ACCOUNT_LOCKED' ? 'locked' : 'wrong', phone };
    throw e;
  }
  // The language can change here; refresh the root layout too, so <html lang> follows (the layout is otherwise kept).
  revalidatePath('/', 'layout');
  redirect('/');
}
