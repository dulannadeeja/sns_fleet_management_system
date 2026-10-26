# SNS Rent Car · Product requirements (PRD)

What the SNS Rent Car system must do, written as stories a developer can build and a tester can check.

This document is **derived** from `SNS_SYSTEM_DESIGN.md`, the source of truth (rank 1). The PRD is rank 2: it may restate, detail or split what the source of truth says, never contradict or extend it. Where they differ, the source of truth wins and this file is corrected. Every story links to the system design sections it comes from, by name, and lists the acceptance scenarios (AT-01 to AT-29) that check it. Changes follow `.agents/skills/sns-change-control/SKILL.md`: the source of truth first, then this file.

Status of this draft: front section and Phase 1 to 4 modules, written with Dulan from 26 Oct 2026. Sections not yet written say so.

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
| 01 Start | 01.1–01.3 | 1 | Not yet written |
| 15 Settings | 15.1–15.5 | 1 | Not yet written |
| 08 Customers | 08.1–08.5 | 1 | Not yet written |
| 04 Cars | 04.1–04.6 | 1 | Not yet written |
| 11 Partners: owners | 11.1–11.3 | 1 | Not yet written |
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
| DN-12 | Whether partner cash-outs, salaries and owner withdrawals paid in cash leave the drawer, and how they change the expected cash | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 09 Money, 11 Partners, 13 Payroll | 3 | SNS owner |
| DN-13 | Payment-processor fees, bank and card posting delays, evidence needed to resolve a cash difference | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation) | 09 Money | 3 | SNS owner |
| DN-14 | Cash-out limits and frequency, if any; a returned car segment while its swapped rental is still open; final recovery when a retired car or partner has no future earnings | [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 11 Partners | 3 | SNS owner |
| DN-15 | Payroll deduction limits, rounding, adjustments after finalisation, deductions above net salary | [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 13 Payroll | 3 | SNS owner |
| DN-16 | Reporting definitions: what counts as SNS earnings ("profit"), depreciation, when expenses and earnings are recognised, the utilisation measure, comparing an unfinished month | [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 02 Home (owner), 14 Reports | 4 | SNS owner |
| DN-17 | Outage procedure for an online-only branch | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | 17 System | 4 | SNS owner |
| DN-18 | Acceptable data loss and recovery time (daily backup itself is Confirmed) | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | TRD | 4 | SNS owner with developer |
| DN-19 | Hosting vendor and technology stack | [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope), [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | TRD | — | Dulan and SNS owner |

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
