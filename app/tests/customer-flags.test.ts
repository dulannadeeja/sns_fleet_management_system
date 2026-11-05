import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent, customer, customerGoAhead, user } from '../src/db/schema';
import { addCustomer } from '../src/modules/customers/customers';
import { addFlag, goAhead, warningsFor } from '../src/modules/customers/flags';
import { setPermission } from '../src/modules/people/people';
import { samplePerson, theOwner } from './helpers/people';
import { sampleCustomer } from './helpers/customers';

// ST-08.4 and ST-08.5 (system design 6, 3.2; Confirmed 5 Nov 2026. Each test adds its own sample customer.
const newCustomer = async (licenceExpires?: string) => {
  const c = await addCustomer(await theOwner(), { ...sampleCustomer(), ...(licenceExpires ? { licenceExpires } : {}) });
  if (!('ok' in c)) throw new Error('sample customer not added');
  return c.id;
};

describe('ST-08.5: flag a customer', () => {
  it('needs a reason and what happened; people without customer access cannot', async () => {
    const id = await newCustomer();
    const staff = await samplePerson();
    expect(await addFlag(staff.id, id, { kind: 'rating', details: 'x' })).toEqual({ error: 'kindInvalid' });
    expect(await addFlag(staff.id, id, { kind: 'damage', details: ' ' })).toEqual({ error: 'detailsMissing' });
    expect(await addFlag(staff.id, id, { kind: 'damage', details: 'x'.repeat(501) })).toEqual({ error: 'tooLong' });
    const owner = await theOwner();
    await setPermission(owner, staff.id, 'customerAccess', false);
    expect(await addFlag(staff.id, id, { kind: 'damage', details: 'Sample: scratched door' })).toEqual({ error: 'notAllowed' });
    const partner = await samplePerson();
    await db.update(user).set({ role: 'partner' }).where(eq(user.id, partner.id));
    expect(await addFlag(partner.id, id, { kind: 'damage', details: 'Sample' })).toEqual({ error: 'notAllowed' });
  });
});

describe('ST-08.4: warnings before a rental', () => {
  it('with a flag, staff continue only with a reason; the reason, name and time are recorded', async () => {
    const id = await newCustomer();
    const staff = await samplePerson();
    const flag = await addFlag(staff.id, id, { kind: 'damage', details: 'Sample: damaged a mirror' });
    if (!('ok' in flag)) throw new Error(flag.error);
    expect(await goAhead(staff.id, id, { reason: '', shownFlagIds: [flag.id], shownLicenceExpired: false })).toEqual({ error: 'reasonMissing' });
    // The screen showed no flag, but there is one now: refused.
    expect(await goAhead(staff.id, id, { reason: 'Sample: regular customer', shownFlagIds: [], shownLicenceExpired: false })).toEqual({ error: 'stale' });
    const ok = await goAhead(staff.id, id, { reason: 'Sample: regular customer, mirror paid', shownFlagIds: [flag.id], shownLicenceExpired: false });
    if (!('ok' in ok)) throw new Error(ok.error);
    // The reason, the name and the time are recorded, with the flag that was shown.
    const [row] = await db.select().from(customerGoAhead).where(eq(customerGoAhead.id, ok.id));
    expect(row).toMatchObject({ customerId: id, reason: 'Sample: regular customer, mirror paid', createdBy: staff.id, flagIds: [flag.id], licenceExpired: false });
    expect(Date.now() - row.createdAt.getTime()).toBeLessThan(60_000);
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'customer.goAhead'), eq(auditEvent.targetId, id)));
    expect(log).toMatchObject({ createdBy: staff.id, details: { reason: 'Sample: regular customer, mirror paid', flags: 1 } });
    // Without "Go ahead despite a customer flag" (the owner can take it away), staff cannot.
    await setPermission(await theOwner(), staff.id, 'proceedDespiteFlag', false);
    expect(await goAhead(staff.id, id, { reason: 'Sample', shownFlagIds: [flag.id], shownLicenceExpired: false })).toEqual({ error: 'notAllowed' });
    // The flag shows to every person, whoever added it: another staff member and an admin both get it, and it was
    // still shown to the staff member who may no longer continue.
    const other = await samplePerson();
    const admin = await samplePerson('first-pass-1', 'admin');
    expect(await goAhead(other.id, id, { reason: 'Sample: seen', shownFlagIds: [], shownLicenceExpired: false })).toEqual({ error: 'stale' });
    expect(await goAhead(admin.id, id, { reason: 'Sample: seen by the admin', shownFlagIds: [flag.id], shownLicenceExpired: false })).toMatchObject({ ok: true });
    expect((await warningsFor(id))!.openFlags.map((f) => f.id)).toEqual([flag.id]);
  });

  it('with an expired licence, staff cannot continue; the authorised person can, and the licence stays expired', async () => {
    const id = await newCustomer('2020-01-31');
    const w = (await warningsFor(id))!;
    expect(w).toMatchObject({ licenceExpired: true, openFlags: [] });
    const staff = await samplePerson();
    expect(await goAhead(staff.id, id, { reason: 'Sample: renewing tomorrow', shownFlagIds: [], shownLicenceExpired: true })).toEqual({ error: 'licenceNotAllowed' });
    const owner = await theOwner();
    await setPermission(owner, staff.id, 'overrideExpiredDocuments', true);
    expect(await goAhead(staff.id, id, { reason: 'Sample: renewal receipt seen', shownFlagIds: [], shownLicenceExpired: true })).toMatchObject({ ok: true });
    expect((await warningsFor(id))!.licenceExpired).toBe(true);
    const [c] = await db.select({ e: customer.licenceExpires }).from(customer).where(eq(customer.id, id));
    expect(c.e).toBe('2020-01-31');
  });

  it('a customer with nothing to warn about needs no decision', async () => {
    const id = await newCustomer();
    expect(await goAhead(await theOwner(), id, { reason: 'Sample', shownFlagIds: [], shownLicenceExpired: false })).toEqual({ error: 'nothingToCheck' });
  });
});
