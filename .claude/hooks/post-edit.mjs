#!/usr/bin/env node
// PostToolUse (Edit/Write): keeps generated and global files in sync, and tells the agent what the edit now requires.
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { stdinJson, projectPath, runNode, context, ROOT } from './hook-lib.mjs';

const input = await stdinJson();
const f = projectPath(input.tool_input?.file_path ?? '');
if (!f) process.exit(0);
const notes = [];

// design-system master changed: regenerate the canvas copy.
if (/^design-system\/(tokens\.(css|json)|components\/bundle\.(css|js))$/.test(f)) {
  const r = runNode('scripts/sync-design-copy.mjs');
  notes.push(`Design copy: ${r.out}`);
  if (f === 'design-system/tokens.json' || f === 'design-system/tokens.css') notes.push('tokens.json and tokens.css must say the same thing; update the other one in this change.');
  notes.push('Re-render the screens that use what changed (node screens/tools/render.mjs --all if unsure) and refresh both claude.ai viewers.');
}

// a skill changed: regenerate the skills index.
if (/^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(f)) notes.push(`Skills index: ${runNode('scripts/skills-index.mjs').out}`);

// a new AGENTS.md: give it its CLAUDE.md import so Claude Code loads it.
if (/(^|\/)AGENTS\.md$/.test(f)) {
  const c = join(ROOT, dirname(f), 'CLAUDE.md');
  if (!existsSync(c)) { writeFileSync(c, '@AGENTS.md\n'); notes.push(`Created ${projectPath(c)} importing @AGENTS.md.`); }
  else if (!/^@AGENTS\.md\s*$/m.test(readFileSync(c, 'utf8'))) notes.push(`${projectPath(c)} does not import @AGENTS.md; add that line.`);
}

// markdown: check its links now, not at the end.
if (f.endsWith('.md')) {
  const r = runNode('scripts/audit.mjs', ['--only=links', `--files=${f}`]);
  if (!r.ok) notes.push(`Broken links in ${f}:\n${r.out}`);
}

// rank order reminders (sns-change-control).
const below = {
  'SNS_SYSTEM_DESIGN.md': 'You changed the source of truth. Carry the change down in rank order: PRD.md, TRD.md, brand/guidebook, design-system, screens, agent files, code (skill: sns-change-control).',
  'PRD.md': 'You changed the PRD. It must not add a rule the system design lacks. Carry the change down: TRD.md, screens, code.',
  'TRD.md': 'You changed the TRD. Check app/ code and app/AGENTS.md still match it.',
};
if (below[f]) notes.push(below[f]);
if (/^screens\/canvas\/[^/]+\.dc\.html$/.test(f)) notes.push(`Screen source changed. Render it: node screens/tools/render.mjs ${f.split('/').pop().replace('.dc.html', '')}; then refresh the canvas viewer (skill: sns-screen-update).`);
if (/^brand\/guidebook\//.test(f)) notes.push('Guidebook changed (rank 4). If a visual rule changed, update design-system/ and the screens that show it.');

if (notes.length) context('PostToolUse', notes.join('\n'));
process.exit(0);
