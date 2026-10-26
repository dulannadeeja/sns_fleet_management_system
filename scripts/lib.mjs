// Shared helpers for the repository scripts. Node 20+, no dependencies, works on Windows, macOS and Linux.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const exists = (p) => existsSync(join(ROOT, p));
export const posix = (p) => p.split(sep).join('/');
export const rel = (abs) => posix(relative(ROOT, abs));

/** Files tracked by git plus untracked, not-ignored files. */
export function repoFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });
  return [...new Set(out.split('\n').filter(Boolean))].filter((f) => exists(f));
}

export function listDir(p) {
  const abs = join(ROOT, p);
  return existsSync(abs) ? readdirSync(abs).filter((n) => statSync(join(abs, n)).isFile()) : [];
}

/** GitHub-style heading anchor. */
export function slug(heading) {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, '-');
}

/** All anchors of a markdown file, with GitHub's -1, -2 suffixes for repeats. */
export function anchors(text) {
  const seen = new Map();
  const out = new Set();
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const base = slug(m[1].replace(/`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'));
    const n = seen.get(base) ?? 0;
    out.add(n ? `${base}-${n}` : base);
    seen.set(base, n + 1);
  }
  return out;
}

/** Skill folders copied from outside projects carry LICENSE.txt and are checked less strictly. */
export const isVendoredSkill = (file) => {
  const m = /^\.claude\/skills\/([^/]+)\//.exec(file);
  return m ? exists(`.claude/skills/${m[1]}/LICENSE.txt`) || m[1] === 'impeccable' : false;
};

/** design-system file -> the canvas copy's content (image paths prefixed with ../../). */
export function canvasCopyOf(text) {
  return text.replace(/(['"])(brand|design-system)\//g, '$1../../$2/');
}
export const DESIGN_COPY = ['tokens.css', 'tokens.json', 'components/bundle.css', 'components/bundle.js'];
