import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditEvent, setting, user } from '../../db/schema';

// The owner settings (system design 3.2 "Owner settings", Proposed: Dulan, 1 Nov 2026; ST-15.3, screens 15.2 and 15.7).
// Business-wide values only the primary owner changes, in three groups. A setting with no saved row has its starting
// value. Starting values: 5.1 (cutoff and deadline, "for now"), 11 (reminders, Confirmed), 16 (fuel price: no figure).
// A changed cutoff or deadline applies to new rentals only (4.3, PR-08): rentals will keep their own copy.

type TimeSetting = { group: 'dayTimes'; kind: 'time'; start: string };
type NumberSetting = { group: 'reminders' | 'fuel'; kind: 'number'; min: number; max: number; start: number | null };

export const SETTINGS = {
  pickupCutoff: { group: 'dayTimes', kind: 'time', start: '15:00' },
  returnDeadline: { group: 'dayTimes', kind: 'time', start: '08:00' },
  documentReminderDays: { group: 'reminders', kind: 'number', min: 1, max: 90, start: 30 },
  serviceReminderDays: { group: 'reminders', kind: 'number', min: 1, max: 90, start: 7 },
  serviceReminderKm: { group: 'reminders', kind: 'number', min: 100, max: 5000, start: 500 },
  payrollReminderDays: { group: 'reminders', kind: 'number', min: 1, max: 90, start: 3 },
  fuelPricePerLitre: { group: 'fuel', kind: 'number', min: 1, max: 2000, start: null },
} as const satisfies Record<string, TimeSetting | NumberSetting>;

export type SettingKey = keyof typeof SETTINGS;
export type Group = 'dayTimes' | 'reminders' | 'fuel';
export const GROUPS: Group[] = ['dayTimes', 'reminders', 'fuel'];
export const KEYS = Object.keys(SETTINGS) as SettingKey[];
export type Settings = {
  pickupCutoff: string; returnDeadline: string;
  documentReminderDays: number; serviceReminderDays: number; serviceReminderKm: number; payrollReminderDays: number;
  fuelPricePerLitre: number | null;
};
export type FieldError = 'required' | 'number' | 'range' | 'time';

export const isGroup = (g: string): g is Group => (GROUPS as string[]).includes(g);
export const isSettingKey = (k: string): k is SettingKey => Object.hasOwn(SETTINGS, k);
export const keysOf = (group: Group): SettingKey[] => KEYS.filter((k) => SETTINGS[k].group === group);

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const WHOLE = /^\d{1,6}$/;

function parse(key: SettingKey, raw: string): number | string {
  const s = SETTINGS[key] as TimeSetting | NumberSetting;
  return s.kind === 'time' ? raw : Number(raw);
}

/** Every setting: the saved value, or its starting value. Read by everyone who works at SNS (15.2). */
export async function readSettings(): Promise<Settings> {
  const rows = await db.select({ key: setting.key, value: setting.value }).from(setting);
  const values: Record<string, number | string | null> = Object.fromEntries(KEYS.map((k) => [k, SETTINGS[k].start]));
  for (const r of rows) if (isSettingKey(r.key)) values[r.key] = parse(r.key, r.value);
  return values as Settings;
}

/** The text a setting is saved as (and shown in the activity log): times as HH:MM, numbers as digits, "" for not set. */
export const asText = (v: number | string | null) => (v === null ? '' : String(v));

/** Checks the typed values of one group against the limits; other keys are ignored. */
export function checkGroup(group: Group, input: Record<string, string>):
  { ok: true; values: Record<string, string>; errors?: undefined } | { ok: false; errors: Record<string, FieldError>; values?: undefined } {
  if (!isGroup(group)) return { ok: false, errors: { group: 'unknown' as FieldError } };
  const values: Record<string, string> = {};
  const errors: Record<string, FieldError> = {};
  for (const key of keysOf(group)) {
    const s = SETTINGS[key] as TimeSetting | NumberSetting;
    const raw = String(input[key] ?? '').trim();
    if (!raw) errors[key] = 'required';
    else if (s.kind === 'time') { if (!TIME.test(raw)) errors[key] = 'time'; }
    else if (!WHOLE.test(raw)) errors[key] = 'number';
    else if (Number(raw) < s.min || Number(raw) > s.max) errors[key] = 'range';
    if (!errors[key]) values[key] = s.kind === 'time' ? raw : String(Number(raw));
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

export type ChangeResult =
  | { ok: true; changed: SettingKey[] }
  | { error: 'notAllowed' }
  | { error: 'invalid'; errors: Record<string, FieldError> }
  | { error: 'stale'; keys: SettingKey[] };

/**
 * The owner saves one group (15.7). `input` is what the form holds now; `was` is what it showed when it was opened.
 * Only the values the owner changed (input differs from was) are saved, so a form left open never puts back an older
 * value; if someone saved one of them meanwhile, nothing is saved ("stale") and the owner sees the new value first.
 * Only the primary owner, checked again in the transaction; each saved value gets one activity-log entry with the old
 * and new values (PR-05). Nothing is saved on a mistake.
 */
export async function changeGroup(actorId: string, group: Group, input: Record<string, string>, was: Record<string, string>): Promise<ChangeResult> {
  const checked = checkGroup(group, input);
  if (!checked.ok) return { error: 'invalid', errors: checked.errors };
  return db.transaction(async (tx) => {
    const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
    if (actor?.role !== 'owner' || actor.disabledAt) return { error: 'notAllowed' } as const;
    // One save at a time, also for settings with no row yet (a row lock would not cover those), so each log entry's
    // "old" is the value really replaced (#17 review).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('sns.setting'))`);
    const keys = keysOf(group).filter((k) => checked.values[k] !== String(was[k] ?? '').trim());
    const saved = new Map((keys.length ? await tx.select({ key: setting.key, value: setting.value }).from(setting).where(inArray(setting.key, keys)) : [])
      .map((r) => [r.key, r.value]));
    const current = (key: SettingKey) => saved.get(key) ?? asText(SETTINGS[key].start);
    const stale = keys.filter((k) => current(k) !== String(was[k] ?? '').trim());
    if (stale.length) return { error: 'stale', keys: stale } as const;
    const changed: SettingKey[] = [];
    for (const key of keys) {
      const old = current(key);
      const next = checked.values[key];
      if (old === next) continue;
      await tx.insert(setting).values({ key, value: next, updatedBy: actorId })
        .onConflictDoUpdate({ target: setting.key, set: { value: next, updatedBy: actorId, updatedAt: sql`now()` } });
      await tx.insert(auditEvent).values({ createdBy: actorId, action: 'setting.change', targetType: 'setting', targetId: key, details: { key, old, new: next } });
      changed.push(key);
    }
    return { ok: true, changed } as const;
  });
}
