# SNS Rent Car · Product requirements (PRD)

What the SNS Rent Car system must do, written as stories a developer can build and a tester can check.

This document is **derived** from `SNS_SYSTEM_DESIGN.md`, the source of truth (rank 1). The PRD is rank 2: it may restate, detail or split what the source of truth says, never contradict or extend it. Where they differ, the source of truth wins and this file is corrected. Every story links to the system design sections it comes from, by name, and lists the acceptance scenarios (AT-01 to AT-49) that check it. Changes follow `.agents/skills/sns-change-control/SKILL.md`: the source of truth first, then this file.

Status of this draft: front section and Phase 1 stories, written with Dulan from 26 Oct 2026, for review. Phases 2 to 4 are not yet written.

## 1. Sources

| Source | What this PRD takes from it |
| --- | --- |
| `SNS_SYSTEM_DESIGN.md` | Every requirement, rule, status and acceptance scenario |
| `proposal/` (approved, frozen) | The four delivery phases each module belongs to; nothing else |
| `screens/` | The screens each story uses (`NN.n`). Screens show sample data and never add a rule |
| `brand/guidebook/`, `design-system/` | How screens look and read; cited where a story depends on it |

## 2. How to read a story

Each story has the same parts. An example of the shape (not a real story):

> **ST-05.2 · Choose a car**
> - **Status:** Confirmed. Other values: Derived control (review before build), Proposed (not built until agreed).
> - **Phase:** 2, from the approved proposal.
> - **Roles:** Staff, Admin. Defaults from [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions); all configurable.
> - **Story:** As staff, I can pick a free car so that the rental gets the right car and package.
> - **Rules:** what it must obey, each linked to its section of the system design by name.
> - **Checks:** the acceptance scenarios from [Acceptance scenarios for implementation planning](SNS_SYSTEM_DESIGN.md#19-acceptance-scenarios-for-implementation-planning), by ID and in words, for example AT-08 "Two employees submit handovers for the same car: only one succeeds". A check written here that has no AT-ID is marked *Proposed check* and is not a requirement until it is added to the system design.
> - **Screens:** 05.2 Choose a car.
> - **Decisions needed:** DN-nn, where an open decision blocks part of the story.

- **Status** is copied from the source of truth and never raised here. Only the owner, S D De Silva, confirms a rule; Dulan records it in the source of truth.
- **Open** items are never answered in a story. They appear as `Decision needed` (section 7) and the story says what waits on them.
- IDs follow the screen modules: `ST-05.3` is the third story in module 05. Screen numbers are `NN.n` as in `screens/README.md`.

## 3. Roles

From System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts). Permissions are configurable; the defaults are in System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).

| Role | Who | Sees and does |
| --- | --- | --- |
| **Owner** | The primary owner, S D De Silva; one of the two admins | Everything, the owner dashboard, and sets critical permissions for others |
| **Admin** | The additional admin | What the owner allows |
| **Staff** | Three employees | Daily operations by permission; their own payslips and advance or loan balances |
| **Partner** | A vehicle owner who is not SNS; one account for all their cars | Only their own final earnings (by day and by car, PDFs), their cash-out history, and asking for a cash-out. Never today's not-final amounts, other partners' data or customer details |

Customers have no accounts (System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts)). They get printed documents (System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports)).

## 4. Phases

From the approved proposal. Price and payments are in the proposal and are not repeated here.

| Phase | When | Promised |
| --- | --- | --- |
| 1 · Foundation | Month 1 | Staff accounts and permissions, customers and documents, cars and packages, partner owners |
| 2 · Rentals | Months 2–3 | Rentals, agreement print, handover and return, bill, extensions, swaps, payments, deposits, customer debt, fuel and accessories; advance reservations (added by ADD-001) |
| 3 · Money | Months 4–5 | Cash drawer and daily count, partner payments (daily cash-out) and partner portal, expenses, payroll, maintenance reminders, vehicle check |
| 4 · Live | Month 6 | Owner dashboard, reports, full testing, going live, staff training; loading starting data (added by ADD-002) |

## 5. Modules

Agreed with Dulan, 26 Oct 2026.

