import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../src/db/client';
import { auditEvent } from '../src/db/schema';
import { accessFor } from '../src/auth/access';
import * as activity from '../src/modules/activity/activity';
import { setPermission, turnOff } from '../src/modules/people/people';
import { samplePerson, signedInSample, theOwner } from './helpers/people';

// ST-15.4 Activity log (screen 15.5). The tests only add their own sample entries and never count the whole table.
describe('ST-15.4: the activity log', () => {
  it('lists entries newest first, with who acted and on whom, and the reason', async () => {
    const owner = await theOwner();
    const s = await samplePerson();
    await setPermission(owner, s.id, 'exportReports', true);
    await turnOff(owner, s.id, 'Sample: left SNS');
    const page = await activity.listActivity({ personId: owner, limit: 200 });
    const mine = page.entries.filter((e) => e.targetId === s.id);
    // Filtered by the owner: the sample was added by the setup script (no actor), so its "added" entry is not here.
    expect(mine.map((e) => e.action)).toEqual(['person.turnOff', 'permission.grant']);
    expect(mine[0]).toMatchObject({ actorName: expect.any(String), targetName: expect.stringContaining('Sample'), reason: 'Sample: left SNS', kind: 'settings' });
  });

  it('filters by kind: decisions with a reason', async () => {
    const owner = await theOwner();
    const s = await samplePerson();
    await turnOff(owner, s.id, 'Sample: a reason');
    const page = await activity.listActivity({ kind: 'decisions', limit: 200 });
    expect(page.entries.every((e) => e.reason)).toBe(true);
    expect(page.entries.some((e) => e.targetId === s.id)).toBe(true);
  });

  it('pages: "Older" continues after the last entry shown', async () => {
    const tag = randomUUID();
    for (let i = 0; i < 3; i++) {
      await db.insert(auditEvent).values({ action: 'sample.entry', targetType: 'sample', targetId: tag, createdAt: new Date(Date.now() - (10 - i) * 1000) });
    }
    const first = await activity.listActivity({ limit: 1 });
    expect(first.entries).toHaveLength(1);
    expect(first.older).toBeTruthy();
    const next = await activity.listActivity({ limit: 1, before: first.older! });
    expect(next.entries[0].createdAt.getTime()).toBeLessThanOrEqual(first.entries[0].createdAt.getTime());
  });

  it('the system has no name: an entry without an actor shows as the system', async () => {
    const tag = randomUUID();
    await db.insert(auditEvent).values({ action: 'sample.system', targetType: 'sample', targetId: tag });
    const page = await activity.listActivity({ limit: 50 });
    expect(page.entries.find((e) => e.targetId === tag)?.actorName).toBeNull();
  });

  it('the log can only be read: the module offers no way to change or delete an entry (Derived control)', () => {
    expect(Object.keys(activity).sort()).toEqual(['KINDS', 'kindOf', 'listActivity', 'peopleForFilter']);
  });

  it('staff cannot open it; the admin can by default (DN-01)', async () => {
    const staff = await signedInSample('staff');
    expect((await accessFor(staff.headers, 'seeActivityLog')).kind).toBe('denied');
    const admin = await signedInSample('admin');
    expect((await accessFor(admin.headers, 'seeActivityLog')).kind).toBe('allowed');
  });
});
