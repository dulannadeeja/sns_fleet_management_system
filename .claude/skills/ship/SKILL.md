---
name: ship
description: Commit finished work in this repository's format and, for a ticket, push the branch and open a pull request that closes its issue. Use after validate passes and review-changes is addressed.
argument-hint: "[optional: 'commit' to commit only]"
---

# Ship

## Gate
- **validate** reports PASS on this exact tree. For code, every **review-changes** finding is fixed or answered.
- The tree holds one logical change. Unrelated edits go in their own commit.

## Commit
- Message: `type(scope): summary`, where type is one of `decision`, `scope`, `design`, `docs`, `impl`, `fix`, `test`, `chore`.
- Body: what changed and why; the system design sections and AT-ids involved; who decided (for decisions: "Decided with Dulan for the owner, <date>; recorded as agreed by the owner"); anything still pending; "Viewer refreshed: <canvas version>" after a screens or design-system change.
- End with the attribution lines your agent environment requires, if any.
- Never commit secrets, `.env` files, customer documents or real NIC images.

## Push and pull request (tickets)
- Push the feature branch with `-u`. Never push to `main` and never force-push: the guard hook blocks both.
- Open the PR into `development` using `.github/pull_request_template.md`: summary, `Closes #<issue>`, stories and AT checks, validation results, deviations from the plan (from the implementation report), screenshots for screen changes.
- A human makes the final call. Do not merge your own PR.

Source: adapted from `piv-commit` and `piv-create-pr` in coleam00/skills (MIT, see LICENSE.txt).
