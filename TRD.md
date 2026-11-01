# SNS Rent Car · Technical requirements (TRD)

How the SNS Rent Car system is built: architecture, data model, integrity rules, jobs, deployment and testing.

This document is **derived** (rank 3). It sits below `SNS_SYSTEM_DESIGN.md` (rank 1, the source of truth) and `PRD.md` (rank 2), and may never contradict or extend them: a business rule lives in the system design, a story in the PRD, and here only how it is built. Where they differ, the higher document wins and this file is corrected. Changes follow `.claude/skills/sns-change-control/SKILL.md`.

Status: written with Dulan, 26 Oct 2026, for review. Technical choices are Dulan's as developer; the stack and hosting are recorded in the system design as agreed with the owner (DN-19).

## 1. Decisions

| # | Topic | Decision | Why |
| --- | --- | --- | --- |
| T1 | Code layout | One Next.js app in `app/` of this repository, organised by module as in the PRD; business rules kept apart from screens | Docs and code change in one commit; rules testable without a browser |
| T2 | Database | PostgreSQL with Drizzle ORM and SQL migrations (drizzle-kit) | Exclusion constraints, row locks and insert-only rules are plain SQL, which Drizzle works with natively |
| T3 | Sign-in | Better Auth inside the app, stored in our Postgres via its Drizzle adapter | The maintained library that covers phone and password, email codes for some roles, and lockout; Auth.js is security fixes only since Sep 2025 |
| T4 | Printing and PDFs | HTML templates from the 16.x designs; counter printing from the browser; server PDFs by headless Chromium, one at a time | Chromium shapes Sinhala exactly as the browser does; one template for screen, print and PDF |
| T5 | Background jobs | pg-boss (job queue in Postgres) with a worker process | Schedules, retries and history without another server |
| T6 | Deployment | Docker Compose on the DigitalOcean server: app, worker, Postgres, Caddy (HTTPS); GitHub Actions builds, tests and deploys tagged releases | Written down in the repository; another developer can take over |
| T7 | Test copy | A second copy on the same server at `try.<domain>`, own database and storage, sample data, "TEST" banner | The "try it" link the proposal promises for each phase, at no extra cost |
| T8 | Email | Resend free plan, sending from the SNS domain | Matches the proposal's email cost of LKR 0 |
| T9 | Interface | The 26 Plate components ported to typed React components with plain CSS from the Plate tokens; no Tailwind or UI kit | One place per change; screens match the designs |
| T10 | Languages | next-intl with `si.json` and `en.json` | Every word in one place per language; missing words caught at build |
| T11 | Tests | Every acceptance scenario AT-01 to AT-84 is an automated test named after it | The system design's checks are the release gate |
| T12 | Monitoring | Free uptime check and free-tier error tracking alerting Dulan; backup failures alert Dulan and show on the owner's home | Recovery within 4 working hours needs fast alerts; LKR 0 a month |

## 2. Architecture

```text
Phone / office computer (browser, installable as an app)
        │ HTTPS
      Caddy ─────────────── automatic certificates for the .lk domain
        │
   ┌────┴──────────────┐         ┌──────────────────────────┐
   │ app (Next.js)     │         │ worker (Node)            │
   │ screens, server   │◄──jobs──►│ pg-boss: day close,      │
   │ actions, auth,    │  (in PG) │ reminders, bank flags,   │
   │ permission checks │         │ PDFs (Chromium), backups │
   └────┬──────────────┘         └────┬─────────────────────┘
        │                             │
   PostgreSQL 16 ◄────────────────────┘
        │
   Cloudflare R2 (private): document copies, PDFs, nightly backup copies
```

- **One application** (a modular monolith, as the system design proposes): the web app and the worker are the same codebase run two ways.
- **Online only** (PR-03): no offline storage of records. A form keeps what was typed when the connection drops; nothing is saved until it is back.
- **Server rules first:** every change goes through a server action that checks the person's permission, validates input, runs in one database transaction and writes its activity-log entry in the same transaction.

