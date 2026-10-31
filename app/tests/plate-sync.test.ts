import { describe, it, expect, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// TRD › Interface: the app's Plate tokens and styles must never differ from design-system/.
const run = (...args: string[]) => execFileSync('node', ['scripts/sync-plate.mjs', ...args], { encoding: 'utf8', stdio: 'pipe' });
const tokens = 'src/ui/plate/tokens.css';

describe('sync-plate', () => {
  afterAll(() => run());

  it('copies the design system so the check passes', () => {
    run();
    expect(readFileSync(tokens, 'utf8')).toBe(readFileSync('../design-system/tokens.css', 'utf8'));
    expect(() => run('--check')).not.toThrow();
  });

  it('fails the check when a copy differs from the design system', () => {
    writeFileSync(tokens, readFileSync(tokens, 'utf8') + '\n/* changed */\n');
    expect(() => run('--check')).toThrow(/differs|stale/);
  });

  it('keeps the component styles but not their font imports', () => {
    run();
    const css = readFileSync('src/ui/plate/plate.css', 'utf8');
    expect(css).toContain('.rt-side {');
    expect(css).not.toMatch(/@import/);
  });
});
