#!/usr/bin/env node
// SessionStart: records the session's model for the model advisor, and gives a short orientation.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { stdinJson, context, stateFile, runNode, ROOT } from './hook-lib.mjs';

const input = await stdinJson();
const model = typeof input.model === 'string' ? input.model : input.model?.id ?? '';
try { writeFileSync(stateFile(input.session_id), JSON.stringify({ model })); } catch {}
const git = (a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return '?'; } };
const audit = runNode('scripts/audit.mjs');
const lines = [
  `SNS project harness. Branch ${git(['branch', '--show-current'])}; last commit: ${git(['log', '-1', '--format=%h %s'])}.`,
  `Sync audit: ${audit.ok ? 'passing' : `FAILING\n${audit.out}`}`,
  'Explore with the explorer subagent (Haiku); keep the main context for decisions and edits. See AGENTS.md › Work loop.',
];
if (input.source === 'startup' || input.source === 'resume') context('SessionStart', lines.join('\n'));
process.exit(0);
