import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { auth } from '../../src/auth/server';
import { db } from '../../src/db/client';
import { user } from '../../src/db/schema';
import { signedInPerson } from '../../src/auth/first-sign-in';
import { call, person, samplePerson, signIn, withCookies } from '../helpers/people';
import { lastCode, mailsTo } from '../helpers/outbox';

// AT-61 "The admin signs in on a new phone: a one-time code is emailed to the admin; sign-in finishes only with it"
// (system design 3.1 Sign-in safety, DN-03; "Email codes and email reset", Proposed).
async function adminWithOwnPassword() {
  const p = await samplePerson('own-pass-123', 'admin');
  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, p.id));
  return { ...p, email: p.email! };
}
const sendCode = (h: Headers) => call((o) => auth.api.sendTwoFactorOTP(o), h, {});
const checkCode = (h: Headers, code: string) => call((o) => auth.api.verifyTwoFactorOTP(o), h, { code, trustDevice: true });

describe('AT-61: a new device needs the emailed code', () => {
  it('the right password alone does not sign the admin in; the emailed code does', async () => {
    const a = await adminWithOwnPassword();
    const first = await signIn(a.phone, a.password);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ twoFactorRedirect: true });
    const waiting = withCookies(first);
    expect(await signedInPerson(waiting)).toBeNull();

    expect((await sendCode(waiting)).status).toBe(200);
    const code = lastCode(a.email);
    expect((await checkCode(waiting, code === '000000' ? '111111' : '000000')).status).toBe(401);
    const done = await checkCode(waiting, code);
    expect(done.status).toBe(200);
    const signedIn = withCookies(done, waiting);
    expect((await signedInPerson(signedIn))?.id).toBe(a.id);

    // The first code to a first email confirms it.
    expect(await person(a.id)).toMatchObject({ email: a.email, emailVerified: true, pendingEmail: null });

    // The same device again: no code. Another device (no remembered-device cookie): a code again.
    const before = mailsTo(a.email).length;
    const again = await call((o) => auth.api.signInPhoneNumber(o), signedIn, { phoneNumber: a.phone, password: a.password });
    expect(again.status).toBe(200);
    expect(await again.clone().json()).not.toHaveProperty('twoFactorRedirect');
    expect((await signedInPerson(withCookies(again, signedIn)))?.id).toBe(a.id);
    expect(mailsTo(a.email).length).toBe(before);
    expect(await (await signIn(a.phone, a.password)).json()).toMatchObject({ twoFactorRedirect: true });
  });

  it('staff never get a code', async () => {
    const s = await samplePerson('own-pass-123', 'staff');
    const res = await signIn(s.phone, s.password);
    expect(await res.json()).not.toHaveProperty('twoFactorRedirect');
  });
});
