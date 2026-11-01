'use server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { setOwnPassword, type Language } from '../../auth/first-sign-in';

export type FirstSignInState = { error?: 'signedOut' | 'tooShort' | 'notSame' };

/** Screen 01.2: the person's own password (8+ characters, typed twice) and language; then into the app (ST-01.2, AT-46). */
export async function firstSignInAction(_: FirstSignInState, form: FormData): Promise<FirstSignInState> {
  const result = await setOwnPassword(await headers(), {
    password: String(form.get('password') ?? ''),
    repeat: String(form.get('repeat') ?? ''),
    language: (form.get('language') === 'en' ? 'en' : 'si') as Language,
  });
  if ('error' in result) {
    if (result.error === 'signedOut') redirect('/sign-in');
    if (result.error === 'notNeeded') redirect('/');
    return { error: result.error };
  }
  // The language can change here; refresh the root layout too, so <html lang> follows (the layout is otherwise kept).
  revalidatePath('/', 'layout');
  redirect('/');
}
