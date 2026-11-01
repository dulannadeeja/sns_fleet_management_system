import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { user } from '../db/schema';
import { auth, MIN_PASSWORD, type Session } from './server';

// ST-01.2 First sign-in: a first (or reset) password is replaced before anything else; the person picks their language.
export type Language = 'si' | 'en';
export type SignedInPerson = Session['user'];

/** The signed-in person for these request headers, or null. */
export async function signedInPerson(headers: Headers): Promise<SignedInPerson | null> {
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  return session?.user ?? null;
}

/** Where a person must go before anything else: sign-in, first sign-in, or nowhere (null). */
export function nextStep(person: Pick<SignedInPerson, 'mustChangePassword'> | null): '/sign-in' | '/first-sign-in' | null {
  if (!person) return '/sign-in';
  if (person.mustChangePassword) return '/first-sign-in';
  return null;
}

export type SetOwnPasswordResult = { ok: true } | { error: 'signedOut' | 'tooShort' | 'notSame' };

/** Replaces the first or reset password with the person's own, saves their language and lets them in. */
export async function setOwnPassword(headers: Headers, input: { password: string; repeat: string; language: Language }): Promise<SetOwnPasswordResult> {
  const person = await signedInPerson(headers);
  if (!person) return { error: 'signedOut' };
  if (input.password.length < MIN_PASSWORD) return { error: 'tooShort' };
  if (input.password !== input.repeat) return { error: 'notSame' };
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(person.id, await ctx.password.hash(input.password));
  await db.update(user).set({ mustChangePassword: false, language: input.language === 'en' ? 'en' : 'si', updatedAt: new Date() }).where(eq(user.id, person.id));
  return { ok: true };
}
