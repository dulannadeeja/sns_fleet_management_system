import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { and, eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { auditEvent, user } from '../../src/db/schema';
import { addCustomer } from '../../src/modules/customers/customers';
import { addFlag, closeFlag, flagsOf, warningsFor } from '../../src/modules/customers/flags';
import { samplePerson, theOwner } from '../helpers/people';
import { sampleCustomer } from '../helpers/customers';

// AT-48: "Staff close a customer's flag with a reason: no warning at the next rental; the flag, its reason, who closed it
// and when stay in the customer's history." System design 6 (Confirmed). The warning is read where New rental will read
// it (warningsFor; New rental itself comes in Phase 2).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('AT-48: closing a flag stops the warning and keeps the history', () => {
  it('a staff member flags, then closes it with a reason; it no longer warns; who, when and why stay', async () => {
    const added = await addCustomer(await theOwner(), sampleCustomer());
    if (!('ok' in added)) throw new Error('sample customer not added');
    const staff = await samplePerson();
    const flag = await addFlag(staff.id, added.id, { kind: 'unpaid', details: 'Sample: LKR 8,500 not paid after R-0197' });
    if (!('ok' in flag)) throw new Error(flag.error);
    expect((await warningsFor(added.id))!.openFlags.map((f) => f.id)).toEqual([flag.id]);

    expect(await closeFlag(staff.id, flag.id, '  ')).toEqual({ error: 'reasonMissing' });
    // A flag closes only from its own customer's page.
    const other = await addCustomer(await theOwner(), sampleCustomer());
    if (!('ok' in other)) throw new Error('sample customer not added');
    expect(await closeFlag(staff.id, flag.id, 'Sample', other.id)).toEqual({ error: 'notFound' });
    expect(await closeFlag(staff.id, flag.id, 'Sample: paid in full on 3 Nov')).toEqual({ ok: true, id: flag.id });
    expect((await warningsFor(added.id))!.openFlags).toEqual([]); // no warning at the next rental
    expect(await closeFlag(staff.id, flag.id, 'again')).toEqual({ error: 'alreadyClosed' });

    const [kept] = await flagsOf(added.id);
    expect(kept).toMatchObject({ id: flag.id, kind: 'unpaid', details: 'Sample: LKR 8,500 not paid after R-0197', closeReason: 'Sample: paid in full on 3 Nov', closedByName: (await db.select({ n: user.name }).from(user).where(eq(user.id, staff.id)))[0].n });
    expect(kept.closedAt).toBeInstanceOf(Date);
    const log = await db.select().from(auditEvent).where(and(eq(auditEvent.targetId, added.id), eq(auditEvent.action, 'customer.flagClose')));
    expect(log[0].details).toMatchObject({ kind: 'unpaid', reason: 'Sample: paid in full on 3 Nov' });
    // Nothing is deleted, and a closed flag is never reopened or rewritten.
    await expect(pool.query('delete from customer_flag where id = $1', [flag.id])).rejects.toThrow(/insert-only/);
    await expect(pool.query('update customer_flag set closed_at = null, closed_by = null, close_reason = null where id = $1', [flag.id])).rejects.toThrow(/insert-only/);
  });
});
