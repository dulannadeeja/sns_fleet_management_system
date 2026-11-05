import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { user } from '../../src/db/schema';
import { auth } from '../../src/auth/server';
import { person, samplePerson, signIn } from '../helpers/people';

// AT-60 "Someone types a wrong password 5 times: the account locks for 15 minutes" (system design 3.1, DN-03).
describe('AT-60: 5 wrong passwords lock the account for 15 minutes', () => {
  it('locks after the fifth wrong password, even against the right one', async () => {
    const p = await samplePerson();
    for (let i = 0; i < 5; i++) expect((await signIn(p.phone, 'wrong-pass-0')).status).toBe(401);
    const locked = await signIn(p.phone, p.password);
    expect(locked.status).toBe(429);
    expect(await locked.json()).toMatchObject({ code: 'ACCOUNT_LOCKED' });
    const lockedUntil = (await person(p.id)).lockedUntil!;
    const minutes = (lockedUntil.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(14.9);
    expect(minutes).toBeLessThanOrEqual(15);
  });

  it('opens again after the 15 minutes, and a right password clears the count', async () => {
    const p = await samplePerson();
    for (let i = 0; i < 5; i++) await signIn(p.phone, 'wrong-pass-0');
    await db.update(user).set({ lockedUntil: new Date(Date.now() - 1000) }).where(eq(user.id, p.id));
    expect((await signIn(p.phone, p.password)).status).toBe(200);
    expect(await person(p.id)).toMatchObject({ failedSignIns: 0, lockedUntil: null });
  });

  it('does not lock after four wrong passwords, and the right one resets the count', async () => {
    const p = await samplePerson();
    for (let i = 0; i < 4; i++) await signIn(p.phone, 'wrong-pass-0');
    expect((await signIn(p.phone, p.password)).status).toBe(200);
    expect((await person(p.id)).failedSignIns).toBe(0);
  });

  it('a wrong password while locked does not change the count or the lock', async () => {
    const p = await samplePerson();
    for (let i = 0; i < 5; i++) await signIn(p.phone, 'wrong-pass-0');
    const before = await person(p.id);
    expect((await signIn(p.phone, 'wrong-pass-0')).status).toBe(429);
    expect(await person(p.id)).toMatchObject({ failedSignIns: before.failedSignIns, lockedUntil: before.lockedUntil });
  });

  it('many wrong passwords at the same moment get no more than 5 checks', async () => {
    const p = await samplePerson();
    const answers = await Promise.all(Array.from({ length: 20 }, () => signIn(p.phone, 'wrong-pass-0')));
    expect(answers.filter((r) => r.status === 401).length).toBeLessThanOrEqual(5);
    expect(answers.filter((r) => r.status === 429).length).toBeGreaterThanOrEqual(15);
    expect((await signIn(p.phone, p.password)).status).toBe(429);
  });

  it('no other way to check a password is open (email sign-in, password change, other code paths)', async () => {
    const p = await samplePerson();
    const email = (await person(p.id)).email;
    await expect(auth.api.signInEmail({ body: { email, password: p.password } })).rejects.toThrow();
    // The email reset paths are open since #28, but their link only ever goes to a confirmed owner or admin email.
    for (const path of ['/sign-in/email', '/change-password', '/phone-number/send-otp', '/phone-number/request-password-reset', '/two-factor/enable', '/two-factor/verify-totp']) {
      const res = await auth.handler(new Request(`http://localhost:3000/api/auth${path}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' }, body: JSON.stringify({ email, password: p.password, phoneNumber: p.phone }) }));
      expect(res.status, path).toBe(404);
    }
  });
});
