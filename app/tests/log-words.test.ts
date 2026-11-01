import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from '../src/i18n/en.json';
import si from '../src/i18n/si.json';

// Screen 15.5: every action the app writes to the log has a sentence in both languages. The actions are read from
// the code that writes the log (src/modules, src/auth), so a new one without words fails here (#16 review).
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
}
const WRITTEN = [...new Set([...files('src/modules'), ...files('src/auth')].filter((f) => /\.tsx?$/.test(f))
  .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/'((?:person|permission|payment|customer|vehicle|car|setting)\.[a-zA-Z]+)'/g)].map((m) => m[1])))];
const get = (o: unknown, path: string) => path.split('.').reduce<unknown>((x, k) => (x as Record<string, unknown>)?.[k], o);

describe('activity log words', () => {
  it('finds the actions the code writes', () => expect(WRITTEN.length).toBeGreaterThan(5));
  it.each(WRITTEN)('%s reads as a sentence in Sinhala and English', (action) => {
    expect(typeof get(en, `settings.log.actions.${action}`)).toBe('string');
    expect(typeof get(si, `settings.log.actions.${action}`)).toBe('string');
  });
});