## 3. Repository layout

```text
app/
  src/
    app/            Next.js routes, one folder per PRD module (start, home, cars, rentals, money, partners, …)
    modules/        business rules per module: pure functions + database access, no React
      rentals/  money/  partners/  payroll/  cars/  customers/  approvals/  reservations/  maintenance/  documents/  identity/
    db/             Drizzle schema, migrations (SQL), seed for the test copy
    ui/             the 26 Plate components (typed) and their CSS
    documents/      HTML templates for 16.1–16.7
    jobs/           pg-boss job handlers and schedules
    i18n/           si.json, en.json
  tests/
    at/             one test per acceptance scenario: at-01.test.ts … at-83.test.ts (rules) and e2e/at-nn.spec.ts (journeys)
  docker/           Dockerfile, docker-compose.yml, Caddyfile
```

Module names follow the system design's module list (Logical structure, Modules) and the PRD's module table.

## 4. Data model

Tables follow the system design's core records (Logical structure, Core records and relationships). Every table has `id` (UUID), `created_at`, `created_by`; times are stored as `timestamptz` and read in Asia/Colombo (PR-15).

| Area | Tables |
| --- | --- |
| Identity | `user`, `session`, `account`, `verification` (Better Auth), `permission_grant`, `audit_event` |
| Customers | `customer` (NIC unique), `customer_flag` (open/closed, reason, closed_by), `reference_person`, `document` (private file metadata), `document_access` (who opened what, when) |
| Cars | `vehicle`, `partner_owner`, `vehicle_terms_version` (rate, km, extra km, commission, surcharge, garage-day, cost responsibilities; effective from), `starting_package`, `vehicle_status_event` |
| Rentals | `reservation`, `rental`, `rental_terms_snapshot`, `rental_vehicle_segment` (car, readings, saved terms, swap-day decision), `rental_event` (extension, swap, return) |
| Charges and money | `charge`, `adjustment`, `payment`, `payment_allocation`, `deposit_movement`, `refund`, `cash_movement`, `reconciliation` (waiting/matched/flagged), `discrepancy` |
| Partners | `earning_line` (per car, per day or per charge; final_at), `cashout_request`, `payout`, `owner_expense_recovery`, `opening_balance` |
| Expenses | `expense` (category, car, who bears it, paid by) |
| Maintenance and checks | `maintenance_record`, `reminder`, `vehicle_check`, `vehicle_check_item` |
| Payroll | `payroll_period`, `payroll_entry`, `payroll_adjustment`, `employee_loan`, `salary_payment` |
| Decisions | `approval` (kind, requester, approver, self-approved, reason, note), `setting` (owner settings: cutoff, deadline, reminder lead times, fuel price; one row per key with its value, who changed it and when; built-in starting values until the owner changes one) |
| Starting data | `import_batch` (approved_by, approved_at); every imported row carries `import_batch_id` and shows "Imported" |

## 5. Integrity rules and how they are enforced

Each row implements a rule from the system design; the AT that proves it is listed.

