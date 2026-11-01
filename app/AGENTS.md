# app/: the SNS Rent Car application (rank 7)

Built exactly as `TRD.md` says: one Next.js app (TypeScript), PostgreSQL with Drizzle, Better Auth, pg-boss jobs, next-intl, the Plate components ported to `src/ui/`. The foundation is in place: Next.js, next-intl, Vitest and Playwright (#8); PostgreSQL with Drizzle, the test database and the insert-only activity log (#12); Plate and the app frame in `src/ui/` (#13); sign-in with phone number and password, lockout and the first password (#14); permissions and people (#15). Email codes (#28) and jobs come with the next Phase 1 tickets.

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
| Browser journeys (Chromium, desktop and phone sizes; needs `.env.local`; first run `npx playwright install chromium`) | `npm run test:e2e` |
| Migrations | change `src/db/schema/`, then `npm run db:generate` and review the SQL; a rule SQL alone (a trigger) is `npx drizzle-kit generate --custom --name <what>`; apply with `npm run db:migrate`. Tests apply them by themselves |
| Build (checks Sinhala and English have the same words first) | `npm run build` |
| Dev server (needs `.env.local`, below) | `npm run dev` |
| Add the primary owner once (then the owner adds people on screen 15.4) | `npm run people:add -- --name "Full name" --phone 07XXXXXXXX --role owner` (asks for the password; it shows while typed, and is never printed or logged) |

## Settings (`app/.env.local`, git-ignored, never committed)
- `DATABASE_URL`: the database the dev server uses. Tests and browser journeys use the test database on port 5433 by themselves.
- `BETTER_AUTH_SECRET`: a long random value of your own, made once: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. The app refuses to start without it; there is no built-in fallback. Unit tests set a test-only value in `vitest.config.ts`; CI sets one in the workflow; the server has its own.

## Plate in the app (`src/ui/`)
- `scripts/sync-plate.mjs` copies the tokens, styles, fonts, logo and line icons from `design-system/` into `src/ui/plate/` and `public/plate/` before `dev`, `build`, `test` and `typecheck`. The copies are git-ignored: never edit them; change `design-system/` (skill: sns-plate-component). `--check` fails on a stale copy.
- Components keep the names, props and `rt-*` classes of `design-system/components/` (`index.d.ts`, `bundle.js`); port one when a ticket first needs it, with a test of its states. A component with event handlers is a client component (`'use client'`).
- Words come from `src/i18n/` and are passed in as props (`labels`, `label`, `langLabel`, `backLabel`, `newLabel`, `search`). The menu's group headings and English echoes are the design system's own bilingual words; pass `group` with every menu item so English labels group correctly. `/plate` (development only; 404 in production) previews the frame: `/plate?device=phone` for the phone.

## Sign-in (`src/auth/`, Better Auth)
- `server.ts` is the one Better Auth set-up: phone number and password, 8+ characters, 5 wrong tries lock the account for 15 minutes (hooks, per account). No self sign-up.
- Only three Better Auth paths are open: phone sign-in, sign-out and get-session (`OPEN_PATHS`). Every other path answers 404, so nothing checks a password outside the lock. Opening one (email codes, #28) needs its own lock test.
- Each try is counted before the password is checked, in one `update … where not locked`, so parallel tries still get at most 5 checks.
- Every signed-in page starts with `requireUser()` (`src/auth/require.ts`): no session → `/sign-in`; a first or reset password → `/first-sign-in`. Nothing else opens until the person sets their own password (a *Proposed* check in ST-01.2, built here).
- The signed-in person's saved language picks `si` or `en` (`src/i18n/request.ts`); before sign-in, the sign-in page's switch (a cookie); otherwise Sinhala. An action that can change the language calls `revalidatePath('/', 'layout')` before `redirect`, so `<html lang>` follows.
- Phone numbers are Sri Lankan mobiles, 10 digits, digits only (`src/auth/phone.ts`, system design 3.1, Proposed). `signInProblems` (`src/auth/sign-in-check.ts`) is the one box-by-box check, run in the browser and again in the action; `addPerson` and Better Auth refuse other numbers too. A failed sign-in with well-formed input does not say whether the number or the password was wrong; only the lock message (AT-60) shows that an account exists.
- People without an email get a placeholder `<id>@no-email.invalid`; nothing is ever sent to it.

## Permissions and people (`src/auth/permissions.ts`, `src/modules/people/`)
- The catalogue has one key per row of system design 3.2, each with who starts with it. Adding people, changing permissions and turning accounts off or on are owner-only and never in it. A new row there means a new key here.
- Pages and actions call `requirePermission(key)` or `requireOwner()` (`src/auth/require.ts`): a missing permission is a 403 (`forbidden()`, `src/app/forbidden.tsx`). The check itself is `accessFor(headers, key)` (`src/auth/access.ts`), which tests call directly (AT-24).
- People changes (add, reset password, turn off/on, set permission) take the acting owner's id, check it again inside one transaction, and write `audit_event` there. A turned-off person has no sessions, cannot sign in (answered like a wrong password) and is refused everywhere.
- Browser tests sign in as the test database's one owner: `tests/e2e/owner-setup.ts` gives it a test password and turns off sample people left from earlier runs.

## Rules (details in TRD › Integrity rules)
- Money is whole-rupee integers; a partner share is rounded down in one shared function (`src/lib/money.ts` · `splitShare`); SNS takes the rest.
- Earning lines, payments, payouts, adjustments, cash movements and audit events are insert-only. A correction is a new dated line. Each insert-only table gets a trigger refusing UPDATE, DELETE and TRUNCATE, and its migration grants the app role `sns_app` only SELECT and INSERT (see `src/db/migrations/0001`, `0002`).
- Rows in insert-only tables can never be removed, also in the test database: a test tags its own rows (a random id) and never counts a whole table.
- `splitShare`: a negative line (a correction) is the exact mirror of the positive one (DN-21, AT-84).
- Every server action: `requirePermission`, validate input, one transaction, the activity-log entry in that transaction.
- Calculations read the rental's saved terms, never the car's live package. Times are read in Asia/Colombo.
- No business rule is invented here: if the system design, PRD or TRD does not say it, stop and ask.
- Work test-first (skill: tdd-workflow); UI from `src/ui/` only (skill: sns-plate-component); text only from `src/i18n/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
