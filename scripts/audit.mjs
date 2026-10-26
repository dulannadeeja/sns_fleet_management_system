#!/usr/bin/env node
// The sync audit: checks that the documents, screens and harness files agree with each other.
//   node scripts/audit.mjs                     every check
//   node scripts/audit.mjs --only=links,at     some checks
//   node scripts/audit.mjs --files=PRD.md      link check for given files only (used by hooks)
// Exit 1 when any hard check fails. Soft findings are printed as warnings.
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, read, exists, repoFiles, listDir, anchors, isVendoredSkill, posix, canvasCopyOf, DESIGN_COPY } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const only = args.only ? new Set(args.only.split(',')) : null;
const fileArg = args.files ? args.files.split(',').map(posix) : null;
const hard = [];
const soft = [];
const run = (name, fn) => { if (!only || only.has(name)) fn(); };
const files = repoFiles();

// links: every relative markdown link points to an existing file, and its #anchor exists.
run('links', () => {
  const anchorCache = new Map();
  const anchorsOf = (f) => { if (!anchorCache.has(f)) anchorCache.set(f, anchors(read(f))); return anchorCache.get(f); };
  const targets = (fileArg ?? files).filter((f) => f.endsWith('.md') && exists(f) && !isVendoredSkill(f) && !f.startsWith('proposal/'));
  for (const f of targets) {
    let fence = false;
    read(f).split('\n').forEach((line, i) => {
      if (/^\s*```/.test(line)) fence = !fence;
      if (fence) return;
      const noCode = line.replace(/`[^`]*`/g, '');
      for (const [, url] of noCode.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|tel:)/.test(url)) continue;
        const [pathPart, anchor] = url.split('#');
        const target = pathPart ? posix(join(dirname(f), decodeURI(pathPart))) : f;
        if (pathPart && !exists(target)) { hard.push(`links: ${f}:${i + 1} → ${url} (no such file)`); continue; }
        if (anchor && target.endsWith('.md') && !anchorsOf(target).has(anchor)) hard.push(`links: ${f}:${i + 1} → ${url} (no such heading)`);
      }
    });
  }
});

// screens: boards, source files, PNG and HTML previews and the render report all list the same screens.
let boards = null;
run('screens', () => {
  const canvas = JSON.parse(read('screens/canvas/canvas.json'));
  boards = canvas.boards;
  const names = (list, ext) => new Set(list.filter((n) => n.endsWith(ext)).map((n) => n.slice(0, -ext.length)));
  const sets = {
    'canvas.json boards': new Set(Object.keys(boards).map((k) => k.replace(/\.dc\.html$/, ''))),
    'screens/canvas/*.dc.html': names(listDir('screens/canvas'), '.dc.html'),
    'screens/previews/png': names(listDir('screens/previews/png'), '.png'),
    'screens/previews/html': names(listDir('screens/previews/html'), '.html'),
    'preview-report.json': new Set(JSON.parse(read('screens/previews/preview-report.json')).map((e) => e.name)),
  };
  const ref = sets['canvas.json boards'];
  for (const [label, s] of Object.entries(sets)) {
    const missing = [...ref].filter((n) => !s.has(n));
    const extra = [...s].filter((n) => !ref.has(n));
    if (missing.length || extra.length) hard.push(`screens: ${label} differs from canvas.json (missing ${missing.join(', ') || 'none'}; extra ${extra.join(', ') || 'none'})`);
  }
  const list = Object.entries(boards);
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const [a, x] = list[i]; const [b, y] = list[j];
    if (x.page === y.page && x.x < y.x + y.w && y.x < x.x + x.w && x.y < y.y + y.h && y.y < x.y + x.h) hard.push(`screens: boards overlap on the canvas: ${a} and ${b}`);
  }
});

// counts: "N screen boards" wherever it is written matches the real count.
run('counts', () => {
  const n = Object.keys(boards ?? JSON.parse(read('screens/canvas/canvas.json')).boards).length;
  for (const f of ['README.md', 'AGENTS.md', 'SNS_SYSTEM_DESIGN.md', 'screens/README.md', 'screens/AGENTS.md']) {
    if (!exists(f)) continue;
    for (const [, k] of read(f).matchAll(/\b(\d+) screen (?:boards|designs)\b/g)) if (+k !== n) hard.push(`counts: ${f} says ${k} screens; there are ${n}`);
  }
});