| Rule | How | AT |
| --- | --- | --- |
| A car is held by one rental or reservation on any day | `btree_gist` exclusion constraint on (vehicle, held date range) across segments and reservations; handover takes a row lock on the car | AT-08, AT-30, AT-32 |
| Money is whole rupees | Integer columns (`bigint` rupees), never floating point; a partner's share is `floor(amount × share)` and SNS takes the remainder, computed in one function; a negative line mirrors a positive one: `−floor(|amount| × share)` (DN-21) | AT-03, AT-70, AT-84 |
| Final money is never edited | Earning lines, payments, payouts, adjustments, cash movements and audit events are insert-only: the app's database role has no UPDATE or DELETE on them, and a trigger rejects either | AT-16, AT-78 |
| A payout or payment is recorded once | Each request carries an idempotency key with a unique constraint; payouts lock the partner's balance row (`SELECT … FOR UPDATE`) | AT-26, AT-44 |
| Rentals keep their terms | Terms (with the cutoff, deadline and fuel price per litre from the owner settings) are copied into `rental_terms_snapshot` and each segment when it starts; calculations read only the snapshot | AT-05, AT-31 |
| Earnings show only when final | `earning_line.final_at` is set at the day close (rent) or at return (extra km, late charge); partner pages read only final lines | AT-14, AT-22, AT-27 |
| Items waiting for an admin stay out | Lines needing a decision are created with `pending_approval` and excluded until the approval is decided | AT-41, AT-54, AT-62 |
| Permissions are checked by the server | Every server action and route calls `requirePermission(user, action)`; partner routes also filter by the partner's own id; tests call the server directly | AT-22, AT-24, AT-57, AT-58 |
| Private documents are never public | Files in a private R2 bucket; opened only through an app route that checks permission, logs the opening and streams the file | AT-59 |
| Handover requirements | Handover action refuses until ID copy, licence copy, signed agreement photo, outgoing odometer and (if needed) reference copies exist; fuel and accessories must be recorded | AT-06, AT-07, AT-35, AT-53 |
| Business days | One function maps a pickup time to its deadline using the owner's cutoff and deadline settings in Asia/Colombo | AT-01, AT-02 |

## 6. Sign-in and permissions

- **Better Auth** with the phone-number plugin and password; passwords of 8 or more characters, hashed by the library; sessions in the database, in secure, http-only cookies.
- **Lockout:** 5 wrong tries lock the account for 15 minutes (a hook on failed sign-in) (AT-60).
- **Owner and admin:** the two-factor plugin sends a one-time code by email on a new device, and they can reset their own password by email (AT-61). Staff and partners are reset by the owner (AT-46).
- **Email** (codes, reset links, confirming a new address) goes through Resend's HTTPS API from the SNS domain (T8), with `RESEND_API_KEY` and `EMAIL_FROM` set on the server; production refuses to send without them. In development and tests, emails are written to a local outbox file (`MAIL_OUTBOX_FILE`) that tests read, and in development they are also printed in the dev server's console so a developer can read sign-in codes; nothing leaves the machine.
- **Trusted devices:** the two-factor plugin's signed device cookie, 30 days from the last code-free sign-in on that device; codes are stored hashed.
- **Turning an account off** revokes its sessions at once (AT-47).
- **Permissions** are SNS's own table (`permission_grant`), seeded from the defaults table; only the primary owner may change permissions, add people or turn accounts off (AT-58). Approvals refuse a person approving their own request, except the owner, whose own is marked self-approved (AT-57).
- **Owner settings** are changed only by the primary owner (`requireOwner`), checked again in the transaction that saves the value and writes the activity-log entry with the old and new values; the owner, the admin and staff can read them (ST-15.3, AT-45 settings part).

## 7. Documents and PDFs

- Each printout (16.1–16.7) is a server-rendered HTML page using the Plate print styles, in the language chosen at print (PR-10); A4 and 80 mm layouts with CSS `@page`.
- **Counter printing** (agreements, bills, receipts) uses the browser's print.
- **Server PDFs** (partner statements, payslips, report PDFs) are made by the worker with headless Chromium (Playwright), one job at a time; fonts (Yaldevi, Gemunu Libre, IBM Plex Mono) are embedded from `fonts/`.
- The printed backup pack and the evening fleet list (outage fallback, AT-81) are documents of the same kind; their designs are still to be made (PRD ST-17.2).

## 8. Background jobs (pg-boss)

| Job | When (Asia/Colombo) | Does |
| --- | --- | --- |
| Day close | 11:59 PM, unless staff closed the day | Finalises the day's rent lines (AT-27, AT-71) |
| Bank flag | Daily | Flags bank and card payments waiting more than 3 days (AT-73) |
| Reminders | Daily, early morning | Creates upcoming-work items from dates, km and lead times (AT-45) |
| Nightly backup | 2:00 AM | `pg_dump` to R2, kept 30 days; failure alerts Dulan and the owner's home (AT-82) |
| Restore test | Monthly | Restores last night's backup into a scratch database and checks row counts |
| PDF | On request | Renders one PDF at a time |

