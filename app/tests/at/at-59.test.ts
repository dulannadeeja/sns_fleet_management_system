import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { documentAccess } from '../../src/db/schema';
import { accessFor } from '../../src/auth/access';
import { setPermission } from '../../src/modules/people/people';
import { addCustomer, getCustomer, openCopy } from '../../src/modules/customers/customers';
import { samplePerson, signedInSample, theOwner } from '../helpers/people';
import { JPEG, sampleCustomer } from '../helpers/customers';

// AT-59 "Staff open a customer's NIC copy: it opens for staff with customer access; the opening is logged with who and
// when; there is no public link" (system design 6, Confirmed; "customer access" is a permission, Proposed 1 Nov 2026).
describe('AT-59: opening a document copy', () => {
  it('opens for staff with customer access and logs who and when; others are refused and nothing is logged', async () => {
    const owner = await theOwner();
    const added = await addCustomer(owner, sampleCustomer(), [{ kind: 'nicFront', bytes: JPEG }]);
    if (!('ok' in added)) throw new Error(JSON.stringify(added));
    const doc = (await getCustomer(added.id))!.documents.find((d) => d.kind === 'nicFront')!;
    const staff = await signedInSample('staff');
    expect((await accessFor(staff.headers, 'customerAccess')).kind).toBe('allowed'); // staff start with it
    const opened = await openCopy(staff.id, doc.id);
    expect(opened).toMatchObject({ ok: true, contentType: 'image/jpeg' });
    if ('ok' in opened) expect([...opened.bytes.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    const log = await db.select().from(documentAccess).where(eq(documentAccess.documentId, doc.id));
    expect(log.map((l) => l.openedBy)).toContain(staff.id);
    // Without customer access: refused, nothing logged.
    const other = await samplePerson();
    await setPermission(owner, other.id, 'customerAccess', false);
    expect(await openCopy(other.id, doc.id)).toEqual({ error: 'notAllowed' });
    expect((await db.select().from(documentAccess).where(eq(documentAccess.documentId, doc.id))).some((l) => l.openedBy === other.id)).toBe(false);
  });
});
