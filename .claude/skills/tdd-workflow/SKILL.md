---
name: tdd-workflow
description: Test-first development for app/ code. Every acceptance scenario AT-nn becomes a test named after it, written and seen failing before the code; vertical slices, one test then one change. Use for any feature, bug fix or refactor in app/.
paths:
  - "app/**"
---

# Test-driven development (SNS)

## The loop, one vertical slice at a time
1. **Agree the seams** with the user before the first test: the public interfaces you will test at (a module's rule function, a server action, a page), each with one line on what it catches and what it misses. No test at a seam that was not agreed.
2. **Red:** write one test. If it implements an acceptance scenario, name the file and the test after it: `app/tests/at/at-27.test.ts`, `test('AT-27 day close with a rental still out: that day final; extra km waits', …)`. Run it and see it fail for the right reason.
3. **Green:** the least code that passes. No speculative features.
4. **Check:** run the task's VALIDATE command, then start the next slice. Refactoring happens afterwards, at review, not inside the loop.

## Where tests go (TRD, Testing)
| Kind | Tool | Location |
| --- | --- | --- |
| Rules and money (pure functions, database rules) | Vitest against a real test Postgres with the migrations applied | `app/tests/at/at-NN.test.ts`; unit tests beside the module |
| Journeys (handover blocked, permissions, filters, lockout) | Playwright at desktop 1280 and phone 390 | `app/tests/at/e2e/at-NN.spec.ts` |
| Sinhala printing | Playwright screenshot of each 16.x document, Sinhala and English | `app/tests/documents/` |

## Good tests
- Test behaviour through public interfaces. A test that breaks on a refactor without a behaviour change is coupled to internals.
- **Expected values come from the system design, not from the code.** Use the AT's own numbers: AT-03 expects 5,750, with the owner 4,887 and SNS 863. Never compute the expected value the way the code does.
- Money in whole rupees, times in Asia/Colombo, sample data labelled as sample.
- Do not mock the database for rules the database enforces (the exclusion constraint, insert-only tables, unique keys). Test them against Postgres.
- Mock only the outside world: email (Resend), R2 and the clock (pass "now" in).

## Evidence
Keep a short map in the implementation report: AT-nn → test file → what failed when it was red → green. `npm run test:at-coverage` must list no AT without a test before a PR.

Source: adapted from `tdd-workflow` in affaan-m/everything-claude-code (MIT) and `tdd` in mattpocock/skills (MIT); see LICENSE.txt.
