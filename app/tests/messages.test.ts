import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// TRD › Interface and languages: si.json and en.json have the same keys; a missing word fails the build.
function keys(o: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe('language messages', () => {
  it('provides the same message keys in Sinhala and English, at every level', () => {
    const read = (locale: string) => JSON.parse(readFileSync(`src/i18n/${locale}.json`, 'utf8'));
    expect(keys(read('si')).sort()).toEqual(keys(read('en')).sort());
  });
});
