---
name: rules-check-drift
description: Check whether the AGENTS.md files (root and nested) still match the repository after a change. Reports rules that became false, map entries that drifted, and any new invariant worth one line. Keeps the rules files true and lean. Use before a merge or inside review-changes.
argument-hint: "[optional diff range, default HEAD]"
---

# Rules drift check

Wrong rules are worse than missing rules, and a longer rules file is worse than a lean one. Most changes need no edit.

1. Diff: `git diff <range>` and `git status` (default: uncommitted plus staged). Note moved, renamed or removed paths, new modules, changed commands and new invariants.
2. Read the root `AGENTS.md` and the `AGENTS.md` of each folder the diff touches. Each `CLAUDE.md` only imports its `AGENTS.md`.
3. Flag only:
   - **Now false:** a rule, path or command the change made wrong. Give the one-line fix.
   - **Map drift:** a "where things live" pointer that no longer matches. Fix that entry; do not list new files.
   - **New invariant:** a rule that must hold from now on. One line, in the nearest folder's `AGENTS.md`, not the root.
4. Never suggest recording that a feature was added, restating what the code shows, or pasting code. Business rules belong in the system design, not in agent files.
5. Output a table of fixes and additions, then the areas checked and still true. If nothing drifted, say so in one line. Apply edits only when asked.

Source: adapted from `rules-check-drift` in coleam00/skills (MIT, see LICENSE.txt).
