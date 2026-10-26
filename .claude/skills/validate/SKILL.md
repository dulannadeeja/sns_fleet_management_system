---
name: validate
description: Run every check for what changed (docs audit, design copy, skills index, and the app's type check, lint and AT tests) and report one PASS or FAIL verdict. Use before every commit and PR. Reports only; fixing is a separate step.
---

# Validate

Hand this to the **validator** subagent (Haiku) when you want to keep the main context clean; run it yourself when you need to see the failures in detail.

## Always (from the repository root)
| Check | Command |
| --- | --- |
| Sync audit (links, screens, counts, AT coverage, agent files, skills) | `node scripts/audit.mjs` |
| Design-system copy for the canvas | `node scripts/sync-design-copy.mjs --check` |
| Skills index | `node scripts/skills-index.mjs --check` |

## When `app/` changed (from `app/`, as listed in `app/AGENTS.md`)
| Check | Command |
| --- | --- |
| Types | `npm run typecheck` |
| Lint and format | `npm run lint` |
| Rule and AT tests (real test Postgres) | `npm run test` |
| AT coverage (every AT-nn has a test) | `npm run test:at-coverage` |
| Browser journeys (only if routes, screens or auth changed) | `npm run test:e2e` |

## When `screens/canvas/` changed
Every changed board was re-rendered (`node screens/tools/render.mjs --changed` reports nothing new to change) and the audit passes.

## Report
One line per check, ✅ or ❌, then **Overall: PASS** or **Overall: FAIL**. For every ❌, the command and the relevant output. Keep going after a failure so the report is complete. A checker that cannot fail is useless: when a check is new, break something on purpose once and confirm it reports ❌.

Source: adapted from `piv-validate` in coleam00/skills (MIT, see LICENSE.txt).
