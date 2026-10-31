# Plan: #12 Database and test database

## Goal
PostgreSQL 16 with Drizzle: SQL migrations, a test database the rule tests run against (locally in Docker Desktop, in CI as a service), the insert-only `audit_event` table, and the one whole-rupee money function. Later tickets add their tables on top.

## Inherited, not re-decided
- TRD T2 (PostgreSQL + Drizzle, SQL migrations by drizzle-kit), §3 layout (`src/db/`, `docker/`), §4 (every table: `id` UUID, `created_at` timestamptz, `created_by`; times read in Asia/Colombo), §5 (money is `bigint` rupees; partner share `floor(amount × share)`, SNS takes the rest, in one function; audit events insert-only: no UPDATE/DELETE, a trigger rejects either), §12 (rule tests against a real Postgres with migrations applied).
- System design §17.3: whole rupees; partner share rounded down, SNS takes the difference (Confirmed). AT-03 numbers: 5,750 at 85% → partner 4,887, SNS 863.
- Dulan, 31 Oct 2026: the local test database runs in Docker Desktop.

## Stories and checks
- No PRD story; no AT is completed here. AT-03 and AT-70 use the money function later; their tests come with their tickets.
- Foundation tests: migrations apply to an empty database; an `audit_event` row can be inserted; UPDATE and DELETE on it are refused (Derived control behind ST-15.4); the money split matches AT-03's figures and always adds up.

## Out of scope
- Every other table (each feature ticket adds its own). Better Auth tables (#14). `created_by` gets its foreign key to `user` in #14.

## Versions (checked 31 Oct 2026; at least two weeks old)
`drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `pg` 8.23.1, `@types/pg` 8.23.1. Not the 1.0 release candidate.

## Seams under test
- `src/lib/money.ts` · `splitShare(amount, partnerBasisPoints)` → `{ partner, sns }`: whole rupees in, whole rupees out, `partner = floor(amount × bp / 10000)`, `sns = amount − partner`; refuses non-integers and unsafe numbers.
- The database itself: migrations and the trigger, tested through SQL on the test database.

## Files
Read first: `TRD.md` §3–5, 12; `app/AGENTS.md`; `app/package.json`; `.github/workflows/checks.yml` (CI already starts `postgres:16` with `DATABASE_URL`).

Create:
- `app/docker/compose.test.yml`: `postgres:16`, port 5433, database `sns_test`, healthcheck.
- `app/drizzle.config.ts`: schema `src/db/schema/*.ts`, out `src/db/migrations`, dialect postgresql, `DATABASE_URL`.
- `app/src/db/schema/audit.ts`: `audit_event` (id uuid default `gen_random_uuid()`, created_at timestamptz default now, created_by uuid null, action text, target_type text, target_id text, details jsonb).
- `app/src/db/schema/index.ts`; `app/src/db/client.ts` (pg Pool + drizzle, from `DATABASE_URL`).
- `app/src/db/migrations/` 0000 generated (table) and 0001 custom (trigger `audit_event_insert_only` raising on UPDATE and DELETE).
- `app/src/lib/money.ts`.
- `app/tests/setup/db.ts` (Vitest global setup: apply migrations to `DATABASE_URL`, fail with a plain message if the database is not reachable).
- `app/tests/db/migrations.test.ts`, `app/tests/db/audit-event.test.ts`, `app/tests/money.test.ts`.
- `app/.env.example` (no secrets): `DATABASE_URL=postgres://postgres:postgres@localhost:5433/sns_test`.

Change:
- `app/package.json`: deps; scripts `db:test:up` (`docker compose -f docker/compose.test.yml up -d --wait`), `db:test:down`, `db:generate`, `db:migrate`; `test` unchanged.
- `app/vitest.config.ts`: global setup; default `DATABASE_URL` to the local test database when unset.
- `app/AGENTS.md`: the db commands are no longer "not yet added"; local setup steps (Docker Desktop, `npm run db:test:up`).
- `.github/workflows/checks.yml`: nothing expected (service and `DATABASE_URL` are there); confirm the tests reach it.

## Tasks (test first: each test seen failing before the code)
1. `tests/money.test.ts` (AT-03 figures, adds up, refuses 4887.5) → `src/lib/money.ts`. VALIDATE: `npx vitest run tests/money.test.ts`.
2. `docker/compose.test.yml`, `.env.example`, scripts → start the test database. VALIDATE: `npm run db:test:up` (here: a local Postgres 16 on port 5433, since Docker is not running in this cloud machine).
3. `tests/db/migrations.test.ts` + global setup → `drizzle.config.ts`, `schema/audit.ts`, `npm run db:generate`. VALIDATE: `npx vitest run tests/db`.
4. `tests/db/audit-event.test.ts` (insert ok; update refused; delete refused) → custom migration with the trigger. VALIDATE: `npx vitest run tests/db`.
5. `src/db/client.ts`, `app/AGENTS.md`. VALIDATE: `npm run typecheck && npm run lint`.

## Validation at the end
`validate` skill: `node scripts/audit.mjs`; in `app/`: `npm run typecheck && npm run lint && npm run test && npm run test:at-coverage && npm run build`. Then `review-changes`, then `ship` (PR into development, closes #12).

## Deviations (after review, 31 Oct 2026)
- The app role `sns_app` is built here after all (migration 0002, tested with `SET ROLE`), so TRD §5 and §13 are both met; the server setup only gives it a login.
- `splitShare` first refused negative amounts (not decided); the owner then decided DN-21 on 31 Oct 2026: a negative line is the mirror of a positive one (AT-84).
- The database client sets the session time zone to Asia/Colombo; the test database is migrated fresh in its own test; the password never appears in an error.
- `server-only` is stubbed for tests; `DATABASE_URL` must be set for the app.
- `.claude/plans/` is no longer ignored, in its own commit, so plans ride into PRs as the plan-ticket skill says.
