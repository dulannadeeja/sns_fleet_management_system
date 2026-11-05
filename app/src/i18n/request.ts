import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { signedInPerson } from '../auth/first-sign-in';
import en from './en.json';
import si from './si.json';
import { SIGNED_OUT_LANGUAGE_COOKIE, pickLocale } from './locale';

// Each person's saved language; before signing in, the sign-in page's choice; else Sinhala (PR-01).
export default getRequestConfig(async () => {
  const person = await signedInPerson(await headers()).catch(() => null);
  const locale = pickLocale(person?.language, (await cookies()).get(SIGNED_OUT_LANGUAGE_COOKIE)?.value);
  return { locale, messages: locale === 'en' ? en : si };
});
