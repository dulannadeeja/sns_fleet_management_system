import { describe, it, expect } from 'vitest';
import { accessFor } from '../../src/auth/access';
import { theOwner, signedInSample } from '../helpers/people';
import { setPermission } from '../../src/modules/people/people';

// AT-24 "Staff without export or payroll permission request those records directly: the server denies access, even
// outside normal navigation" (PR-06; TRD › Integrity rules). accessFor is what every page and action asks first.
describe('AT-24: the server checks permissions on every request', () => {
  it('refuses a staff member without Export reports or Manage payroll', async () => {
    const staff = await signedInSample('staff');
    expect((await accessFor(staff.headers, 'exportReports')).kind).toBe('denied');
    expect((await accessFor(staff.headers, 'managePayroll')).kind).toBe('denied');
  });

  it('lets them in once the owner gives the permission, and refuses again when it is taken away', async () => {
    const staff = await signedInSample('staff');
    const owner = await theOwner();
    expect(await setPermission(owner, staff.id, 'exportReports', true)).toEqual({ ok: true, changed: true });
    expect((await accessFor(staff.headers, 'exportReports')).kind).toBe('allowed');
    expect(await setPermission(owner, staff.id, 'exportReports', false)).toEqual({ ok: true, changed: true });
    expect((await accessFor(staff.headers, 'exportReports')).kind).toBe('denied');
  });

  it('the admin has both by default (Proposed); staff and admin keep their defaults', async () => {
    const admin = await signedInSample('admin');
    expect((await accessFor(admin.headers, 'exportReports')).kind).toBe('allowed');
    expect((await accessFor(admin.headers, 'managePayroll')).kind).toBe('allowed');
    const staff = await signedInSample('staff');
    expect((await accessFor(staff.headers, 'extendByPhone')).kind).toBe('allowed');
  });

  it('sends someone not signed in to sign in', async () => {
    expect(await accessFor(new Headers(), 'exportReports')).toEqual({ kind: 'redirect', to: '/sign-in' });
  });
});
