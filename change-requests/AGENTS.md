# change-requests/: changes to the frozen proposal

- One file per request: `CR-NNN-short-name.md`, numbered in order. Follow the shape of the existing ones (the table, What, Why, Not changed, Owner's decision).
- A request stays "Waiting for the owner's agreement" until the owner agrees in words; Dulan records it. Then an addendum is written in `addenda/` and the system design item becomes Confirmed (skill: sns-change-request).
- Never delete a request; a refused one is marked not wanted.

## Checks
- `node scripts/audit.mjs`.
