import { and, eq, ne } from 'drizzle-orm';
import { db } from '../db/client';
import { account, session, user } from '../db/schema';
import { auth, MIN_PASSWORD, type Session } from './server';

// ST-01.2 First sign-in: a first (or reset) password is replaced before anything else; the person picks their language.
export type Language = 'si' | 'en';
export type SignedInPerson = Session['user'];

/** The signed-in person for these request headers, or null. */
export async function signedInPerson(headers: Headers): Promise<SignedInPerson | null> {
  return (await signedInSession(headers))?.user ?? null;
}

/** The session for these headers; a turned-off account has none, even if a session row were left (AT-47). */
async function signedInSession(headers: Headers): Promise<Session | null> {
  const found = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  return found && !found.user.disabledAt ? found : null;
}

export const EMAIL_LATER_COOKIE = 'sns-email-later';

/** Whether these request headers carry "confirm my new email later" for this person (01.7, for this browser session). */
export function confirmEmailLater(headers: Headers, personId: string): boolean {
  return (headers.get('cookie') ?? '').split(/;\s*/).includes(`${EMAIL_LATER_COOKIE}=${personId}`);
}

/** Where a person must go before anything else: sign-in, first sign-in, confirm a new email (#28), or nowhere (null). */
export function nextStep(
  person: Pick<SignedInPerson, 'mustChangePassword'> & { emailVerified?: boolean; pendingEmail?: string | null } | null,
  emailLater = false,
): '/sign-in' | '/first-sign-in' | '/confirm-email' | null {
  if (!person) return '/sign-in';
  if (person.mustChangePassword) return '/first-sign-in';
  if (person.pendingEmail && person.emailVerified && !emailLater) return '/confirm-email';
  return null;
}

export type SetOwnPasswordResult = { ok: true } | { error: 'signedOut' | 'notNeeded' | 'tooShort' | 'notSame' };

/**
 * Replaces the first or reset password with the person's own, saves their language and lets them in (ST-01.2, AT-46).
 * Only while the account still has a first or reset password: changing an own password would need the current one.
 * One transaction: the password, the flag and the language, and every other session of the person is ended.
 */
export async function setOwnPassword(headers: Headers, input: { password: string; repeat: string; language: Language }): Promise<SetOwnPasswordResult> {
  const current = await signedInSession(headers);
  if (!current) return { error: 'signedOut' };
  if (!current.user.mustChangePassword) return { error: 'notNeeded' };
  if (input.password.length < MIN_PASSWORD) return { error: 'tooShort' };
  if (input.password !== input.repeat) return { error: 'notSame' };
  const hash = await (await auth.$context).password.hash(input.password);
  const id = current.user.id;
  // The flag is cleared first and only while still set, so two submissions at the same moment cannot both change it.
  const done = await db.transaction(async (tx) => {
    const cleared = await tx.update(user).set({ mustChangePassword: false, language: input.language === 'en' ? 'en' : 'si', updatedAt: new Date() })
      .where(and(eq(user.id, id), eq(user.mustChangePassword, true))).returning({ id: user.id });
    if (!cleared.length) return false;
    await tx.update(account).set({ password: hash, updatedAt: new Date() }).where(and(eq(account.userId, id), eq(account.providerId, 'credential')));
    await tx.delete(session).where(and(eq(session.userId, id), ne(session.token, current.session.token)));
    return true;
  });
  if (!done) return { error: 'notNeeded' };
  return { ok: true };
}
