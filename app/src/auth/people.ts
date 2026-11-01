import { randomUUID } from 'node:crypto';
import { auth, MIN_PASSWORD } from './server';

/** Adds a person who signs in with a phone number and a first password; they must set their own at the first sign-in.
 *  Used by `npm run people:add` and tests until the owner's People screen (#15). Returns the new person's id. */
export async function addPerson({ name, phone, password }: { name: string; phone: string; password: string }): Promise<string> {
  if (password.length < MIN_PASSWORD) throw new Error(`The first password needs at least ${MIN_PASSWORD} characters`);
  const ctx = await auth.$context;
  // Better Auth needs an email; this placeholder is never sent to (real addresses for owner and admin come in #28).
  const created = await ctx.internalAdapter.createUser({ name, email: `${randomUUID()}@no-email.invalid`, emailVerified: false, phoneNumber: phone }, { method: 'admin' });
  await ctx.internalAdapter.linkAccount({ userId: created.id, providerId: 'credential', accountId: created.id, password: await ctx.password.hash(password) });
  return created.id;
}
