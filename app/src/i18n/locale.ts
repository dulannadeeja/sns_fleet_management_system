// Which language a page speaks: the signed-in person's saved language; before signing in, the choice made on the
// sign-in page (a cookie); otherwise Sinhala (PR-01).
export type Locale = 'si' | 'en';
export const SIGNED_OUT_LANGUAGE_COOKIE = 'sns-language';

export function pickLocale(personLanguage: string | null | undefined, cookieLanguage: string | undefined): Locale {
  const chosen = personLanguage ?? cookieLanguage;
  return chosen === 'en' ? 'en' : 'si';
}
