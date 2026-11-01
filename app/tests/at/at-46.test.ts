import { describe, it, expect } from 'vitest';
import { nextStep, setOwnPassword, signedInPerson } from '../../src/auth/first-sign-in';
import { person, samplePerson, signIn, signedInSample, theOwner } from '../helpers/people';
import { resetPassword } from '../../src/modules/people/people';

// AT-46 "A staff member forgets their password: the primary owner resets it; the staff member changes it at the next sign-in".
// Both halves: the owner's reset (People, #15) and the change at the next sign-in; a first password takes the same path (ST-01.2).
async function sessionHeaders(phone: string, password: string): Promise<Headers> {
  const res = await signIn(phone, password);
  expect(res.status).toBe(200);
  const cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  return new Headers({ cookie });
}

describe('AT-46: the owner resets a forgotten password; it is changed at the next sign-in', () => {
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

  it('refuses on an account that already has its own password (that needs the current password)', async () => {
    const p = await samplePerson();
    const headers = await sessionHeaders(p.phone, p.password);
    expect(await setOwnPassword(headers, { password: 'my-own-pass', repeat: 'my-own-pass', language: 'si' })).toEqual({ ok: true });
    expect(await setOwnPassword(headers, { password: 'taken-over-1', repeat: 'taken-over-1', language: 'si' })).toEqual({ error: 'notNeeded' });
    expect((await signIn(p.phone, 'my-own-pass')).status).toBe(200);
  });

  it('signs the person out everywhere else when the password is set', async () => {
    const p = await samplePerson();
    const other = await sessionHeaders(p.phone, p.password);
    const headers = await sessionHeaders(p.phone, p.password);
    expect(await setOwnPassword(headers, { password: 'my-own-pass', repeat: 'my-own-pass', language: 'si' })).toEqual({ ok: true });
    expect(await signedInPerson(other)).toBeNull();
    expect(await signedInPerson(headers)).not.toBeNull();
  });

  it('two submissions at the same moment: only one sets the password', async () => {
    const p = await samplePerson();
    const headers = await sessionHeaders(p.phone, p.password);
    const results = await Promise.all(['own-pass-one', 'own-pass-two'].map((pw) => setOwnPassword(headers, { password: pw, repeat: pw, language: 'si' })));
    expect(results.filter((r) => 'ok' in r)).toHaveLength(1);
  });

  it('the owner resets a forgotten password: the old one stops, the new first one must be changed, sessions end', async () => {
    const staff = await signedInSample('staff');
    const owner = await theOwner();
    expect(await resetPassword(owner, staff.id, 'short')).toEqual({ error: 'passwordShort' });
    expect(await resetPassword(owner, staff.id, 'given-by-owner-1')).toEqual({ ok: true });
    expect(await signedInPerson(staff.headers)).toBeNull();
    expect((await signIn(staff.phone, staff.password)).status).toBe(401);
    const again = await sessionHeaders(staff.phone, 'given-by-owner-1');
    expect(nextStep(await signedInPerson(again))).toBe('/first-sign-in');
    expect((await person(staff.id)).mustChangePassword).toBe(true);
  });
});

