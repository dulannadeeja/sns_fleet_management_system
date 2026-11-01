import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent } from '../src/db/schema';
import { setPermission } from '../src/modules/people/people';
import { addCopy, addCustomer, correctCustomer, getCustomer, listCustomers } from '../src/modules/customers/customers';
import { samplePerson, theOwner } from './helpers/people';
import { JPEG, NOT_A_PHOTO, PDF, sampleCustomer } from './helpers/customers';

// ST-08.1 to ST-08.3 (system design 6; decisions of 1 Nov 2026, Proposed). Each test adds its own sample customers.
describe('ST-08.2: add a customer', () => {
  it('needs name, NIC, phone and licence number and expiry; copies may come later; logged', async () => {
    const owner = await theOwner();
    const c = sampleCustomer();
    expect(await addCustomer(owner, { ...c, name: ' ' })).toEqual({ error: 'nameMissing' });
    expect(await addCustomer(owner, { ...c, nic: '1234' })).toEqual({ error: 'nicInvalid' });
    expect(await addCustomer(owner, { ...c, phone: '12' })).toEqual({ error: 'phoneInvalid' });
    expect(await addCustomer(owner, { ...c, licenceNumber: '' })).toEqual({ error: 'licenceNumberMissing' });
    expect(await addCustomer(owner, { ...c, licenceExpires: '2030-02-30' })).toEqual({ error: 'licenceExpiresInvalid' });
    const added = await addCustomer(owner, { ...c, address: 'Sample road, Elpitiya' });
    if (!('ok' in added)) throw new Error(JSON.stringify(added));
    expect(await getCustomer(added.id)).toMatchObject({ name: c.name, nic: c.nic, phone: c.phone, licenceExpires: '2030-01-31', copiesMissing: ['nicFront', 'nicBack', 'licenceFront', 'licenceBack'] });
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'customer.add'), eq(auditEvent.targetId, added.id)));
    expect(log.details).toMatchObject({ name: c.name });
  });

  it('takes photos and PDFs up to 10 MB, read from the file itself; refuses anything else and saves nothing', async () => {
    const owner = await theOwner();
    const c = sampleCustomer();
    expect(await addCustomer(owner, c, [{ kind: 'nicFront', bytes: NOT_A_PHOTO }])).toEqual({ error: 'fileType', kind: 'nicFront' });
    expect(await addCustomer(owner, c, [{ kind: 'nicFront', bytes: new Uint8Array(10 * 1024 * 1024 + 1).fill(0xff) }])).toEqual({ error: 'fileTooBig', kind: 'nicFront' });
    expect(await listCustomers(c.nic)).toHaveLength(0);
    const added = await addCustomer(owner, c, [{ kind: 'licenceFront', bytes: PDF }]);
    if (!('ok' in added)) throw new Error(JSON.stringify(added));
    expect((await getCustomer(added.id))!.documents).toEqual([expect.objectContaining({ kind: 'licenceFront', contentType: 'application/pdf' })]);
    expect(await addCopy(owner, added.id, 'nicFront', NOT_A_PHOTO)).toEqual({ error: 'fileType', kind: 'nicFront' });
    expect(await addCopy(owner, added.id, 'passport', JPEG)).toEqual({ error: 'kindInvalid' });
  });

  it('needs customer access (staff and admin by default)', async () => {
    const owner = await theOwner();
    const staff = await samplePerson();
    const ok = await addCustomer(staff.id, sampleCustomer());
    expect('ok' in ok).toBe(true);
    await setPermission(owner, staff.id, 'customerAccess', false);
    expect(await addCustomer(staff.id, sampleCustomer())).toEqual({ error: 'notAllowed' });
  });
});

describe('ST-08.3: correct a customer', () => {
  it('saves only what changed, never the NIC; each change logged with old and new; a form left open is refused', async () => {
    const owner = await theOwner();
    const c = sampleCustomer();
    const added = await addCustomer(owner, c);
    if (!('ok' in added)) throw new Error(JSON.stringify(added));
    const was = { name: c.name, phone: c.phone, address: '', licenceNumber: c.licenceNumber, licenceExpires: c.licenceExpires };
    expect(await correctCustomer(owner, added.id, { ...was, phone: '0712345678' }, was)).toEqual({ ok: true, changed: ['phone'] });
    expect(await correctCustomer(owner, added.id, { ...was, phone: '0700000000' }, was)).toEqual({ error: 'stale', fields: ['phone'] });
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'customer.change'), eq(auditEvent.targetId, added.id)));
    expect(log.details).toMatchObject({ field: 'phone', old: c.phone, new: '0712345678' });
    expect((await getCustomer(added.id))!.nic).toBe(c.nic);
  });
});

describe('ST-08.1: find a customer', () => {
  it('finds by name, NIC or phone; an expired licence comes first', async () => {
    const owner = await theOwner();
    const tag = Math.random().toString(36).slice(2, 8);
    const fine = await addCustomer(owner, { ...sampleCustomer(), name: `Aaa ${tag}` });
    const expired = await addCustomer(owner, { ...sampleCustomer(), name: `Zzz ${tag}`, licenceExpires: '2020-01-01' });
    if (!('ok' in fine) || !('ok' in expired)) throw new Error('setup');
    const found = await listCustomers(tag);
    expect(found.map((x) => x.id)).toEqual([expired.id, fine.id]);
    expect(found[0]).toMatchObject({ licenceExpired: true });
    const byNic = await getCustomer(fine.id);
    expect((await listCustomers(byNic!.nic)).map((x) => x.id)).toEqual([fine.id]);
  });
});
