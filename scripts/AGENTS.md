# scripts/: repository checks and sync tools

Plain Node (20 or later), no dependencies, so they run anywhere without an install, on Windows too.

| Script | Does |
| --- | --- |
| `audit.mjs` | The sync audit. `--only=links,screens,counts,design-copy,at,agent-files,skills,skills-index`; `--files=a.md,b.md` checks links in those files only |
| `sync-design-copy.mjs` | Regenerates `screens/canvas/ds/plate/` from `design-system/`; `--check` only reports |
| `skills-index.mjs` | Regenerates `.claude/skills/README.md`; `--check` only reports |
| `lib.mjs` | Shared helpers (file list, heading anchors, the design-copy transform) |

## Rules
- A new check goes into `audit.mjs` as its own named section, marked hard (blocks) or soft (warns). A check that cannot fail is useless: break something on purpose once and see it fail.
- Keep the audit fast (a few seconds); the Stop hook runs it at the end of every turn that changed files.
- Use forward-slash paths relative to the repository root; never shell out to POSIX-only tools.

## Checks
- `node scripts/audit.mjs` must pass after any change here.
