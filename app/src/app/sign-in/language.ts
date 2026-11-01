'use server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { SIGNED_OUT_LANGUAGE_COOKIE } from '../../i18n/locale';

/** The language switch on screen 01.1: before signing in, the choice lives in a cookie (PR-01, ST-01.2 "switch at any time"). */
export async function chooseSignedOutLanguage(language: string) {
  (await cookies()).set(SIGNED_OUT_LANGUAGE_COOKIE, language === 'en' ? 'en' : 'si', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true });
  revalidatePath('/', 'layout');
}
