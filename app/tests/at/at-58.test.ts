import { describe, it, expect } from 'vitest';
import { accessFor } from '../../src/auth/access';
import { addPerson, resetPassword, setPermission, turnOff, turnOn } from '../../src/modules/people/people';
import { samplePerson, samplePhone, signedInSample, theOwner } from '../helpers/people';

// AT-58 (TRD › Sign-in and permissions): only the primary owner may change permissions, add people or turn accounts
// off; these can never be given to anyone (system design 3.2, Delegation).
describe('AT-58: only the primary owner manages people and permissions', () => {
  it('refuses an admin and a staff member, even called directly', async () => {
    const target = await samplePerson();
    for (const role of ['admin', 'staff'] as const) {
      const actor = await signedInSample(role);
      expect((await accessFor(actor.headers, 'owner')).kind).toBe('denied');
      expect(await setPermission(actor.id, target.id, 'exportReports', true)).toEqual({ error: 'notAllowed' });
      expect(await addPerson(actor.id, { name: 'Sample', phone: samplePhone(), password: 'first-pass-1', role: 'staff' })).toEqual({ error: 'notAllowed' });
      expect(await turnOff(actor.id, target.id, 'test')).toEqual({ error: 'notAllowed' });
      expect(await turnOn(actor.id, target.id)).toEqual({ error: 'notAllowed' });
      expect(await resetPassword(actor.id, target.id, 'new-first-1')).toEqual({ error: 'notAllowed' });
    }
  });

  it('the owner can; the owner-only actions are not in the permission list', async () => {
    const owner = await theOwner();
    const target = await samplePerson();
    expect(await setPermission(owner, target.id, 'exportReports', true)).toEqual({ ok: true, changed: true });
    expect(await setPermission(owner, target.id, 'addPeople', true)).toEqual({ error: 'permissionInvalid' });
    expect(await setPermission(owner, owner, 'exportReports', true)).toEqual({ error: 'roleInvalid' });
  });
});
