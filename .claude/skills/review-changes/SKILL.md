---
name: review-changes
description: Review a change since a fixed point on two separate axes, in parallel fresh subagents that did not write it: Standards (code-reviewer) and Spec (spec-reviewer), plus a rules-file drift check. Use before every commit of code, before a PR, or when asked to "review since X".
argument-hint: "[fixed point: commit, branch or tag; default development]"
---

# Review changes (two axes)

Fixed point: $ARGUMENTS (default: the merge-base with `development`).

1. **Pin the diff.** `git rev-parse <fixed-point>` must resolve and `git diff <fixed-point>...HEAD` (plus uncommitted changes) must be non-empty; otherwise stop and say so. Note `git log <fixed-point>..HEAD --oneline`.
2. **Find the spec.** The issue number in the branch name or commits (GitHub MCP, or `gh issue view`), the plan in `.claude/plans/`, its PRD stories. If none, the Spec axis reports "no spec".
3. **Spawn both reviewers in one message, in parallel**, each given the diff command, the commit list and the spec location:
   - **code-reviewer** (Sonnet): the project standards and the smell baseline; its brief is in its agent file.
   - **spec-reviewer** (Opus): missing, unasked-for and wrong behaviour against the ticket, PRD, system design and TRD; rank order; Open items; AT tests.
   For a change to docs or screens only, use **spec-reviewer** and **consistency-checker** instead.
4. **Run rules-check-drift** on the same diff yourself (it is short).
5. **Report** under `## Standards`, `## Spec` and `## Rules files`, verbatim or lightly cleaned. Do not merge or re-rank the axes: a change can follow every standard and still build the wrong thing. End with one line: findings per axis and the worst one in each.
6. Fix findings with the user's agreement, then run **validate** again.

Source: adapted from `code-review` in mattpocock/skills (MIT, see LICENSE.txt).
