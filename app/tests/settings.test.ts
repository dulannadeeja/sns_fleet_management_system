import { describe, it, expect } from 'vitest';
import { GROUPS, SETTINGS, asText, changeGroup, checkGroup, readSettings } from '../src/modules/settings/settings';
import { theOwner } from './helpers/people';

// ST-15.3 Business rules: the owner settings, their limits and the check before saving (system design 3.2 "Owner
// settings", Proposed: Dulan, 1 Nov 2026). Settings are shared by the whole test database: this file saves only the
// service reminder in days (AT-45 changes the insurance reminder, the browser test the payroll reminder and the
// service km) and puts it back; the fuel price is never saved here, so it stays as the database has it.
const reminders = { documentReminderDays: '30', serviceReminderDays: '7', serviceReminderKm: '500', payrollReminderDays: '3' };
const remindersNow = async () => {
  const s = await readSettings();
  return { documentReminderDays: asText(s.documentReminderDays), serviceReminderDays: asText(s.serviceReminderDays), serviceReminderKm: asText(s.serviceReminderKm), payrollReminderDays: asText(s.payrollReminderDays) };
};

describe('ST-15.3: owner settings', () => {
  it('has the agreed starting values and three groups', () => {
    expect(Object.fromEntries(Object.entries(SETTINGS).map(([k, s]) => [k, s.start]))).toEqual({
      pickupCutoff: '15:00', returnDeadline: '08:00',
      documentReminderDays: 30, serviceReminderDays: 7, serviceReminderKm: 500, payrollReminderDays: 3,
      fuelPricePerLitre: null,
    });
    expect(GROUPS).toEqual(['dayTimes', 'reminders', 'fuel']);
  });

  it('keeps every value inside its limits', () => {
    expect(checkGroup('reminders', reminders)).toEqual({ ok: true, values: reminders });
    expect(checkGroup('reminders', { ...reminders, documentReminderDays: '0' }).errors).toEqual({ documentReminderDays: 'range' });
    expect(checkGroup('reminders', { ...reminders, payrollReminderDays: '91' }).errors).toEqual({ payrollReminderDays: 'range' });
    expect(checkGroup('reminders', { ...reminders, serviceReminderKm: '99' }).errors).toEqual({ serviceReminderKm: 'range' });
    expect(checkGroup('reminders', { ...reminders, serviceReminderKm: '5001' }).errors).toEqual({ serviceReminderKm: 'range' });
    expect(checkGroup('reminders', { ...reminders, serviceReminderKm: '1,000' }).errors).toEqual({ serviceReminderKm: 'number' });
    expect(checkGroup('reminders', { ...reminders, serviceDays: '7' } as never).ok).toBe(true); // unknown keys are ignored
    expect(checkGroup('reminders', { ...reminders, serviceReminderDays: '' }).errors).toEqual({ serviceReminderDays: 'required' });
    expect(checkGroup('fuel', { fuelPricePerLitre: '2000' }).ok).toBe(true);
    expect(checkGroup('fuel', { fuelPricePerLitre: '2001' }).errors).toEqual({ fuelPricePerLitre: 'range' });
    expect(checkGroup('fuel', { fuelPricePerLitre: '350.50' }).errors).toEqual({ fuelPricePerLitre: 'number' }); // whole rupees
    expect(checkGroup('dayTimes', { pickupCutoff: '14:30', returnDeadline: '07:05' }).ok).toBe(true);
    expect(checkGroup('dayTimes', { pickupCutoff: '24:00', returnDeadline: '7:5' }).errors).toEqual({ pickupCutoff: 'time', returnDeadline: 'time' });
    expect(checkGroup('nothing' as never, {}).errors).toEqual({ group: 'unknown' });
  });

  it('saves only what the owner changed; a form left open never puts back an older value (#17 review)', async () => {
    const owner = await theOwner();
    const opened = await remindersNow(); // two tabs open the reminders page
    const before = opened.serviceReminderDays;
    const next = before === '8' ? '9' : '8';
    try {
      expect(await changeGroup(owner, 'fuel', { fuelPricePerLitre: '0' }, { fuelPricePerLitre: '' })).toEqual({ error: 'invalid', errors: { fuelPricePerLitre: 'range' } });
      expect(await changeGroup(owner, 'reminders', opened, opened)).toEqual({ ok: true, changed: [] }); // nothing changed
      // Tab A saves the service days.
      expect(await changeGroup(owner, 'reminders', { ...opened, serviceReminderDays: next }, opened)).toEqual({ ok: true, changed: ['serviceReminderDays'] });
      // Tab B, opened before, saves nothing new: the service days it still shows are not put back.
      expect(await changeGroup(owner, 'reminders', opened, opened)).toEqual({ ok: true, changed: [] });
      expect((await readSettings()).serviceReminderDays).toBe(Number(next));
      // Tab B now changes the service days too: refused, since it shows an old value; nothing is saved.
      expect(await changeGroup(owner, 'reminders', { ...opened, serviceReminderDays: '12' }, opened)).toEqual({ error: 'stale', keys: ['serviceReminderDays'] });
      expect((await readSettings()).serviceReminderDays).toBe(Number(next));
    } finally {
      const now = await remindersNow();
      await changeGroup(owner, 'reminders', { ...now, serviceReminderDays: before }, now);
    }
    expect(asText((await readSettings()).serviceReminderDays)).toBe(before);
  });
});
