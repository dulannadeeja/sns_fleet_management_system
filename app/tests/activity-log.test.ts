import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../src/db/client';
import { auditEvent } from '../src/db/schema';
import { accessFor } from '../src/auth/access';
import * as activity from '../src/modules/activity/activity';
import { setPermission, turnOff } from '../src/modules/people/people';
import { samplePerson, signedInSample, theOwner } from './helpers/people';

// ST-15.4 Activity log (screen 15.5). Each test reads only its own sample entries (by the record they are about);
// the log is insert-only, so nothing is ever cleaned up and no test counts the whole table.
const sample = async (tag: string, action: string, at?: Date, details?: Record<string, unknown>) =>
  db.insert(auditEvent).values({ action, targetType: 'sample', targetId: tag, details: details ?? null, ...(at ? { createdAt: at } : {}) });

describe('ST-15.4: the activity log', () => {
  it('lists entries newest first, with who acted and on whom, and the reason', async () => {
    const owner = await theOwner();
    const s = await samplePerson();
    await setPermission(owner, s.id, 'exportReports', true);
    await turnOff(owner, s.id, 'Sample: left SNS');
    const { entries } = await activity.listActivity({ targetId: s.id });
    expect(entries.map((e) => e.action)).toEqual(['person.turnOff', 'permission.grant', 'person.add']);
    expect(entries[0]).toMatchObject({ actorId: owner, targetName: expect.stringContaining('Sample'), reason: 'Sample: left SNS', kind: 'settings' });
    expect(entries[2].actorName).toBeNull(); // added by the setup script: shown as the system
    expect((await activity.listActivity({ targetId: s.id, personId: owner })).entries).toHaveLength(2);
  });

  it('"Older" shows every entry once, even several at exactly the same time (#16 review)', async () => {
    const tag = randomUUID();
    const at = new Date(Date.now() - 5000);
    for (let i = 0; i < 3; i++) await sample(tag, 'sample.same-time', at);
    await sample(tag, 'sample.earlier', new Date(at.getTime() - 1000));
    const seen: string[] = [];
    let older: string | undefined;
    for (let page = 0; page < 5; page++) {
      const r = await activity.listActivity({ targetId: tag, limit: 1, older });
      seen.push(...r.entries.map((e) => e.id));
      if (!r.older) break;
      older = r.older;
    }
    expect(seen).toHaveLength(4);
    expect(new Set(seen).size).toBe(4);
  });

  it('filters by kind, from the action name; "decisions" are entries with a reason', async () => {
    const tag = randomUUID();
    await sample(tag, 'payment.record');
    await sample(tag, 'customer.flag', undefined, { reason: 'Sample reason' });
    await sample(tag, 'vehicle.status');
    const of = async (kind: activity.Kind) => (await activity.listActivity({ targetId: tag, kind })).entries.map((e) => e.action);
    expect(await of('money')).toEqual(['payment.record']);
    expect(await of('customers')).toEqual(['customer.flag']);
    expect(await of('cars')).toEqual(['vehicle.status']);
    expect(await of('decisions')).toEqual(['customer.flag']);
    expect(await of('settings')).toEqual([]);
  });

  it('a broken "Older" link is ignored, not an error', () => {
    expect(activity.readCursor('not-a-cursor')).toBeNull();
    expect(activity.readCursor(Buffer.from("2026-11-01 10:00:00+05:30|x'); drop table user;--").toString('base64url'))).toBeNull();
  });

  it('the log can only be read: the module offers no way to change or delete an entry (Derived control)', () => {
    expect(Object.keys(activity).sort()).toEqual(['KINDS', 'kindOf', 'listActivity', 'peopleForFilter', 'readCursor']);
  });

  it('the owner and the admin may open it (DN-01); staff may not', async () => {
    const staff = await signedInSample('staff');
    expect((await accessFor(staff.headers, 'seeActivityLog')).kind).toBe('denied');
    const admin = await signedInSample('admin');
    expect((await accessFor(admin.headers, 'seeActivityLog')).kind).toBe('allowed');
    const { allows } = await import('../src/auth/permissions');
    expect(allows({ role: 'owner', disabledAt: null }, new Set(), 'seeActivityLog')).toBe(true);
  });
});
