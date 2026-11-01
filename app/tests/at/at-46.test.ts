import { describe, it, expect } from 'vitest';
import { nextStep, setOwnPassword, signedInPerson } from '../../src/auth/first-sign-in';
import { person, samplePerson, signIn } from '../helpers/people';

// AT-46 "A staff member forgets their password: the primary owner resets it; the staff member changes it at the next sign-in".
// This is the sign-in half; the owner's reset comes with People (#15). Same path for a first password (ST-01.2).
async function sessionHeaders(phone: string, password: string): Promise<Headers> {
  const res = await signIn(phone, password);
  expect(res.status).toBe(200);
  const cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  return new Headers({ cookie });
}

describe('AT-46 (sign-in half): the first or reset password is changed at the next sign-in', () => {
  it('sends a person with a first password to first sign-in, and nowhere else', async () => {
    const p = await samplePerson();
    const headers = await sessionHeaders(p.phone, p.password);
    expect(nextStep(await signedInPerson(headers))).toBe('/first-sign-in');
    expect(nextStep(null)).toBe('/sign-in');
  });

  it('refuses a new password under 8 characters, or two entries that differ', async () => {
    const p = await samplePerson();
    const headers = await sessionHeaders(p.phone, p.password);
    expect(await setOwnPassword(headers, { password: 'short7c', repeat: 'short7c', language: 'si' })).toEqual({ error: 'tooShort' });
    expect(await setOwnPassword(headers, { password: 'my-own-pass', repeat: 'my-own-pas', language: 'si' })).toEqual({ error: 'notSame' });
    expect((await person(p.id)).mustChangePassword).toBe(true);
  });

  it('sets their own password and language; the first one stops working', async () => {
    const p = await samplePerson();
    const headers = await sessionHeaders(p.phone, p.password);
    expect(await setOwnPassword(headers, { password: 'my-own-pass', repeat: 'my-own-pass', language: 'en' })).toEqual({ ok: true });
    expect(await person(p.id)).toMatchObject({ mustChangePassword: false, language: 'en' });
    expect(nextStep(await signedInPerson(headers))).toBeNull();
    expect((await signIn(p.phone, p.password)).status).toBe(401);
    expect((await signIn(p.phone, 'my-own-pass')).status).toBe(200);
  });

  it('refuses without a signed-in person', async () => {
    expect(await setOwnPassword(new Headers(), { password: 'my-own-pass', repeat: 'my-own-pass', language: 'si' })).toEqual({ error: 'signedOut' });
  });
});
