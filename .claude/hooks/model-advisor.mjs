#!/usr/bin/env node
// UserPromptSubmit: when the work needs deep reasoning and the session is not on a top-tier model,
// asks the agent to suggest a higher model to the user before starting.
import { readFileSync } from 'node:fs';
import { stdinJson, context, stateFile } from './hook-lib.mjs';

const input = await stdinJson();
const prompt = String(input.prompt ?? '');
if (!prompt || prompt.startsWith('/model')) process.exit(0);
let model = '';
try { model = JSON.parse(readFileSync(stateFile(input.session_id), 'utf8')).model || ''; } catch {}
if (/opus|fable/i.test(model)) process.exit(0);

const heavy = [
  [/\b(plan|planning|architect\w*|design (the|a)|slice|epic|trd|adr)\b/i, 'planning or architecture'],
  [/\b(money|earning\w*|payout|cash-?out|commission|rounding|deposit|refund|payroll|salary|drawer|reconcil\w*)\b/i, 'money rules'],
  [/\b(auth\w*|permission\w*|security|secret\w*|password|privacy|nic copies)\b/i, 'security or permissions'],
  [/\b(decid\w*|decision|grill\w*|open item|change request|system design|source of truth|owner agreed)\b/i, 'an owner decision or the source of truth'],
  [/\b(schema|migration|data model|exclusion constraint|integrity)\b/i, 'the data model'],
  [/\b(debug\w*|root cause|flaky|race condition)\b/i, 'hard debugging'],
];
const hit = heavy.find(([re]) => re.test(prompt));
if (!hit) process.exit(0);
context('UserPromptSubmit', `Model advisor: this request involves ${hit[1]}. The session model is ${model || 'unknown'}, not a top-tier model. Before starting, tell the user in one line that this work benefits from a higher model and suggest switching with /model opus. If they decline or already chose this model on purpose, continue. Exploration still goes to the explorer subagent (Haiku).`);
process.exit(0);
