import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// TRD › Interface: the app's Plate tokens and styles must never differ from design-system/. Runs in its own folder,
// so the copies the app and other tests use are never touched.
const root = mkdtempSync(join(tmpdir(), 'sync-plate-'));
const run = (...args: string[]) =>
  execFileSync('node', ['scripts/sync-plate.mjs', ...args], { encoding: 'utf8', stdio: 'pipe', env: { ...process.env, SYNC_PLATE_ROOT: root } });
const copy = (p: string) => join(root, p);

beforeAll(() => run());
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('sync-plate', () => {
  it('copies the design system, and the check passes', () => {
    expect(readFileSync(copy('src/ui/plate/tokens.css'), 'utf8')).toBe(readFileSync('../design-system/tokens.css', 'utf8'));
    expect(() => run('--check')).not.toThrow();
  });

  it('fails the check when a token in a copy differs', () => {
    const p = copy('src/ui/plate/tokens.css');
    writeFileSync(p, readFileSync(p, 'utf8').replace('--paper: #eef1f0;', '--paper: #ffffff;'));
    expect(() => run('--check')).toThrow(/stale/);
    run();
  });

  it('keeps the component styles but not their font imports', () => {
    const css = readFileSync(copy('src/ui/plate/plate.css'), 'utf8');
    expect(css).toContain('.rt-side {');
    expect(css).not.toMatch(/@import/);
  });

  it('writes every icon name from the design system as a type', () => {
    const ts = readFileSync(copy('src/ui/plate/icons.ts'), 'utf8');
    const generated = /export type IconName = ([^;]+);/.exec(ts)![1].match(/'(\w+)'/g)!.map((s) => s.slice(1, -1)).sort();
    const dts = readFileSync('../design-system/components/index.d.ts', 'utf8');
    const declared = /export type IconName = ([^;]+);/.exec(dts)![1].match(/'(\w+)'/g)!.map((s) => s.slice(1, -1)).sort();
    expect(generated).toEqual(declared);
  });
});