// design-copy: screens/canvas/ds/plate is generated from design-system.
run('design-copy', () => {
  for (const f of DESIGN_COPY) {
    const t = `screens/canvas/ds/plate/${f}`;
    if (!exists(t) || read(t) !== canvasCopyOf(read(`design-system/${f}`))) hard.push(`design-copy: ${t} is out of step with design-system/${f}. Run: node scripts/sync-design-copy.mjs`);
  }
});

// at: every acceptance scenario is used by a PRD story, and every AT id cited exists.
run('at', () => {
  const sd = read('SNS_SYSTEM_DESIGN.md');
  const defined = new Set([...sd.matchAll(/^\| (AT-\d+) \|/gm)].map((m) => m[1]));
  const prd = exists('PRD.md') ? read('PRD.md') : '';
  for (const id of defined) if (!new RegExp(`\\b${id}\\b`).test(prd)) hard.push(`at: ${id} is in the system design but no PRD story uses it`);
  for (const f of ['PRD.md', 'TRD.md']) if (exists(f)) for (const [id] of read(f).matchAll(/\bAT-\d+\b/g)) if (!defined.has(id)) hard.push(`at: ${f} cites ${id}, which the system design does not define`);
});

// agent-files: every AGENTS.md has a CLAUDE.md beside it that imports it.
run('agent-files', () => {
  for (const f of files.filter((p) => /(^|\/)AGENTS\.md$/.test(p) && !isVendoredSkill(p))) {
    const c = posix(join(dirname(f), 'CLAUDE.md'));
    if (!exists(c) || !/^@AGENTS\.md\s*$/m.test(read(c))) hard.push(`agent-files: ${c} must exist and import @AGENTS.md`);
    const lines = read(f).split('\n').length;
    const limit = f === 'AGENTS.md' ? 120 : 70;
    if (lines > limit) soft.push(`agent-files: ${f} has ${lines} lines (keep under ${limit}; move detail into a skill or a nested AGENTS.md)`);
  }
  if (exists('GEMINI.md') && !/^@AGENTS\.md\s*$/m.test(read('GEMINI.md'))) hard.push('agent-files: GEMINI.md must import @AGENTS.md');
});

// skills: every skill folder has a SKILL.md whose name matches the folder and has a description.
run('skills', () => {
  for (const d of [...new Set(files.filter((f) => f.startsWith('.claude/skills/')).map((f) => f.split('/')[2]))]) {
    const p = `.claude/skills/${d}/SKILL.md`;
    if (!exists(p)) { if (exists(`.claude/skills/${d}`) && d !== 'README.md' && d !== 'AGENTS.md' && d !== 'CLAUDE.md') hard.push(`skills: ${d} has no SKILL.md`); continue; }
    const fm = /^---\n([\s\S]*?)\n---/.exec(read(p))?.[1] ?? '';
    const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
    if (name !== d) hard.push(`skills: ${p} name is "${name}", folder is "${d}"`);
    if (!/^description:/m.test(fm)) hard.push(`skills: ${p} has no description`);
    const lines = read(p).split('\n').length;
    if (!isVendoredSkill(p) && lines > 500) soft.push(`skills: ${p} has ${lines} lines (keep under 500; move detail to reference files)`);
  }
});

// skills-index: .claude/skills/README.md is generated from the skills.
run('skills-index', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts/skills-index.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) hard.push('skills-index: .claude/skills/README.md is out of date. Run: node scripts/skills-index.mjs');
});

for (const w of soft) console.log(`warn  ${w}`);
for (const e of hard) console.log(`FAIL  ${e}`);
console.log(hard.length ? `\nAudit failed: ${hard.length} problem(s).` : `Audit passed${soft.length ? ` with ${soft.length} warning(s)` : ''}.`);
process.exit(hard.length ? 1 : 0);
