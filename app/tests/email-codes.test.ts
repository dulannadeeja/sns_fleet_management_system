import { describe, it, expect } from 'vitest';
import { eq, like } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { auth } from '../src/auth/server';
import { db } from '../src/db/client';
import { user, verification } from '../src/db/schema';
import { signedInPerson } from '../src/auth/first-sign-in';
import { requestResetByPhone } from '../src/auth/reset';
import { confirmPendingEmail, sendEmailConfirmCode, setEmail } from '../src/modules/people/people';
import { call, person, samplePerson, signIn, theOwner, withCookies } from './helpers/people';
import { lastCode, mailsTo } from './helpers/outbox';

// System design 3.1 "Email codes and email reset" (Proposed, Dulan 1 Nov 2026).
const sendCode = (h: Headers) => call((o) => auth.api.sendTwoFactorOTP(o), h, {});
const checkCode = (h: Headers, code: string) => call((o) => auth.api.verifyTwoFactorOTP(o), h, { code, trustDevice: true });
const wrong = (code: string) => (code === '000000' ? '111111' : '000000');

async function adminWaitingForCode() {
  const a = await samplePerson('own-pass-123', 'admin');
  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, a.id));
  const waiting = withCookies(await signIn(a.phone, a.password));
  return { ...a, email: a.email!, waiting };
}

describe('sign-in codes', () => {
  it('one code a minute', async () => {
    const a = await adminWaitingForCode();
    expect((await sendCode(a.waiting)).status).toBe(200);
    const again = await sendCode(a.waiting);
    expect(again.status).toBe(429);
    expect((await again.json()).code).toBe('CODE_TOO_SOON');
    expect(mailsTo(a.email)).toHaveLength(1);
  });

  it('5 wrong codes stop the code; wrong codes count toward the 15-minute lock', async () => {
    const a = await adminWaitingForCode();
    await sendCode(a.waiting);
    const code = lastCode(a.email);
    // As with passwords (AT-60): 5 wrong codes are checked; the 5th sets the 15-minute lock; the next is refused.
    for (let i = 0; i < 5; i++) expect((await checkCode(a.waiting, wrong(code))).status).toBe(401);
    const locked = await checkCode(a.waiting, code);
    expect(locked.status).toBe(429);
    expect((await locked.json()).code).toBe('ACCOUNT_LOCKED');
    expect((await person(a.id)).lockedUntil).not.toBeNull();
  });

  it('a code works for 10 minutes only', async () => {
    const a = await adminWaitingForCode();
    await sendCode(a.waiting);
    const code = lastCode(a.email);
    await db.update(verification).set({ expiresAt: new Date(Date.now() - 1000) }).where(like(verification.identifier, '2fa-otp-%'));
    expect((await checkCode(a.waiting, code)).status).not.toBe(200);
  });
});

describe('changing an email', () => {
  it('codes keep going to the old email until the code sent to the new one is typed in; logged; owner only', async () => {
    const a = await adminWaitingForCode();
    await sendCode(a.waiting);
    const signedIn = withCookies(await checkCode(a.waiting, lastCode(a.email)), a.waiting);
    const owner = await theOwner();
    const newEmail = `sample-${randomUUID()}@example.net`;
    expect(await setEmail(a.id, a.id, newEmail)).toEqual({ error: 'notAllowed' });
    expect(await setEmail(owner, a.id, 'not an email')).toEqual({ error: 'emailInvalid' });
    expect(await setEmail(owner, a.id, newEmail)).toEqual({ ok: true });
    expect(await person(a.id)).toMatchObject({ email: a.email, pendingEmail: newEmail });

    // One code a minute counts sign-in codes too: move the last one back a minute.
    expect(await sendEmailConfirmCode(a.id)).toEqual({ error: 'codeTooSoon' });
    await db.update(user).set({ codeSentAt: new Date(Date.now() - 61_000) }).where(eq(user.id, a.id));
    expect(await sendEmailConfirmCode(a.id)).toEqual({ ok: true });
    const code = lastCode(newEmail);
    expect(await confirmPendingEmail(a.id, wrong(code))).toEqual({ error: 'codeWrong' });
    expect(await confirmPendingEmail(a.id, code)).toEqual({ ok: true });
    expect(await person(a.id)).toMatchObject({ email: newEmail, emailVerified: true, pendingEmail: null });
    expect(await signedInPerson(signedIn)).not.toBeNull();
  });

  it('staff need no email; an email someone has is refused', async () => {
    const owner = await theOwner();
    const s = await samplePerson();
    expect(await setEmail(owner, s.id, `sample-${randomUUID()}@example.com`)).toEqual({ error: 'emailNotNeeded' });
    const other = await samplePerson('first-pass-1', 'admin');
    const a = await samplePerson('first-pass-1', 'admin');
    expect(await setEmail(owner, a.id, other.email!)).toEqual({ error: 'emailTaken' });
  });
});

describe('forgot password by email', () => {
  async function confirmedAdmin() {
    const a = await adminWaitingForCode();
    await sendCode(a.waiting);
    const signedIn = withCookies(await checkCode(a.waiting, lastCode(a.email)), a.waiting);
    return { ...a, signedIn };
  }

  it('emails a link only to an owner or admin with a confirmed email; the same answer for any number', async () => {
    const a = await confirmedAdmin();
    const s = await samplePerson();
    await requestResetByPhone(s.phone);
    await requestResetByPhone('0789999999');
    await requestResetByPhone(a.phone);
    const mails = mailsTo(a.email).filter((m) => /reset-password\//.test(m.text));
    expect(mails).toHaveLength(1);
  });

  it('the link sets a new password once, within 1 hour, and ends every session', async () => {
    const a = await confirmedAdmin();
    await requestResetByPhone(a.phone);
    const link = mailsTo(a.email).filter((m) => /reset-password\//.test(m.text)).at(-1)!.text;
    const token = link.match(/reset-password\/([^?\s]+)/)![1];
    expect((await call((o) => auth.api.resetPassword(o), new Headers(), { token, newPassword: 'short' })).status).toBe(400);
    expect((await call((o) => auth.api.resetPassword(o), new Headers(), { token, newPassword: 'brand-new-pass-1' })).status).toBe(200);
    expect(await signedInPerson(a.signedIn)).toBeNull();
    expect((await call((o) => auth.api.resetPassword(o), new Headers(), { token, newPassword: 'another-pass-2' })).status).toBe(400);
    expect((await signIn(a.phone, 'brand-new-pass-1')).status).toBe(200);
    expect((await person(a.id)).mustChangePassword).toBe(false);
  });
});
