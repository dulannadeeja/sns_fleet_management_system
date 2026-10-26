---
name: implement-ticket
description: Implement a saved plan task by task, test first, validating each task before the next, then write a short report. Use after plan-ticket, with the plan path.
argument-hint: "[path to .claude/plans/<plan>.md]"
---

# Implement from a plan

Plan: $ARGUMENTS

1. **Branch:** be on the plan's feature branch, with a clean tree. Never on `main`.
2. **Read the whole plan** and the files it lists first. Facts you still need: ask the **explorer** subagent instead of reading widely yourself.
3. **For each task, in order:** follow **tdd-workflow**: write the AT test (or unit test at the agreed seam) → see it fail for the right reason → write the least code to pass → run the task's VALIDATE command. A task is done only when its check passes.
4. **Stay inside the plan.** A needed change the plan did not foresee: note it as a deviation; if it touches a rule, stop and ask.
5. **Finish:** run the **validate** skill (or the **validator** subagent). Fix until it passes.
6. **Report** to `.claude/reports/<plan>.md` (not committed) and in chat: summary, tasks and files, tests added with AT ids, validation results, deviations from the plan and why. The deviations section feeds the PR body and tells reviewers what was intentional.
7. Next: **review-changes**, then **ship**.

Source: adapted from `piv-implement` in coleam00/skills (MIT, see LICENSE.txt).
