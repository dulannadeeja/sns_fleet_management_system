---
name: slice-tickets
description: Slice a PRD phase or module into build-sized GitHub issues, one testable concern each, with their stories, AT checks, screens and TRD sections, and a dependency order. Use when starting a phase, or when a story is too big for one loop.
argument-hint: "[phase 1-4, or a PRD module like '05 New rental']"
---

# Slice into tickets

Slice: $ARGUMENTS. This is planning work: if the session is not on a top-tier model, suggest `/model opus` first.

## 1. Read the sources (through the explorer subagent)
- The PRD module section(s): every ST-nn.n story with its Rules, Checks (AT-nn), Screens and Decided items.
- The TRD rows those stories need (data model tables, integrity rules, jobs).
- What already exists in `app/` (if anything), so tickets reuse it.
- Stop if any rule involved is not Confirmed: say which, and ask the user (one question at a time) before slicing around it.

## 2. Decompose
Each ticket is one testable concern, a vertical slice (schema → rule → server action → screen → tests), small enough for one focused loop (roughly 300–1,200 changed lines including tests). It carries its own context so a later loop needs nothing else:
- **Stories:** ST-ids. **Checks:** the AT-ids it must make pass (each becomes a test named after it).
- **Screens:** `NN.n` boards, Desktop and Phone. **TRD:** section names. **Files:** an estimate.
- **Depends on:** other tickets, or none.
Order: foundation tickets first (scaffold, schema, sign-in, permissions), then features. Independent tickets can run in parallel worktrees.

## 3. Show the user the breakdown before creating anything
A table: ticket, stories, checks, depends on, wave. Ask one question: create these as GitHub issues?

## 4. Create the issues
GitHub MCP (`issue_write`) or `gh issue create`, using `.github/ISSUE_TEMPLATE/ticket.md`. Labels: `phase-N`, `module-NN`, `ticket`. Title: `[ST-05.3] Dates and estimate`. Link dependencies in the body. Report the issue numbers and the suggested order.

Source: adapted from `piv-slice-epic` in coleam00/skills (MIT, see LICENSE.txt).
