import { describe, it, expect } from 'vitest';
import { addPerson } from '../src/auth/people';
import { samplePerson, signIn } from './helpers/people';

// System design 3.1 "Sign-in phone numbers" (Proposed), on the server side.
describe('sign-in numbers on the server', () => {
  it('a person cannot be added with a number that is not a Sri Lankan mobile', async () => {
    await expect(addPerson({ name: 'Sample', phone: '0731234567', password: 'first-pass-1' })).rejects.toThrow(/Sri Lankan mobile/);
    await expect(addPerson({ name: 'Sample', phone: '077 123 4567', password: 'first-pass-1' })).rejects.toThrow(/Sri Lankan mobile/);
  });

  it('Better Auth refuses such a number even when called directly', async () => {
    expect((await signIn('0731234567', 'first-pass-1')).status).toBe(400);
  });

  it('a wrong password and a number with no account give the same answer', async () => {
    const p = await samplePerson();
    const known = await signIn(p.phone, 'wrong-pass-0');
    const unknown = await signIn('0780000000', 'wrong-pass-0');
    expect(known.status).toBe(unknown.status);
    expect((await known.json()).code).toBe((await unknown.json()).code);
  });
});
