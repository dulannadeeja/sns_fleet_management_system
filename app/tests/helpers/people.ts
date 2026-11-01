import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { auth } from '../../src/auth/server';
import { addPerson, type NewPerson } from '../../src/modules/people/people';
import { db } from '../../src/db/client';
import { user } from '../../src/db/schema';
import { lastCode } from './outbox';

export const samplePhone = () => `077${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

/** A person with a unique sample phone number, the given first password and their role's default permissions. */
export async function samplePerson(password = 'first-pass-1', role: NewPerson['role'] = 'staff') {
  const phone = samplePhone();
  const email = role === 'staff' ? undefined : `sample-${randomUUID()}@example.com`;
  const added = await addPerson(null, { name: `Sample ${randomUUID().slice(0, 6)}`, phone, password, role, email });
  if (!('ok' in added)) throw new Error(`samplePerson: ${added.error}`);
  return { id: added.id, phone, password, email };
}

/** The one owner of the test database (system design 3.1 allows only one): found, or added once. */
export async function theOwner(): Promise<string> {
  const find = async () => (await db.select({ id: user.id }).from(user).where(eq(user.role, 'owner')))[0]?.id;
  const found = await find();
  if (found) return found;
  try {
    const added = await addPerson(null, { name: 'Sample owner', phone: samplePhone(), password: 'owner-pass-1', role: 'owner', email: `sample-owner-${randomUUID()}@example.com` });
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

/** Request headers carrying the session cookie of someone who just signed in; for the owner or an admin on a new
 *  device, also typing the emailed code from the test outbox (#28). */
export async function sessionHeaders(phone: string, password: string): Promise<Headers> {
  const res = await signIn(phone, password);
  if (res.status !== 200) throw new Error(`sessionHeaders: sign-in answered ${res.status}`);
  if (!(await res.clone().json()).twoFactorRedirect) return withCookies(res);
  const waiting = withCookies(res);
  const [p] = await db.select({ email: user.email, verified: user.emailVerified, pending: user.pendingEmail }).from(user).where(eq(user.phoneNumber, phone));
  await db.update(user).set({ codeSentAt: null }).where(eq(user.phoneNumber, phone));
  const sent = await call((o) => auth.api.sendTwoFactorOTP(o), waiting, {});
  if (sent.status !== 200) throw new Error(`sessionHeaders: sending the code answered ${sent.status}`);
  const done = await call((o) => auth.api.verifyTwoFactorOTP(o), waiting, { code: lastCode(p.verified ? p.email : p.pending!), trustDevice: true });
  if (done.status !== 200) throw new Error(`sessionHeaders: the code answered ${done.status}`);
  return withCookies(done, waiting);
}

/** A person who has already set their own password, signed in: their id, phone, password and request headers. */
export async function signedInSample(role: NewPerson['role'] = 'staff') {
  const p = await samplePerson('own-pass-123', role);
  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, p.id));
  return { ...p, headers: await sessionHeaders(p.phone, p.password) };
}

/** The cookies a response sets, as one Cookie header, added to what the browser already holds. */
export function withCookies(res: Response, before = new Headers()): Headers {
  const jar = new Map((before.get('cookie') ?? '').split('; ').filter(Boolean).map((c) => [c.split('=')[0], c] as const));
  for (const c of res.headers.getSetCookie()) {
    const pair = c.split(';')[0];
    const name = pair.split('=')[0];
    if (/max-age=0/i.test(c) || pair.endsWith('=')) jar.delete(name); else jar.set(name, pair);
  }
  return new Headers({ cookie: [...jar.values()].join('; ') });
}

/** Calls a Better Auth endpoint as a browser would; an error comes back as a response. */
export async function call(fn: (o: { headers: Headers; body?: object; asResponse: true }) => Promise<Response>, headers: Headers, body?: object): Promise<Response> {
  try {
    return await fn({ headers, body, asResponse: true });
  } catch (e) {
    if (e instanceof APIError) return new Response(JSON.stringify(e.body), { status: e.statusCode });
    throw e;
  }
}
