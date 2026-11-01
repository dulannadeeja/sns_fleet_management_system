import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { permissionGrant } from '../src/db/schema';
import { person, samplePerson, samplePhone, signedInSample } from './helpers/people';

// AT-58 at the screens' own entry points: each server action of 15.1, 15.4 and 15.6, called directly as a staff member
// or an admin, is refused before anything changes (requireOwner first; TRD › Integrity rules).
let requestHeaders = new Headers();
vi.mock('next/headers', () => ({ headers: async () => requestHeaders, cookies: async () => ({ get: () => undefined }) }));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('next/navigation', () => ({
  forbidden: () => { throw new Error('FORBIDDEN'); },
  redirect: (to: string) => { throw new Error(`REDIRECT ${to}`); },
  notFound: () => { throw new Error('NOT_FOUND'); },
}));

const { addPersonAction, resetPasswordAction, turnOffAction, turnOnAction } = await import('../src/app/settings/people/actions');
const { setPermissionAction } = await import('../src/app/settings/permissions/actions');

const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};

describe('AT-58: the Settings actions refuse anyone but the owner', () => {
  beforeEach(() => { requestHeaders = new Headers(); });

  for (const role of ['staff', 'admin'] as const) {
    it(`refuses ${role}, and nothing changes`, async () => {
      const actor = await signedInSample(role);
      requestHeaders = actor.headers;
      const target = await samplePerson();
      const phone = samplePhone();
      await expect(addPersonAction({}, form({ name: 'Sample', phone, password: 'first-pass-1', role: 'staff' }))).rejects.toThrow('FORBIDDEN');
      await expect(resetPasswordAction(target.id, {}, form({ password: 'taken-over-1' }))).rejects.toThrow('FORBIDDEN');
      await expect(turnOffAction(target.id, {}, form({ reason: 'x' }))).rejects.toThrow('FORBIDDEN');
      await expect(turnOnAction(target.id)).rejects.toThrow('FORBIDDEN');
      await expect(setPermissionAction(target.id, 'exportReports', true)).rejects.toThrow('FORBIDDEN');
      expect(await person(target.id)).toMatchObject({ disabledAt: null, mustChangePassword: true });
      const grants = await db.select().from(permissionGrant).where(eq(permissionGrant.userId, target.id));
      expect(grants.map((g) => g.permission)).not.toContain('exportReports');
    });
  }

  it('sends someone not signed in to sign in', async () => {
    await expect(setPermissionAction('00000000-0000-0000-0000-000000000000', 'exportReports', true)).rejects.toThrow('REDIRECT /sign-in');
  });
});
