import { describe, it, expect } from 'vitest';
import en from '../src/i18n/en.json';
import si from '../src/i18n/si.json';

// Screen 15.5: every action the app writes has a sentence in both languages.
const WRITTEN = ['person.add', 'person.resetPassword', 'person.turnOff', 'person.turnOn', 'person.emailChange', 'person.emailConfirmed', 'permission.grant', 'permission.remove'];
const get = (o: unknown, path: string) => path.split('.').reduce<unknown>((x, k) => (x as Record<string, unknown>)?.[k], o);

describe('activity log words', () => {
  it.each(WRITTEN)('%s reads as a sentence in Sinhala and English', (action) => {
    expect(typeof get(en, `settings.log.actions.${action}`)).toBe('string');
    expect(typeof get(si, `settings.log.actions.${action}`)).toBe('string');
  });
});
