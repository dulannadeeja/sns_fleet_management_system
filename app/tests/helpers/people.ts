import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { auth } from '../../src/auth/server';
import { addPerson, type NewPerson } from '../../src/modules/people/people';
import { db } from '../../src/db/client';
import { user } from '../../src/db/schema';

export const samplePhone = () => `077${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

/** A person with a unique sample phone number, the given first password and their role's default permissions. */
export async function samplePerson(password = 'first-pass-1', role: NewPerson['role'] = 'staff') {
  const phone = samplePhone();
  const added = await addPerson(null, { name: `Sample ${randomUUID().slice(0, 6)}`, phone, password, role });
  if (!('ok' in added)) throw new Error(`samplePerson: ${added.error}`);
  return { id: added.id, phone, password };
}

/** The one owner of the test database (system design 3.1 allows only one): found, or added once. */
export async function theOwner(): Promise<string> {
  const find = async () => (await db.select({ id: user.id }).from(user).where(eq(user.role, 'owner')))[0]?.id;
  const found = await find();
  if (found) return found;
  try {
    const added = await addPerson(null, { name: 'Sample owner', phone: samplePhone(), password: 'owner-pass-1', role: 'owner' });
    if ('ok' in added) return added.id;
  } catch {
    // another test file added the owner at the same moment
  }
  const again = await find();
  if (!again) throw new Error('theOwner: no owner');
  return again;
}

/** Signs in through Better Auth; an error a hook throws comes back as a response, as the web route sends it. */
export async function signIn(phone: string, password: string): Promise<Response> {
  try {
    return await auth.api.signInPhoneNumber({ body: { phoneNumber: phone, password }, asResponse: true });
  } catch (e) {
    if (e instanceof APIError) return new Response(JSON.stringify(e.body), { status: e.statusCode });
    throw e;
  }
}

export async function person(id: string) {
  return (await db.select().from(user).where(eq(user.id, id)))[0];
}

/** Request headers carrying the session cookie of someone who just signed in. */
export async function sessionHeaders(phone: string, password: string): Promise<Headers> {
  const res = await signIn(phone, password);
  if (res.status !== 200) throw new Error(`sessionHeaders: sign-in answered ${res.status}`);
  return new Headers({ cookie: res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ') });
}

/** A person who has already set their own password, signed in: their id, phone, password and request headers. */
export async function signedInSample(role: NewPerson['role'] = 'staff') {
  const p = await samplePerson('own-pass-123', role);
  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, p.id));
  return { ...p, headers: await sessionHeaders(p.phone, p.password) };
}
