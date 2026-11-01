import { describe, it, expect } from 'vitest';
import { pickLocale } from '../src/i18n/locale';

describe('pickLocale (PR-01)', () => {
  it('is Sinhala when nothing is chosen', () => expect(pickLocale(undefined, undefined)).toBe('si'));
  it('follows the sign-in page choice before signing in', () => expect(pickLocale(undefined, 'en')).toBe('en'));
  it("the person's saved language wins over the cookie", () => expect(pickLocale('si', 'en')).toBe('si'));
  it('anything unknown is Sinhala', () => expect(pickLocale(undefined, 'fr')).toBe('si'));
});
