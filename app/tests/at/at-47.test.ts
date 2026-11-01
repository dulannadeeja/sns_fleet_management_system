import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { auditEvent, session } from '../../src/db/schema';
import { signedInPerson } from '../../src/auth/first-sign-in';
import { turnOff, turnOn } from '../../src/modules/people/people';
import { person, signIn, signedInSample, theOwner } from '../helpers/people';

// AT-47 "The owner turns off the account of a staff member who left: they can no longer sign in; everything they
// recorded keeps their name" (system design 3.1 "Turning off an account"; TRD §6: sessions end at once).
describe('AT-47: a turned-off account cannot sign in; its records keep the name', () => {
  it('ends their sessions at once and refuses sign-in with the usual answer', async () => {
    const staff = await signedInSample('staff');
    const owner = await theOwner();
    // Something the staff member recorded earlier (an activity-log entry stands in for any record).
    const [recorded] = await db.insert(auditEvent).values({ createdBy: staff.id, action: 'sample.recorded' }).returning();

    expect(await turnOff(owner, staff.id, 'Left SNS')).toEqual({ ok: true });
    expect(await signedInPerson(staff.headers)).toBeNull();
    expect(await db.select().from(session).where(eq(session.userId, staff.id))).toHaveLength(0);

    const tried = await signIn(staff.phone, staff.password);
    expect(tried.status).toBe(401);
    expect((await tried.json()).code).toBe('INVALID_PHONE_NUMBER_OR_PASSWORD');

    const [kept] = await db.select().from(auditEvent).where(eq(auditEvent.id, recorded.id));
    expect(kept.createdBy).toBe(staff.id);
    expect((await person(staff.id)).name).toBeTruthy();
  });

  it('needs a reason, is logged with who and why, and can be turned back on', async () => {
    const staff = await signedInSample('staff');
    const owner = await theOwner();
    expect(await turnOff(owner, staff.id, '   ')).toEqual({ error: 'reasonMissing' });
    expect(await turnOff(owner, staff.id, 'Left SNS')).toEqual({ ok: true });
    expect(await turnOff(owner, staff.id, 'again')).toEqual({ error: 'alreadyOff' });
    const [logged] = await db.select().from(auditEvent).where(and(eq(auditEvent.targetId, staff.id), eq(auditEvent.action, 'person.turnOff')));
    expect(logged).toMatchObject({ createdBy: owner, details: { reason: 'Left SNS' } });

    expect(await turnOn(owner, staff.id)).toEqual({ ok: true });
    expect((await signIn(staff.phone, staff.password)).status).toBe(200);
  });

  it('the owner cannot be turned off', async () => {
    const owner = await theOwner();
    expect(await turnOff(owner, owner, 'no')).toEqual({ error: 'isOwner' });
  });
});
