import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { auth } from '../../src/auth/server';
import { addPerson } from '../../src/auth/people';
import { db } from '../../src/db/client';
import { user } from '../../src/db/schema';

/** A person with a unique sample phone number and the given first password. */
export async function samplePerson(password = 'first-pass-1') {
  const phone = `07${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
  const id = await addPerson({ name: `Sample ${randomUUID().slice(0, 6)}`, phone, password });
  return { id, phone, password };
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
