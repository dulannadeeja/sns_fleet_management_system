import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent, permissionGrant } from '../src/db/schema';
import { defaultPermissions } from '../src/auth/permissions';
import { addPerson, getPerson, setPermission } from '../src/modules/people/people';
import { person, samplePhone, theOwner } from './helpers/people';

// ST-15.2 People; Proposed check: "a new staff member starts with the agreed staff defaults and must change the first
// password before anything else"; ST-15.1 Proposed check: "a permission change is logged with who and when".
describe('the owner adds a person', () => {
  it('starts them with their role defaults and a first password, and logs who added them', async () => {
    const owner = await theOwner();
    const added = await addPerson(owner, { name: '  Sample Staff  ', phone: samplePhone(), password: 'first-pass-1', role: 'staff', language: 'en' });
    if (!('ok' in added)) throw new Error(added.error);
    expect(await person(added.id)).toMatchObject({ name: 'Sample Staff', role: 'staff', language: 'en', mustChangePassword: true });
    const grants = (await db.select().from(permissionGrant).where(eq(permissionGrant.userId, added.id))).map((g) => g.permission).sort();
    expect(grants).toEqual(defaultPermissions('staff').sort());
    const [logged] = await db.select().from(auditEvent).where(and(eq(auditEvent.targetId, added.id), eq(auditEvent.action, 'person.add')));
    expect(logged.createdBy).toBe(owner);
    expect(JSON.stringify(logged.details)).not.toContain('first-pass-1');
  });

  it('names what is wrong', async () => {
    const owner = await theOwner();
    const phone = samplePhone();
    const base = { name: 'Sample', phone, password: 'first-pass-1', role: 'staff' as const };
    expect(await addPerson(owner, { ...base, name: ' ' })).toEqual({ error: 'nameMissing' });
    expect(await addPerson(owner, { ...base, phone: '' })).toEqual({ error: 'phoneMissing' });
    expect(await addPerson(owner, { ...base, password: 'seven-c' })).toEqual({ error: 'passwordShort' });
    expect(await addPerson(owner, { ...base, role: 'partner' })).toEqual({ error: 'roleInvalid' });
    expect(await addPerson(owner, { ...base, role: 'owner' })).toEqual({ error: 'roleInvalid' });
    expect('ok' in (await addPerson(owner, base))).toBe(true);
    expect(await addPerson(owner, base)).toEqual({ error: 'phoneTaken' });
  });

  it('a permission change is logged with who; giving one already held changes nothing', async () => {
    const owner = await theOwner();
    const added = await addPerson(owner, { name: 'Sample', phone: samplePhone(), password: 'first-pass-1', role: 'staff' });
    if (!('ok' in added)) throw new Error(added.error);
    expect(await setPermission(owner, added.id, 'extendByPhone', true)).toEqual({ ok: true, changed: false });
    expect(await setPermission(owner, added.id, 'extendByPhone', false)).toEqual({ ok: true, changed: true });
    const logged = await db.select().from(auditEvent).where(and(eq(auditEvent.targetId, added.id), eq(auditEvent.action, 'permission.remove')));
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({ createdBy: owner, details: { permission: 'extendByPhone' } });
    expect((await getPerson(added.id))!.permissions).not.toContain('extendByPhone');
    expect(await getPerson('not-an-id')).toBeNull();
  });
});
