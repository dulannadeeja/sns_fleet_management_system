// How an owner setting is shown (15.2, 15.7 and the activity log), from its saved text: used on the server and in the
// browser, so it has no server imports. Times as the person's language writes them; rupees and km with separators.
export type SettingWords = { days: string; km: string; rupees: string; notSet: string };

const TIMES = new Set(['pickupCutoff', 'returnDeadline']);
const UNIT: Record<string, keyof SettingWords> = {
  documentReminderDays: 'days', serviceReminderDays: 'days', payrollReminderDays: 'days', serviceReminderKm: 'km', fuelPricePerLitre: 'rupees',
};

export function showTime(text: string, lang: string): string {
  const [h, m] = text.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return text;
  return new Intl.DateTimeFormat(lang === 'si' ? 'si-LK' : 'en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(1970, 0, 1, h, m)));
}

export function showNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/** One setting's saved text as people read it; "" (never set) as "not set yet"; anything unexpected as it is. */
export function showSetting(key: string, text: string, w: SettingWords, lang: string): string {
  if (text === '') return w.notSet;
  if (TIMES.has(key)) return showTime(text, lang);
  const unit = UNIT[key];
  return unit && /^\d+$/.test(text) ? w[unit].replace('{n}', showNumber(Number(text))) : text;
}
