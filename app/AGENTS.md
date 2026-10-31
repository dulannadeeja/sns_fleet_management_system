# app/: the SNS Rent Car application (rank 7)

Built exactly as `TRD.md` says: one Next.js app (TypeScript), PostgreSQL with Drizzle, Better Auth, pg-boss jobs, next-intl, the Plate components ported to `src/ui/`. The foundation is in place: Next.js, next-intl, Vitest and Playwright (#8); PostgreSQL with Drizzle, the test database and the insert-only activity log (#12). Sign-in, jobs and `src/ui/` come with the next Phase 1 tickets.

## Layout
`src/app/` routes by PRD module · `src/modules/<module>/` business rules and database access, no React · `src/db/` schema and SQL migrations · `src/ui/` Plate components · `src/documents/` printouts 16.1–16.7 · `src/jobs/` pg-boss jobs · `src/i18n/` `si.json`, `en.json` · `tests/at/` one test per AT-nn.

## Commands (run from `app/`)
| What | Command |
| --- | --- |
| Install | `npm ci` |
| Start the test database (Docker Desktop, PostgreSQL 16 on port 5433) | `npm run db:test:up`; stop it with `npm run db:test:down` |
| Types | `npm run typecheck` |
| Lint and format | `npm run lint` |
| Rule and AT tests (start the test database first) | `npm run test` |
| One test | `npx vitest run tests/at/at-03.test.ts` |
| Which AT-nn have a test | `npm run test:at-coverage` (lists; `test:at-coverage:strict` fails on any gap: the release gate) |
| Browser journeys (Chromium, desktop and phone sizes; first run `npx playwright install chromium`) | `npm run test:e2e` |
| Migrations | change `src/db/schema/`, then `npm run db:generate` and review the SQL; a rule SQL alone (a trigger) is `npx drizzle-kit generate --custom --name <what>`; apply with `npm run db:migrate`. Tests apply them by themselves |
| Build (checks Sinhala and English have the same words first) | `npm run build` |
| Dev server | `npm run dev` |

## Rules (details in TRD › Integrity rules)
- Money is whole-rupee integers; a partner share is rounded down in one shared function (`src/lib/money.ts` · `splitShare`); SNS takes the rest.
- Earning lines, payments, payouts, adjustments, cash movements and audit events are insert-only. A correction is a new dated line. Each insert-only table gets a trigger refusing UPDATE, DELETE and TRUNCATE, and its migration grants the app role `sns_app` only SELECT and INSERT (see `src/db/migrations/0001`, `0002`).
- Rows in insert-only tables can never be removed, also in the test database: a test tags its own rows (a random id) and never counts a whole table.
- `splitShare` refuses negative amounts: how a negative line splits is not decided yet; ask before allowing it.
- Every server action: `requirePermission`, validate input, one transaction, the activity-log entry in that transaction.
- Calculations read the rental's saved terms, never the car's live package. Times are read in Asia/Colombo.
- No business rule is invented here: if the system design, PRD or TRD does not say it, stop and ask.
- Work test-first (skill: tdd-workflow); UI from `src/ui/` only (skill: sns-plate-component); text only from `src/i18n/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