Jobs are singletons (never two at once) and safe to run twice.

## 9. Interface and languages

- **Plate:** the 26 components in `design-system/components/` are ported to typed React components in `app/src/ui` with the same names and props as `index.d.ts`; styles are plain CSS using `tokens.css`. A build check fails if the app's tokens differ from `design-system/tokens.json`. New components are added to `design-system/` first (rank 4), then here.
- **Screens** follow `screens/`; desktop and phone layouts from the same components; installable on a phone as a web app (no app-store app).
- **Languages:** next-intl with `si.json` and `en.json` having the same keys (a build check fails on a missing key); each person's language is saved on their account; Sinhala is the default (PR-01). Numbers are whole rupees with Sri Lankan grouping.

## 10. Environments, deployment and recovery

| | Live | Test copy |
| --- | --- | --- |
| Address | the SNS `.lk` domain | `try.<domain>` |
| Database | `sns` | `sns_try`, sample data only |
| Storage | R2 bucket `sns-live` (private) | R2 bucket `sns-try` (private) |
| Marker | none | "TEST · not real" banner |

- **Server:** one 2 GB DigitalOcean droplet (Bangalore or Singapore, chosen by a speed test from Elpitiya) with DigitalOcean daily backups; all accounts in the owner's name; about LKR 5,000 a month (DN-19).
- **Deploy:** GitHub Actions runs lint, type check and all AT tests, builds one Docker image, and on a tagged release deploys over SSH: migrate, then start the new version; rolling back is starting the previous tag. Migrations only add (expand), so the previous version still runs during a rollback.
- **Recovery:** at most one day lost, back within 4 working hours (DN-18): restore the droplet backup or rebuild from the repository and restore the latest R2 dump; the runbook is `app/docker/RECOVERY.md`, tested monthly.

- **Build context:** the app's build copies Plate from `design-system/` and the fonts from `fonts/` (`app/scripts/sync-plate.mjs`), so the Docker build uses the repository root as its context, not `app/` alone.

## 11. Monitoring and logs

- Free uptime check every few minutes and free-tier error tracking, both emailing Dulan. Personal data (names, NIC, phone, photos) is removed before anything is sent to the error tracker.
- Server logs kept 14 days. Backup and restore-test results are recorded as jobs and shown to the owner when they fail.

## 12. Testing

- **Rules:** Vitest against a real PostgreSQL test database (migrations applied), one file per AT: `tests/at/at-03.test.ts` checks the one-day Wagon R bill, and so on.
- **Journeys:** Playwright on desktop and phone sizes for screen-level ATs (handover blocked, permissions, filtered lists, lockout).
- **Coverage gate:** a check lists every `AT-nn` in the system design and fails if any has no test; CI runs everything on every push and blocks a release on any failure.
- **Sinhala printing:** a visual test renders each 16.x document in Sinhala and English and compares it with an approved image.

## 13. Security and privacy

- HTTPS only; secure cookies; CSRF protection from server actions; input validated on the server.
- Private files only through the app; every opening logged (AT-59); copies kept 7 years after the last rental, then listed for the owner to delete (DN-02).
- Secrets in the server's environment file, never in the repository; database users split: the app role cannot update or delete insert-only tables.
- Partner data isolation is checked on every request (AT-22).

## 14. To check when setting up

- **Resend account and the SNS sending domain** (needed before go-live for email codes and reset, #28): the Resend free plan, no payment (T8); the account is opened by Dulan. Proposed: Dulan, 1 Nov 2026; for the owner to confirm. Still to do: verify the SNS sending domain in Resend (its DNS records) and set `RESEND_API_KEY` and `EMAIL_FROM` on the server. The free plan's current sending limits are a fact to confirm (below).

These are facts to confirm, not decisions: current free-plan limits (Resend, error tracker, uptime check, Cloudflare R2), the DigitalOcean region by a speed test from Elpitiya, and the dollar exchange rate for the monthly cost.
