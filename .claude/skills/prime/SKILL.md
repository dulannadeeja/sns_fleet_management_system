---
name: prime
description: Orient on only the part of the repository a task needs, using the explorer subagent so the main context stays clean. Use at the start of a ticket or session, or before planning, with a scope such as docs, screens, design-system, app, or an app module (rentals, money, partners, payroll, cars, customers).
argument-hint: "[scope: docs | screens | design-system | app | <module> | #issue]"
---

# Prime: load only what this task needs

Scope: $ARGUMENTS

1. **Always read** `AGENTS.md` (already loaded) and the `AGENTS.md` of the scope's folder.
2. **If the scope is a GitHub issue**, read it (GitHub MCP, or `gh issue view <n>`): its ST-nn.n stories, AT-nn checks, screens and TRD sections are the reading list.
3. **Send the explorer subagent** (Haiku) to collect, for the scope, in one report with `path:line` references:
   - **docs**: the system design sections and PRD stories involved; their status (Confirmed, Derived control, Proposed, Open).
   - **screens / design-system**: the boards (`NN.n Name · Device`) or components involved, and the rules they show.
   - **app / a module**: entry routes, the module's rules and schema files, its tests in `app/tests/at/`, and the TRD rows it implements.
   Run independent explorations as parallel explorer calls.
4. Check the state: `git status`, `git log -5 --oneline`, current branch.
5. **Report** in at most 25 lines: what the scope is, the rules that bind it (with status), the files that matter, the checks that prove it, anything that looks inconsistent. Do not read whole large files (`PRD.md` is over 1,000 lines) into the main context.

Source: adapted from `prime-codebase` in coleam00/skills (MIT, see LICENSE.txt).
