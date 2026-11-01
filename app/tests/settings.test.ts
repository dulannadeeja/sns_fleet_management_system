import { describe, it, expect } from 'vitest';
import { GROUPS, SETTINGS, changeGroup, checkGroup, readSettings } from '../src/modules/settings/settings';
import { theOwner } from './helpers/people';

// ST-15.3 Business rules: the owner settings, their limits and the check before saving (system design 3.2 "Owner
// settings", Proposed: Dulan, 1 Nov 2026). Only the fuel price is changed here (AT-45 changes the insurance reminder),
// and it is put back afterwards; the day times are only checked, never saved, since other tests may read them.
const reminders = { documentReminderDays: '30', serviceReminderDays: '7', serviceReminderKm: '500', payrollReminderDays: '3' };

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

  it('saves only what changed, and nothing for an unchanged form or a mistake', async () => {
    const owner = await theOwner();
    const before = (await readSettings()).fuelPricePerLitre;
    const next = before === 370 ? 371 : 370;
    try {
      expect(await changeGroup(owner, 'fuel', { fuelPricePerLitre: '0' })).toEqual({ error: 'invalid', errors: { fuelPricePerLitre: 'range' } });
      expect(await changeGroup(owner, 'fuel', { fuelPricePerLitre: String(next) })).toEqual({ ok: true, changed: ['fuelPricePerLitre'] });
      expect(await changeGroup(owner, 'fuel', { fuelPricePerLitre: String(next) })).toEqual({ ok: true, changed: [] });
      expect((await readSettings()).fuelPricePerLitre).toBe(next);
    } finally {
      if (before !== null) await changeGroup(owner, 'fuel', { fuelPricePerLitre: String(before) });
    }
  });
});