| Module | Screens | Phase | Section |
| --- | --- | --- | --- |
| 01 Start | 01.1–01.3 | 1 | [01 Start](#01-start) |
| 15 Settings | 15.1–15.5 | 1 | [15 Settings](#15-settings) |
| 08 Customers | 08.1–08.5 | 1 | [08 Customers](#08-customers) |
| 04 Cars | 04.1–04.7 | 1 | [04 Cars](#04-cars) |
| 11 Partners: owners | 11.1–11.3 | 1 | [11 Partners: owners](#11-partners-owners) |
| 05 New rental | 05.1–05.8 | 2 | Not yet written |
| 06 Rentals | 06.1–06.8 | 2 | Not yet written |
| 07 Return | 07.1–07.3 | 2 | Not yet written |
| 09 Money: payments | 09.3–09.5 | 2 | Not yet written |
| 08 Customers: write-off | 08.6 | 2 | Not yet written |
| 10 Approvals | 10.1–10.4 | 2 | Not yet written |
| 16 Documents: rental | 16.1–16.4 | 2 | Not yet written |
| 02 Home: staff and search | 02.2, 02.4 | 2 | Not yet written |
| 18 Reservations | 18.1–18.5 | 2 | Not yet written |
| 09 Money: drawer, day and expenses | 09.1–09.2, 09.6–09.13 | 3 | Not yet written |
| 11 Partners: cash-outs and portal | 11.4–11.8 | 3 | Not yet written |
| 13 Payroll | 13.1–13.5 | 3 | Not yet written |
| 12 Maintenance | 12.1–12.2 | 3 | Not yet written |
| 03 Morning check | 03.1–03.4 | 3 | Not yet written |
| 16 Documents: partner and payslip | 16.5–16.7 | 3 | Not yet written |
| 02 Home: owner | 02.1, 02.3, 02.5–02.6 | 4 | Not yet written |
| 14 Reports | 14.1–14.2 | 4 | Not yet written |
| Starting data | No screen: loaded by the developer; the Imported marker is in 17.1, 08.2, 11.2 | 4 | Not yet written |
| 17 System states, 19 Navigation | 17.1–17.2, 19.1 | All | Not yet written |

## 6. Rules for every module

These apply to every story and are not repeated in each.

| ID | Rule | Status | Source |
| --- | --- | --- | --- |
| PR-01 | Sinhala is the default interface language; each user can switch to English. Plain everyday Sinhala; English only for words SNS already uses. | Confirmed | System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context), [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports); [Guidebook: language and voice](brand/guidebook/04-language-and-voice.md) |
| PR-02 | Works on office computers and phones. | Confirmed | System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context) |
| PR-03 | Online only; no offline operation. | Confirmed | System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) |
| PR-04 | The system starts with SNS's existing records, opening balances and past rentals and money records, loaded once before go-live and marked "Imported". Opening balances are never earnings; cash introduced after launch is a cash movement, not rental earnings. | Confirmed (CR-003) | System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data), [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) |
| PR-05 | Every transaction records the staff member who entered it. Every exceptional decision records a reason, actor, date and time. | Confirmed | System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions) |
| PR-06 | Permissions are configurable, starting from the defaults in System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions). They are enforced by the server on every request, not only by hiding menu items. | Confirmed; enforcement is a Derived control | System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions), [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls); AT-24 |
| PR-07 | Money that is final is never edited; a correction is a new dated line that keeps the original. | Confirmed | System design → [Corrections and write-offs](SNS_SYSTEM_DESIGN.md#83-corrections-and-write-offs), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out) |
| PR-08 | Each rental keeps the terms that applied when it was agreed (prices, commission, cutoff, deadline); package changes affect new rentals only. | Confirmed; snapshot storage is a Derived control | System design → [Historical terms](SNS_SYSTEM_DESIGN.md#43-historical-terms); AT-05 |
| PR-09 | Never invent data; sample and example values are labelled. Nothing is called "profit" until the owner defines SNS earnings. Deposits are held money, not income. | Confirmed | System design → [Deposits](SNS_SYSTEM_DESIGN.md#82-deposits), [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting); `AGENTS.md` [Vehicles, packages, and historical terms](SNS_SYSTEM_DESIGN.md#4-vehicles-packages-and-historical-terms) |
| PR-10 | Printed agreements, receipts and bills are available in Sinhala or English. | Confirmed | System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports) |
| PR-11 | Report exports (Excel and PDF) need their own permission. | Confirmed | System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions), [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports) |
| PR-12 | Data is backed up automatically every day. | Confirmed | System design → [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) |
| PR-13 | Staff with customer access see full NIC and phone numbers; no masking. | Confirmed | System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents) |
| PR-14 | No GPS, automatic bank verification, payment integration, fraud guarantees or customer trust scores. | Confirmed | System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context) (no trust guarantee), [Collection](SNS_SYSTEM_DESIGN.md#81-collection) (manual recording), [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring) (no fraud guarantee), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) (GPS, payment integration); `AGENTS.md` [Vehicles, packages, and historical terms](SNS_SYSTEM_DESIGN.md#4-vehicles-packages-and-historical-terms) (no trust scores) |
| PR-15 | Business times are read in Asia/Colombo. | Proposed | System design → [Business-wide timing](SNS_SYSTEM_DESIGN.md#51-business-wide-timing) |

## 7. Decisions needed

Every Open item in the source of truth, with the stories it blocks. A story never assumes an answer to one of these. When the owner decides, the source of truth changes first, then the stories.

| ID | Open decision | In the system design | Blocks | Phase | Decides |
| --- | --- | --- | --- | --- | --- |
| DN-01 | Exact permission catalogue, delegation limits, whether a requester may approve their own price or payment correction, approval workflow | [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 15 Settings, 10 Approvals | 1, 2 | SNS owner |
| DN-02 | Document retention, deletion and access scope | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 08 Customers, 06 Rentals | 1 | SNS owner with advice |
| DN-03 | Login recovery and stronger protection for owner and admin accounts | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 01 Start, 15 Settings | 1 | SNS owner with developer |
| DN-04 | Garage-day charge: what triggers it, who decides it, how it is split on a partner car | [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings) | 07 Return | 2 | SNS owner |
| DN-05 | Whether a missing accessory or the fuel level blocks handover; how an accessory-shortage charge is split on a partner car | [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents) | 06 Rentals, 07 Return | 2 | SNS owner |
| DN-06 | Fuel charging workflow: same-level return versus paid fuel | [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 06 Rentals, 07 Return | 2 | SNS owner |
| DN-07 | Swaps: allowance pool on a swap day when allowances differ, rounding, partial-day earnings outside the admin-allocated day | [Vehicle swaps](SNS_SYSTEM_DESIGN.md#75-vehicle-swaps), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 06 Rentals | 2 | SNS owner |
| DN-08 | Amended agreement or signature after an extension or swap | [Vehicle swaps](SNS_SYSTEM_DESIGN.md#75-vehicle-swaps), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 06 Rentals, 16 Documents | 2 | SNS owner |
| DN-09 | Effect of an early return on included kilometres | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 07 Return | 2 | SNS owner |
| DN-10 | Charge and discount allocation, and currency rounding | [Vehicle swaps](SNS_SYSTEM_DESIGN.md#75-vehicle-swaps), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 07 Return, 11 Partners, 13 Payroll | 2, 3 | SNS owner with developer |
| DN-11 | Business-day close time, which also decides when partner earnings become final | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 09 Money, 11 Partners | 3 | SNS owner |
| DN-12 | How partner cash-outs paid in cash (allowed), salaries and owner withdrawals show in the drawer count and the expected cash | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 09 Money, 11 Partners, 13 Payroll | 3 | SNS owner |
| DN-13 | Payment-processor fees, bank and card posting delays, evidence needed to resolve a cash difference | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation) | 09 Money | 3 | SNS owner |
| DN-14 | Cash-out limits and frequency, if any; a returned car segment while its swapped rental is still open; final recovery when a retired car or partner has no future earnings | [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 11 Partners | 3 | SNS owner |
| DN-15 | Payroll deduction limits, rounding, adjustments after finalisation, deductions above net salary | [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 13 Payroll | 3 | SNS owner |
| DN-16 | Reporting definitions: what counts as SNS earnings ("profit"), depreciation, when expenses and earnings are recognised, the utilisation measure, comparing an unfinished month | [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 02 Home (owner), 14 Reports | 4 | SNS owner |
| DN-17 | Outage procedure for an online-only branch | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 17 System | 4 | SNS owner |
| DN-18 | Acceptable data loss and recovery time (daily backup itself is Confirmed) | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | TRD | 4 | SNS owner with developer |
| DN-19 | Hosting vendor and technology stack | [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | TRD | — | Dulan and SNS owner |
| DN-20 | Wording of the customer and partner agreements (SNS approves, Sinhala and English), and how the partner agreement is signed and uploaded | [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports) | 11 Partners, 16 Documents, 01 Start (go-live checklist) | 1, 2 | SNS owner |

## 8. Proposed, not yet agreed

Built only after the owner agrees and the source of truth marks them Confirmed.

| Item | In the system design | Note |
| --- | --- | --- |
| Optional catalogue photo per car | [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); AT-29 | Change request `change-requests/CR-001-vehicle-catalogue-photo.md`, awaiting the owner |
| Business times in Asia/Colombo; exact day-boundary and business-day-close calculations | [Business-wide timing](SNS_SYSTEM_DESIGN.md#51-business-wide-timing) | Needs worked examples and confirmation |
| Recorded payment status kept separate from reconciliation status | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation) | Reconciliation model |
| Responsive web application, modular backend, relational database, private file storage | [Core records and relationships](SNS_SYSTEM_DESIGN.md#172-core-records-and-relationships) | Architecture candidate; the TRD takes it up |

## 9. Out of scope

From System design → [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) and the approved proposal's list of what is not included, less what the addenda have added. None of these is built.

| Item | Source |
| --- | --- |
| Offline operation | System design → [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); proposal |
| Automatic customer reminders (SMS, WhatsApp) | System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); proposal |
| Bank, card or payment-provider integration | System design → [Collection](SNS_SYSTEM_DESIGN.md#81-collection), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); proposal |
| Separate driver records | System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) |
| Attendance, overtime, automatic statutory (EPF/ETF) calculations | System design → [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); proposal |
| GPS tracking | System design → [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); proposal |
| Non-rental vehicle movement tracking (future extension) | System design → [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) |
| An app-store app (the website works like an app on a phone) | System design → [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope); proposal |

## 10. Phase 1 · Foundation

Month 1: who signs in and what they may do, customers and their documents, cars and packages, partner owners. Written with Dulan, 26 Oct 2026, for review. Parts that use later phases (rentals, money, the partner portal) say so; they are built in their own phase.

### 01 Start

#### ST-01.1 · Sign in

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Owner, Admin, Staff, Partner.
- **Story:** As anyone who works with SNS, I sign in with my own phone number and password, so that everything I do is recorded under my name.
- **Rules:**
  - Everyone has their own account; nobody shares one. Every transaction records who entered it, even though staff share one cash drawer. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - A forgotten password is reset by the primary owner until login recovery is decided. There is no self-service reset. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - After signing in, each person reaches only what their permissions allow; a partner reaches only the partner pages (PR-06).
- **Checks:** AT-46 "A staff member forgets their password: the primary owner resets it; the staff member changes it at the next sign-in". AT-24 "Staff without a permission request those records directly: the server denies access".
- **Screens:** 01.1 Sign in.
- **Decisions needed:** DN-03 (password rules, login recovery, stronger protection for owner and admin accounts).

#### ST-01.2 · First sign-in

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Owner, Admin, Staff, Partner.
- **Story:** As a new person, at my first sign-in I replace the first password I was given and choose my language, so that only I know my password and the system speaks my language.
- **Rules:**
  - The first password is changed at the first sign-in. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - Sinhala is the default; each person can switch to English at any time (PR-01).
- **Checks:** AT-46 (the new password is set at the next sign-in). *Proposed check:* a person signed in with a first password reaches nothing else until they have set their own.
- **Screens:** 01.2 First sign-in · set password.
- **Decisions needed:** DN-03 (password rules).

#### ST-01.3 · Go-live checklist

- **Status:** Confirmed.
- **Phase:** 1 for the checklist, which fills in as setup is done; it holds back go-live in Phase 4.
- **Roles:** Owner.
- **Story:** As the owner, I see what is still missing before go-live, so that the system starts only when everything it needs is in.
- **Rules:**
  - Go-live waits until all of these are done: business details on printouts; every car entered; starting packages; insurance and licence dates for every car; every partner car linked to its owner; staff accounts; the authorised person for checking payments, write-offs, cancellation fees and expired papers; opening cash in the drawer, counted and entered before the first transaction; SNS's agreement wording; and every Open decision. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - SNS's old records are loaded by the developer once before go-live, approved by the owner and marked "Imported"; rentals still out on go-live day are entered as live rentals marked "Started before go-live" (PR-04; System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data)). The loading is Phase 4.
- **Checks:** AT-43 "One car still has no insurance date on go-live day: go-live is blocked until it is entered".
- **Screens:** 01.3 Ready to start · setup checklist.
- **Decisions needed:** every decision in section 7 must be settled before go-live; the checklist shows how many are left.

### 15 Settings

#### ST-15.1 · Set permissions

- **Status:** Confirmed for the defaults; the full list of permissions is Open (DN-01). "Nobody can do it until the authorised person is set" is a Derived control.
- **Phase:** 1.
- **Roles:** Owner only changes permissions.
- **Story:** As the owner, I decide what the admin and each staff member may do, starting from the agreed defaults, so that each person has the access their job needs.
- **Rules:**
  - Every person starts from the agreed defaults; the owner can change them for each person. The owner can do everything and is not listed. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - Payroll is one permission covering preparation, finalising and payment. Exporting reports is a separate permission (PR-11). Paying partner cash-outs is the admin's by default and may be given to chosen staff. System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - Checking payments, writing off a debt, keeping a cancellation fee and going ahead with expired papers belong to an authorised person. Until the owner names one, nobody can do them (Derived control); naming one is on the go-live checklist.
  - Every change is recorded with who made it and when (PR-05), and permissions are checked by the server on every request (PR-06).
- **Checks:** AT-24 "Staff without export or payroll permission request those records directly: the server denies access, even outside normal navigation". *Proposed check:* the owner changes a permission; the activity log shows the change, who made it and when.
- **Screens:** 15.1 Permissions.
- **Decisions needed:** DN-01 (exact permission list, delegation limits, whether a person may approve their own request). Until it is decided, the list is the rows of the defaults table, and the approvals screen (Phase 2) says so when the requester and the approver are the same person.

#### ST-15.2 · People

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Owner.
- **Story:** As the owner, I add the admin and staff, see everyone who has an account and turn off the account of someone who leaves, so that each person has their own sign-in.
- **Rules:**
  - SNS has one primary owner, one additional admin and three staff; each partner has one account for all their cars. System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context), [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - A new person signs in with their phone number, gets a first password to change at first sign-in, and starts with their role's default permissions, which the owner can then change (ST-15.1). Sinhala is the default language (PR-01).
  - A partner's account is made when the partner is added (ST-11.2).
  - When someone leaves, the owner turns off their account, with a reason: sign-in stops, and everything they recorded keeps their name. A partner's balance stays and can still be paid out. The owner can turn it back on. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - Adding a person and turning an account off or on are recorded in the activity log (PR-05).
- **Checks:** AT-46. AT-47 "The owner turns off the account of a staff member who left: they can no longer sign in; everything they recorded keeps their name". *Proposed check:* a new staff member starts with the agreed staff defaults and must change the first password before anything else.
- **Screens:** 15.3 People, 15.4 Add a person.
- **Decisions needed:** DN-01 (whether anyone besides the owner may add people), DN-03.

#### ST-15.3 · Business rules and open decisions

- **Status:** Confirmed for each rule set now; the rest are Open and listed, never answered.
- **Phase:** 1.
- **Roles:** Owner changes owner settings; everyone with settings access sees them.
- **Story:** As the owner, I see the business rules in force and the decisions still open, and I change the settings that are mine, so that everyone works to the same rules.
- **Rules:**
  - Set now: extra-km rates per car, starting at LKR 17 to 27 a km by type (System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults)); fuel price per litre, an owner setting with no agreed figure ([Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope)); staff see the expected drawer cash first, then type what they count ([Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation)); expired insurance or licence warns, and going ahead needs an authorised person and a reason; any garage visit is Under repair; reminder lead times, starting at 30 days for insurance and licence, 7 days or 500 km for service and 3 days for payroll, changeable by the owner ([Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability)); no late fee runs on its own, staff decide ([Early and late return](SNS_SYSTEM_DESIGN.md#74-early-and-late-return)); partners cash out any day, to the bank or in cash at the branch ([Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out)); SNS commission per partner car, default 15%; garage-day charge LKR 5,000 a day per car ([Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings)).
  - Still to decide: each Open decision is shown as open. The screen offers no setting for it until the owner decides and the system design records it.
  - Every change to a setting is recorded with who, when, and the old and new values (PR-05).
- **Checks:** AT-45 "A car's insurance expires in 30 days, with the starting reminder settings: it appears in Upcoming work; the owner can change how early" (the reminders themselves are Phase 3). *Proposed check:* an open decision appears as still to decide and has no value anyone can set.
- **Screens:** 15.2 Business rules and open decisions.
- **Decisions needed:** shown here: DN-04 (garage-day charge), DN-06 (fuel charging), DN-11 (business-day close), DN-12 (cash leaving the drawer), DN-15 (payroll deductions), DN-16 (SNS earnings).

#### ST-15.4 · Activity log

- **Status:** Confirmed; "can't be edited or deleted" is a Derived control.
- **Phase:** 1; entries fill in as each phase adds its actions.
- **Roles:** Owner.
- **Story:** As the owner, I see every recorded action and every exceptional decision with its reason, by person and by kind, so that I can check what happened and who did it.
- **Rules:**
  - Every transaction records who entered it; every exceptional decision records the reason, the person, the date and the time (PR-05).
  - Entries are never edited or deleted, by anyone (System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls)).
  - The owner's daily summary of exceptional decisions is built from this log and is shown on the owner's home in Phase 4. System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring).
- **Checks:** *Proposed check:* nobody, the owner included, can change or delete an entry.
- **Screens:** 15.5 Activity log.
- **Decisions needed:** DN-01 (whether the admin may see the log).

### 08 Customers

#### ST-08.1 · Find a customer

- **Status:** Confirmed.
- **Phase:** 1; debts show once rentals and payments run (Phase 2).
- **Roles:** Staff, Admin, Owner (anyone with customer access).
- **Story:** As staff, I find a customer by name, NIC or phone, and I see first the people who owe money, are flagged or have an expired licence, so that I notice them before renting.
- **Rules:**
  - Staff with customer access see full NIC and phone numbers (PR-13).
  - No ratings, scores or trust labels (PR-14); the system supports the staff's decision and does not judge the customer. System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context).
- **Checks:** *Proposed check:* customers who owe money, are flagged or have an expired licence are listed before the others.
- **Screens:** 08.1 Customers.

#### ST-08.2 · Add a customer with documents

- **Status:** Confirmed; private storage of the copies is a Derived control.
- **Phase:** 1.
- **Roles:** Staff, Admin, Owner. Approving a first-time customer: staff or admins (System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions)).
- **Story:** As staff, I record a new customer's identity, licence and document copies, so that they can be rented to.
- **Rules:**
  - Staff record identity and licence details and keep copies of the documents. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - Name, NIC, phone, and licence number and expiry are needed to save. The ID and licence copies may come later: until they are in, the customer shows "copies missing". System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - Handover is blocked until the customer's ID copy and licence copy are in. A reference person is needed only when staff decide; their ID and licence copies are then required too. System design → [Handover requirements](SNS_SYSTEM_DESIGN.md#handover-requirements).
  - The copies are private: only people with permission open them, never through a public link. System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
  - An imported customer whose copies were not in SNS's books needs them before their next handover. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
- **Checks:** AT-06 "Missing signed agreement or customer ID or licence copy: handover blocked" and AT-07 "Reference person required but their licence copy missing: handover blocked" (both checked at handover, Phase 2). AT-49 "Staff save a new customer without the licence copy: saved, shows copies missing, handover blocked until it is added". *Proposed check:* a customer whose NIC is already recorded is not added twice; the existing customer opens instead.
- **Screens:** 08.3 New customer with documents.
- **Decisions needed:** DN-02 (how long copies are kept, deletion, who may open them).

#### ST-08.3 · Customer details

- **Status:** Confirmed.
- **Phase:** 1; debts, payments and rentals fill in from Phase 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see a customer's details, documents, warnings, debts and rentals in one place, and I can correct their details, so that I know who I am dealing with.
- **Rules:**
  - Past rentals from SNS's books show marked "Imported", read-only and never recalculated. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - An old debt shows before every new rental until it is paid. Recording a payment is Phase 2; writing off a debt is for the authorised person only. System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions), [Corrections and write-offs](SNS_SYSTEM_DESIGN.md#83-corrections-and-write-offs).
  - Decisions taken for this customer show with their reason, person and time (PR-05).
- **Checks:** AT-37 "An imported past rental is opened: shown marked Imported, read-only, never recalculated".
- **Screens:** 08.2 Customer details.
- **Decisions needed:** DN-02.

#### ST-08.4 · Warnings before a rental

- **Status:** Confirmed.
- **Phase:** 1 for the warning; it appears in New rental in Phase 2.
- **Roles:** Staff, Admin go ahead despite a flag; only the authorised person goes ahead with an expired licence.
- **Story:** As staff, before renting to a customer I see their flags and an expired licence, and I go ahead only with a reason, so that the risk is a recorded decision.
- **Rules:**
  - A flag warns before every future rental; staff may go ahead with a recorded reason. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - An expired driving licence warns; only an authorised person may go ahead, with a reason. Going ahead does not make the licence valid. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - The reason is recorded with the name and the time, and goes into the owner's daily summary. System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring).
- **Checks:** *Proposed check:* with an expired licence, staff without the permission cannot go ahead; the authorised person can, with a reason, and the licence still shows as expired. *Proposed check:* with a flag, staff go ahead only after typing a reason; the reason, name and time are recorded.
- **Screens:** 08.4 Flag and expired licence warning.

#### ST-08.5 · Flag a customer

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I flag a customer for unpaid money, damage or another reason, so that everyone is warned before their next rental, and I close it with a reason when it no longer applies.
- **Rules:**
  - The reasons are unpaid money, damage or something else; what happened must be written. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - Staff or admins close a flag with a reason, for example when the money is paid. A closed flag stops warning but stays in the customer's history with who closed it and when; nothing is deleted. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - No ratings or scores (PR-14). Flags from SNS's books come with imported customers. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
- **Checks:** AT-48 "Staff close a customer's flag with a reason: no warning at the next rental; the flag, its reason, who closed it and when stay in the history". *Proposed check:* a flagged customer shows the flag before the next rental, to every person.
- **Screens:** 08.5 Add a customer flag.

### 04 Cars

#### ST-04.1 · All cars

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see every car with its owner, package and status, so that I know which cars can be rented.
- **Rules:**
  - About 30 cars at launch, SNS-owned and partner-owned. System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context).
  - Each car shows its own package (rate, km a day, extra km) and its status (ST-04.5).
- **Checks:** none in the system design.
- **Screens:** 04.1 All cars.

#### ST-04.2 · Car details

- **Status:** Confirmed; who sees a partner's earnings and terms is part of DN-01.
- **Phase:** 1; rentals, reservations, payments and earnings fill in from Phases 2 and 3.
- **Roles:** Owner sees everything; staff see the car without the partner's earnings and terms (screens 04.2 and 04.3).
- **Story:** As the owner, I see a car's status, papers and service, terms, the partner's earnings from it and its history, so that I know how each car is doing.
- **Rules:**
  - SNS-owned cars have no partner earnings or cash-outs. System design → [Historical terms](SNS_SYSTEM_DESIGN.md#43-historical-terms).
  - Past rentals from SNS's books show marked "Imported" and add no earnings. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - Earnings show only once final. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
- **Checks:** AT-37.
- **Screens:** 04.2 Car details · owner, 04.3 Car details · staff.
- **Decisions needed:** DN-01 (who sees partner earnings and terms).

#### ST-04.3 · Add or edit a car and its package

- **Status:** Confirmed; storing the terms on each rental is a Derived control (PR-08).
- **Phase:** 1.
- **Roles:** Admin, Owner. System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults).
- **Story:** As an admin, I add a car and set its package and terms, so that new rentals use them.
- **Rules:**
  - A car records: SNS or partner (and which partner); daily rate, km included a day and extra-km rate; SNS commission, default 15%; long-rental extra, default LKR 500 a day from day 6; garage-day charge, default LKR 5,000 a day; agreed payment terms and who pays which costs. System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings).
  - A new car starts with its type's starting package (ST-04.4) and can then be changed. System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults).
  - Changes apply to new rentals only; running rentals and their extensions keep their terms (PR-08). Each change records who, when, and the old and new values (PR-05).
  - Fuel income is always SNS's. System design → [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation).
- **Checks:** AT-05 "Admin changes the package while a rental is active: the old rental and its extension keep the old terms; a new rental uses the new ones".
- **Screens:** 04.4 Edit car, package and terms.
- **Decisions needed:** DN-04 (when the garage-day charge applies; the amount is stored, never charged until decided).

#### ST-04.4 · Starting packages

- **Status:** Confirmed; the extra-km rates are design rates, final per car.
- **Phase:** 1.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I keep the starting package for each car type and the shared defaults, so that a new car starts with the right terms.
- **Rules:**
  - Starting packages: Wagon R and Spacia 4,500 a day; Every (van) 5,000; Alto 4,000; Prius and Axio 6,500; 100 km a day each; extra km 25, 25, 17 and 27 a km. System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults).
  - Shared defaults: SNS commission 15%, long-rental extra LKR 500 a day from day 6, garage-day charge LKR 5,000 a day. System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings).
  - Changing a package never changes rentals already running (PR-08).
- **Checks:** AT-05.
- **Screens:** 04.6 Starting packages.

#### ST-04.5 · Change a car's status

- **Status:** Confirmed.
- **Phase:** 1; the handover block it causes is checked in Phase 2.
- **Roles:** Staff, Admin set Under repair or Temporarily unavailable; only an authorised person marks a car available again.
- **Story:** As staff, I mark a car Under repair or Temporarily unavailable with a reason, so that nobody hands it over.
- **Rules:**
  - A car under repair or unavailable cannot be handed over until an authorised person marks it available. Any garage visit, planned service included, is Under repair. System design → [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability).
  - The owner's own use marks the car unavailable with a reason and an expected return date, with no trip or km tracking.
  - A car that is sold or returned for good is retired: no new rentals, every past record kept.
  - Rented and Overdue come from the rental itself, not from this screen.
- **Checks:** AT-20 "Vehicle marked under repair: rental handover blocked until an authorised availability change". AT-25 "Retire a vehicle: no new rentals; history and money owed kept".
- **Screens:** 04.5 Change a car's status, 04.7 Car status blocks · reference.
- **Decisions needed:** DN-01 (who may set each status).

#### ST-04.6 · Papers and service dates

- **Status:** Confirmed.
- **Phase:** 1 for entering the dates; reminders are Phase 3; the expired-papers warning at handover is Phase 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I enter each car's insurance and revenue licence expiry and its next service date or km, so that reminders and warnings work.
- **Rules:**
  - Servicing is tracked by date and km, with repairs, insurance and revenue-licence expiry. Reminders come only from dates entered. System design → [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability).
  - Expired insurance or licence warns staff; going ahead needs the authorised person and a reason.
  - Every car's insurance and licence dates are on the go-live checklist (ST-01.3).
- **Checks:** AT-43. AT-45 (Phase 3).
- **Screens:** 04.2 Car details · owner and 04.4 Edit car (papers and service).

#### ST-04.7 · Catalogue photo

- **Status:** Proposed (change request CR-001, awaiting the owner). Not built until agreed.
- **Phase:** 1 if agreed.
- **Roles:** Admin adds or replaces it.
- **Story:** As an admin, I add one photo of a car for its card and page, so that staff recognise it.
- **Rules:** one optional photo per car; until one is added, the model's standard image shows. It is not a condition photo, not a handover requirement and not a customer document. System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings).
- **Checks:** AT-29 (Proposed).
- **Screens:** 04.4 Edit car (Add photo).

### 11 Partners: owners

#### ST-11.1 · Partner owners

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I see every partner with their cars, commission and account, and the partner cars not yet linked to an owner, so that every partner car has its owner before go-live.
- **Rules:**
  - Each partner has one account for all their cars. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - Every partner car linked to its owner is on the go-live checklist (ST-01.3).
- **Checks:** none in the system design.
- **Screens:** 11.1 Partner owners.

#### ST-11.2 · Add a partner

- **Status:** Confirmed.
- **Phase:** 1; cash-outs and the partner portal are Phase 3.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I add a partner with their cars and terms, so that they get their account and their agreement is ready to sign.
- **Rules:**
  - One account for all the partner's cars; the first password is changed at the first sign-in. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - For each car: SNS commission (default 15%), the agreed payment terms and who pays which costs. A cost not agreed is decided case by case by the admin. The daily rate is set on the car (ST-04.3). System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - A bank account is optional; without one, cash-outs are paid in cash at the branch. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - The partner agreement covers commission, the daily cash-out arrangement and who pays which costs, and is printed for signing. System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports).
  - A partner never sees the price a customer paid, customer details or other partners' data. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - Adding a partner is recorded in the activity log (PR-05).
- **Checks:** AT-44 "A partner without a bank account asks to cash out: an authorised person pays cash at the branch and records it once" (Phase 3).
- **Screens:** 11.3 Add a partner.
- **Decisions needed:** DN-20 (partner agreement wording, signing and upload). DN-01 (who may add a partner).

#### ST-11.3 · Partner details

- **Status:** Confirmed.
- **Phase:** 1; the starting balance is loaded in Phase 4; earnings and cash-outs are Phase 3.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I see a partner's cars and terms, their starting balance, their account and their agreement, so that I can answer the partner's questions.
- **Rules:**
  - The starting balance owed on go-live day is one "Opening balance" line, marked "Imported", final from go-live, can be cashed out and never counts as earnings. Past rentals of their cars from SNS's books add nothing. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - Terms changed here apply to new rentals only (PR-08).
- **Checks:** AT-36 "A partner's opening balance is loaded; past rentals of their cars are imported: the balance can be cashed out from go-live; the imported rentals add no earnings; nothing is paid twice".
- **Screens:** 11.2 Partner details.
- **Decisions needed:** DN-20.

### Gaps found while writing Phase 1

Questions for review; none is answered in a story. Decided gaps move into their story and the system design; the screens they touch (15.3 People: turning an account off; 08.2 Customer details: closing a flag; 08.3 New customer: save before the copies) are updated together once all are decided.

| Gap | Where | What it needs |
| --- | --- | --- |
| Whether a change to a starting package changes the existing cars of that type | 04.6 | The system design says only that new cars start with it |
| No screen for retiring a car | 04.5 has Under repair and Temporarily unavailable only | A design for ST-04.5's retire rule |
| One customer per NIC | 08.3 says "No customer with this NIC yet" | Confirm, then add a check to the system design |
