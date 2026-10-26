# audits/: dated review records

- Each folder is a record of one review on one date. Never edit a record; add a new dated folder instead.
- A record's file paths and counts describe the project on that day; check a finding against the current files before acting on it.
- When a finding is fixed or overtaken, update its row in `README.md`, not the record.
- Findings are Proposed until the change control process (skill: sns-change-control) adopts them.

## Checks
- `node scripts/audit.mjs`.
