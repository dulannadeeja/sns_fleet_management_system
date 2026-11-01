'use server';
import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '../../auth/server';

export type SignInState = { error?: 'missing' | 'wrong' | 'locked'; phone?: string };

/** Signs in with phone number and password (ST-01.1). A locked account says so (AT-60); any other failure says "wrong". */
export async function signInAction(_: SignInState, form: FormData): Promise<SignInState> {
  const phone = String(form.get('phone') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!phone || !password) return { error: 'missing', phone };
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
