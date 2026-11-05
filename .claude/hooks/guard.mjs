#!/usr/bin/env node
// PreToolUse: blocks edits to frozen or generated files, and risky git commands. Exit 2 = blocked, reason on stderr.
import { stdinJson, projectPath } from './hook-lib.mjs';

const input = await stdinJson();
const t = input.tool_input ?? {};
const block = (why) => { process.stderr.write(why); process.exit(2); };

if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(input.tool_name)) {
  const f = projectPath(t.file_path ?? t.notebook_path ?? '');
  if (f.startsWith('proposal/')) block('proposal/ is the approved, frozen client proposal. Change it only through change-requests/ and addenda/ (skill: sns-change-request).');
  if (f.startsWith('screens/previews/')) block('screens/previews/ is generated. Edit screens/canvas/<board>.dc.html, then run: node screens/tools/render.mjs <board> (skill: sns-screen-update).');
  if (f.startsWith('screens/canvas/ds/')) block('screens/canvas/ds/ is generated from design-system/. Edit design-system/, then run: node scripts/sync-design-copy.mjs.');
  if (f === '.claude/skills/README.md') block('.claude/skills/README.md is generated from each SKILL.md. Edit the skill, then run: node scripts/skills-index.mjs.');
}

if (input.tool_name === 'Bash') {
  // Only real command segments count: drop heredoc bodies, then split on newlines and shell separators.
  const c = String(t.command ?? '').replace(/<<-?\s*'?"?(\w+)'?"?[\s\S]*?\n\1\b/g, '');
  const segments = c.split(/\n|&&|\|\||;|\|/).map((s) => s.trim().replace(/^(cd\s+\S+\s*)/, ''));
  for (const s of segments) {
    if (/^git\s+push\b.*(--force\b|\s-f\b|--force-with-lease)/.test(s)) block('Force-pushing is blocked by the project harness. Ask the user; they run it themselves if they really want it.');
    if (/^git\s+push\b.*\s(origin\s+)?(main|master)(\s|$)/.test(s)) block('Do not push to main. Push your branch (development or a feature branch) and open a PR (skill: ship).');
    if (/^git\s+commit\b.*--no-verify/.test(s)) block('--no-verify skips the project checks. Fix the failing check instead.');
    if (/^rm\s+-[a-z]*r[a-z]*\s+(\.\/)?(proposal|brand|design-system|screens|fonts|\.git)\/?(\s|$)/.test(s)) block('Deleting a top-level project folder is blocked. Delete specific files instead, after checking what they are.');
  }
}
process.exit(0);
