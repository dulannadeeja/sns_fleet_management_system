---
name: plan-ticket
description: Write a one-pass implementation plan for a GitHub issue or small request, after reading only what it needs and asking the user about anything not settled. Saves it to .claude/plans/. Use before implementing any ticket.
argument-hint: "[#issue or a short feature description]"
---

# Plan a ticket

Ticket: $ARGUMENTS. Planning needs careful reasoning: if the session is not on a top-tier model, suggest `/model opus` first.

1. **Branch first:** `git switch -c feature/<issue>-<slug>` from `development` (or use the current feature branch). The plan rides into the PR.
2. **Inherit, don't re-decide.** Read the issue, its stories in `PRD.md`, the rules they cite in `SNS_SYSTEM_DESIGN.md` and the TRD rows. Run the **prime** skill for the module if not already primed. Anything marked Open or Proposed is not built: stop and ask.
3. **Ask what is open, one question at a time** (the **grilling** style): seams to test, edge cases, unclear wording. Record business answers with **sns-change-control** before planning on them.
4. **Look things up** you are unsure of with the **researcher** subagent (library APIs at the versions in `app/package.json`).
5. **Write** `.claude/plans/<issue>-<slug>.md`:
   - Goal, stories, AT checks, out of scope.
   - Files to read first (with why); files to create or change.
   - **Seams under test** (agreed with the user) and the AT tests to write first.
   - Step-by-step tasks, each with the file, the change and its own **VALIDATE** command (from `app/AGENTS.md`).
   - Validation at the end: `validate` skill.
6. Commit the plan on the branch (`docs(plan): <ticket>`), then hand over to **implement-ticket**.

Source: adapted from `piv-plan-implementation` in coleam00/skills (MIT, see LICENSE.txt).
