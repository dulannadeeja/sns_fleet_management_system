import { describe, it, expect } from 'vitest';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { auditEvent, user } from '../../src/db/schema';
import { accessFor } from '../../src/auth/access';
import { SETTINGS, changeGroup, readSettings } from '../../src/modules/settings/settings';
import { signedInSample, theOwner } from '../helpers/people';

// AT-45, the settings part only (PARTIAL: the reminders themselves come in Phase 3): "A car's insurance expires in
// 30 days, with the starting reminder settings: it appears in Upcoming work; the owner can change how early."
// System design 11 (reminders, Confirmed) and 3.2 "Owner settings" (Proposed: Dulan, 1 Nov 2026).
// Settings are shared by the whole test database: this file alone changes the insurance and licence reminder, and puts
// back what it found. Only the value a form changes is saved, so the other reminders are never written here.
describe('AT-45 (settings part, partial): the owner can change how early the insurance reminder starts', () => {
  it('starts at 30 days; the owner changes it; the log keeps the old and new values', async () => {
    expect(SETTINGS.documentReminderDays.start).toBe(30);
    const owner = await theOwner();
    const before = (await readSettings()).documentReminderDays;
    const next = before === 45 ? 46 : 45;
    try {
      const was = await asForm();
      const result = await changeGroup(owner, 'reminders', { ...was, documentReminderDays: String(next) }, was);
      expect(result).toEqual({ ok: true, changed: ['documentReminderDays'] });
      expect((await readSettings()).documentReminderDays).toBe(next);
      const [entry] = await db.select().from(auditEvent)
        .where(and(eq(auditEvent.action, 'setting.change'), eq(auditEvent.targetId, 'documentReminderDays'), eq(auditEvent.createdBy, owner)))
        .orderBy(desc(auditEvent.createdAt)).limit(1);
      expect(entry.details).toEqual({ key: 'documentReminderDays', old: String(before), new: String(next) });
    } finally {
      const was = await asForm();
      await changeGroup(owner, 'reminders', { ...was, documentReminderDays: String(before) }, was);
    }
    expect((await readSettings()).documentReminderDays).toBe(before);
  });

  it('the admin and staff can read the settings but never change them, even called directly', async () => {
    for (const role of ['admin', 'staff'] as const) {
      const p = await signedInSample(role);
      expect((await accessFor(p.headers, 'employee')).kind).toBe('allowed');
      expect((await accessFor(p.headers, 'owner')).kind).toBe('denied');
      const was = await asForm();
      expect(await changeGroup(p.id, 'reminders', { ...was, documentReminderDays: '60' }, was)).toEqual({ error: 'notAllowed' });
    }
  });

  it('a partner cannot even read them', async () => {
    // Partner accounts come with Partners (#15); a sample staff account turned into a partner stands in for one.
    const p = await signedInSample('staff');
    await db.update(user).set({ role: 'partner' }).where(eq(user.id, p.id));
    expect((await accessFor(p.headers, 'employee')).kind).toBe('denied');
  });
});

async function asForm(): Promise<Record<string, string>> {
  const s = await readSettings();
  return { documentReminderDays: String(s.documentReminderDays), serviceReminderDays: String(s.serviceReminderDays), serviceReminderKm: String(s.serviceReminderKm), payrollReminderDays: String(s.payrollReminderDays) };
}
