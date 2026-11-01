import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { user } from '../../src/db/schema';
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
});
