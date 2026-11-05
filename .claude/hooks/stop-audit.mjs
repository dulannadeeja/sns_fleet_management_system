#!/usr/bin/env node
// Stop: runs the sync audit when the working tree has changes. Hard failures keep the agent working (exit 2).
import { execFileSync } from 'node:child_process';
import { stdinJson, runNode, ROOT } from './hook-lib.mjs';

const input = await stdinJson();
if (input.stop_hook_active) process.exit(0);
let dirty = '';
try { dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { process.exit(0); }
if (!dirty) process.exit(0);
const r = runNode('scripts/audit.mjs');
if (r.ok) process.exit(0);
process.stderr.write(`The sync audit fails on your uncommitted changes. Fix these before finishing:\n${r.out}`);
process.exit(2);
