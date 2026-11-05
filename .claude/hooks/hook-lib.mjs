// Shared helpers for the project hooks.
import { relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const ROOT = process.env.CLAUDE_PROJECT_DIR ? resolve(process.env.CLAUDE_PROJECT_DIR) : resolve(import.meta.dirname, '..', '..');

export async function stdinJson() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  try { return JSON.parse(data || '{}'); } catch { return {}; }
}

/** Path relative to the project root with forward slashes ('' when outside the project). */
export function projectPath(p) {
  if (!p) return '';
  const r = relative(ROOT, resolve(ROOT, p));
  return r.startsWith('..') ? '' : r.split(sep).join('/');
}

export function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [join(ROOT, script), ...args], { cwd: ROOT, encoding: 'utf8' });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

export function context(event, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

export const stateFile = (sessionId) => join(tmpdir(), `sns-harness-${String(sessionId || 'default').replace(/[^\w-]/g, '')}.json`);
