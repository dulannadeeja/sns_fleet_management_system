# app/: the SNS Rent Car application (rank 7)

Built exactly as `TRD.md` says: one Next.js app (TypeScript), PostgreSQL with Drizzle, Better Auth, pg-boss jobs, next-intl, the Plate components ported to `src/ui/`. The skeleton does not exist yet: creating it with the scripts below is the first Phase 1 ticket.

## Layout
`src/app/` routes by PRD module · `src/modules/<module>/` business rules and database access, no React · `src/db/` schema and SQL migrations · `src/ui/` Plate components · `src/documents/` printouts 16.1–16.7 · `src/jobs/` pg-boss jobs · `src/i18n/` `si.json`, `en.json` · `tests/at/` one test per AT-nn.

## Commands (run from `app/`)
| What | Command |
| --- | --- |
| Install | `npm ci` |
| Types | `npm run typecheck` |
| Lint and format | `npm run lint` |
| Rule and AT tests (needs the test Postgres: `npm run db:test:up`) | `npm run test` |
| One test | `npx vitest run tests/at/at-03.test.ts` |
| Every AT-nn has a test | `npm run test:at-coverage` |
| Browser journeys | `npm run test:e2e` |
| Migrations | `npm run db:generate`, then review the SQL; `npm run db:migrate` |
| Dev server | `npm run dev` |

## Rules (details in TRD › Integrity rules)
- Money is whole-rupee integers; a partner share is rounded down in one shared function; SNS takes the rest.
- Earning lines, payments, payouts, adjustments, cash movements and audit events are insert-only. A correction is a new dated line.
- Every server action: `requirePermission`, validate input, one transaction, the activity-log entry in that transaction.
- Calculations read the rental's saved terms, never the car's live package. Times are read in Asia/Colombo.
- No business rule is invented here: if the system design, PRD or TRD does not say it, stop and ask.
- Work test-first (skill: tdd-workflow); UI from `src/ui/` only (skill: sns-plate-component); text only from `src/i18n/`.
