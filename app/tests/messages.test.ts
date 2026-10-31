import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('language messages', () => {
  it('provides the same message keys in Sinhala and English', () => {
    const read = (locale: string) => JSON.parse(readFileSync(`src/i18n/${locale}.json`, 'utf8'));
    expect(Object.keys(read('si')).sort()).toEqual(Object.keys(read('en')).sort());
  });
});
