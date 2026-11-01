# SNS Rent Car · Product requirements (PRD)

What the SNS Rent Car system must do, written as stories a developer can build and a tester can check.

This document is **derived** from `SNS_SYSTEM_DESIGN.md`, the source of truth (rank 1). The PRD is rank 2: it may restate, detail or split what the source of truth says, never contradict or extend it. Where they differ, the source of truth wins and this file is corrected. Every story links to the system design sections it comes from, by name, and lists the acceptance scenarios (AT-01 to AT-83) that check it. Changes follow `.claude/skills/sns-change-control/SKILL.md`: the source of truth first, then this file.

Status of this draft: front section and the stories for all four phases, written with Dulan from 26 Oct 2026, for review.

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
> - **Decided:** DN-nn, the decisions (section 7) the story depends on.

- **Status** is copied from the source of truth and never raised here. Only the owner, S D De Silva, confirms a rule; Dulan records it in the source of truth.
- **Open** items are never answered in a story. Each was settled and recorded in the system design first (section 7); a story names the decision it uses as `Decided`.
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
| 01 Start | 01.1–01.7 | 1 | [01 Start](#01-start) |
| 15 Settings | 15.1–15.7 | 1 | [15 Settings](#15-settings) |
| 08 Customers | 08.1–08.5 | 1 | [08 Customers](#08-customers) |
| 04 Cars | 04.1–04.7 | 1 | [04 Cars](#04-cars) |
| 11 Partners: owners | 11.1–11.3 | 1 | [11 Partners: owners](#11-partners-owners) |
| 05 New rental | 05.1–05.8 | 2 | [05 New rental](#05-new-rental) |
| 06 Rentals | 06.1–06.8 | 2 | [06 Rentals](#06-rentals) |
| 07 Return | 07.1–07.3 | 2 | [07 Return](#07-return) |
| 09 Money: payments | 09.3–09.5 | 2 | [09 Money: payments](#09-money-payments) |
| 08 Customers: write-off | 08.6 | 2 | [08 Customers: write-off](#08-customers-write-off) |
| 10 Approvals | 10.1–10.4 | 2 | [10 Approvals](#10-approvals) |
| 16 Documents: rental | 16.1–16.4 | 2 | [16 Documents: rental](#16-documents-rental) |
| 02 Home: staff and search | 02.2, 02.4 | 2 | [02 Home: staff and search](#02-home-staff-and-search) |
| 18 Reservations | 18.1–18.5 | 2 | [18 Reservations](#18-reservations) |
| 09 Money: drawer, day and expenses | 09.1–09.2, 09.6–09.13 | 3 | [09 Money: drawer, day and expenses](#09-money-drawer-day-and-expenses) |
| 11 Partners: cash-outs and portal | 11.4–11.8 | 3 | [11 Partners: cash-outs and portal](#11-partners-cash-outs-and-portal) |
| 13 Payroll | 13.1–13.5 | 3 | [13 Payroll](#13-payroll) |
| 12 Maintenance | 12.1–12.2 | 3 | [12 Maintenance](#12-maintenance) |
| 03 Morning check | 03.1–03.4 | 3 | [03 Morning check](#03-morning-check) |
| 16 Documents: partner and payslip | 16.5–16.7 | 3 | [16 Documents: partner and payslip](#16-documents-partner-and-payslip) |
| 02 Home: owner | 02.1, 02.3, 02.5–02.6 | 4 | [02 Home: owner](#02-home-owner) |
| 14 Reports | 14.1–14.2 | 4 | [14 Reports](#14-reports) |
| Starting data | No screen: loaded by the developer; the Imported marker is in 17.1, 08.2, 11.2 | 4 | [Starting data](#starting-data) |
| 17 System states, 19 Navigation | 17.1–17.2, 19.1 | All | [17 System, 19 Navigation, and running the system](#17-system-19-navigation-and-running-the-system) |

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
| PR-15 | Business times are read in Asia/Colombo. Every amount is a whole rupee. | Confirmed | System design → [Business-wide timing](SNS_SYSTEM_DESIGN.md#51-business-wide-timing), [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls) |

## 7. Decisions

Every decision that was Open in the system design, settled with Dulan for the owner on 26 Oct 2026 and recorded there first, as agreed by the owner. No Open decision is left. IDs are kept so the stories can name them.

| ID | Decision | In the system design | Checks |
| --- | --- | --- | --- |
| DN-01 | The defaults table is the full permission list (seven rows added); the owner may give any permission except adding people, changing permissions and turning accounts off or on; nobody approves their own request, and the owner's own approval is marked "self-approved" | [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions) | AT-57, AT-58 |
| DN-02 | Document copies kept 7 years after the last rental or settled debt, then deleted by the owner from a list; staff and admins with customer access open them, each opening logged; SNS to check the period against the Personal Data Protection Act | [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents) | AT-59 |
| DN-03 | Passwords of 8 or more characters; 5 wrong tries lock for 15 minutes; owner and admin get an emailed one-time code on a new device and reset their own password by email; the owner resets staff and partners; no SMS | [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts) | AT-60, AT-61 |
| DN-04 | Garage days only for damage during the rental; staff propose the days, an admin approves and corrects them, and splits them on a partner car | [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings) | AT-62, AT-63 |
| DN-05 | Fuel and accessories recorded at handover, never blocking it; an accessory charge on a partner car is the admin's decision | [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents) | AT-53, AT-54 |
| DN-06 | Fuel not counted by default; "same level" is a per-rental option charging missing litres at the owner's price; fuel taken out recorded in litres as an estimate, no money value | [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope) | AT-64 to AT-66 |
| DN-07 | Days before the swap go to the old car, after it to the new; the admin picks the swap day's car and divides its allowance | [Vehicle swaps](SNS_SYSTEM_DESIGN.md#75-vehicle-swaps) | AT-67 |
| DN-08 | No new signature after an extension or swap; the change shows on the final bill | [Vehicle swaps](SNS_SYSTEM_DESIGN.md#75-vehicle-swaps) | AT-68 |
| DN-09 | Included km follow the days actually charged after an early return | [Early and late return](SNS_SYSTEM_DESIGN.md#74-early-and-late-return) | AT-69 |
| DN-10 | Whole rupees everywhere; a partner's share rounds down and SNS takes the difference | [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls) | AT-03, AT-70 |
| DN-11 | Staff close the business day; if nobody does, it closes at 11:59 PM Asia/Colombo | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation) | AT-71 |
| DN-12 | Partner payouts, salaries and owner withdrawals paid in cash are their own drawer lines, lower the expected cash, and are never expense lines | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation) | AT-72 |
| DN-13 | Card fees monthly as an SNS expense; bank and card payments "waiting" up to 3 days, then flagged; a cash difference resolved by the authorised person with a note | [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation) | AT-73, AT-74 |
| DN-14 | No cash-out limits; a swapped-out car is paid as returned; an unpaid negative balance is written off by the authorised person | [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out) | AT-75, AT-76 |
| DN-15 | Deductions never take a salary below zero, the rest carries over; a finalised payslip is fixed by a later adjustment line | [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll) | AT-77, AT-78 |
| DN-16 | SNS earnings, profit before depreciation, counted when final, car use = rented days ÷ days in the fleet, unfinished month compared with the same days | [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting) | AT-79, AT-80 |
| DN-17 | Outage: phone data first, then the printed backup pack and evening fleet list, entered afterwards marked "entered after outage" | [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context) | AT-81 |
| DN-18 | At most one day lost, back within 4 working hours, backups kept 30 days, restore tested monthly | [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required) | AT-82 |
| DN-19 | Next.js and PostgreSQL on one 2 GB DigitalOcean server with daily backups; private Cloudflare R2 for documents and an off-site backup copy; about LKR 5,000 a month | [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context) | — |
| DN-20 | The partner agreement is printed, signed on paper, and staff record the date; SNS supplies both agreements' wording, Dulan enters it in Sinhala and English, the owner approves each version | [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports) | AT-83 |
| DN-21 | A negative earnings line (a correction) splits as the mirror of a positive one: the partner's share rounds toward zero and SNS takes the difference, so a full correction undoes the original; decided by the owner 31 Oct 2026 | [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls) | AT-84 |

## 8. Proposed, not yet agreed

Nothing at present. The catalogue photo (CR-001, addendum ADD-003), business times in Asia/Colombo and the reconciliation model are now Confirmed. The module layout inside the one application is for the TRD.

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
  - Staff and partners who forget their password ask the primary owner to reset it; the owner and the admin can also reset their own by email (DN-03). System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - *Proposed (Dulan, 1 Nov 2026):* a device is remembered for 30 days after a code; codes are 6 digits, 10 minutes, 5 tries; the owner sets the owner's and the admin's email, confirmed by a code; the email reset link works once for 1 hour and never shows which numbers have accounts. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - After signing in, each person reaches only what their permissions allow; a partner reaches only the partner pages (PR-06).
- **Checks:** AT-46 "A staff member forgets their password: the primary owner resets it; the staff member changes it at the next sign-in". AT-24 "Staff without a permission request those records directly: the server denies access".
- **Screens:** 01.1 Sign in, 01.4 Sign-in code, 01.5 Forgot password, 01.6 New password, 01.7 Confirm your email.
  - Passwords have at least 8 characters; 5 wrong tries lock the account for 15 minutes. The owner and the admin get an emailed one-time code when signing in on a new device and reset their own password by email (AT-60, AT-61).
  - *Proposed (Dulan, 1 Nov 2026):* the phone number is a Sri Lankan mobile number (10 digits, 070, 071, 072, 074, 075, 076, 077 or 078). The form names the box that is wrong for an empty box, a number not in that form, or a password under 8 characters; a well-formed number and password that do not match give one message that does not say which (the lock message after 5 wrong tries is the known exception, AT-60). System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
- **Decided:** DN-03.

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
- **Decided:** DN-03 (at least 8 characters).

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
- **Decided:** every decision in section 7 is settled. SNS's agreement wording, approved by the owner, is still an item to complete (DN-20).

### 15 Settings

#### ST-15.1 · Set permissions

- **Status:** Confirmed. "Only the owner until the authorised person is set" is a Derived control.
- **Phase:** 1.
- **Roles:** Owner only changes permissions.
- **Story:** As the owner, I decide what the admin and each staff member may do, starting from the agreed defaults, so that each person has the access their job needs.
- **Rules:**
  - Every person starts from the agreed defaults; the owner can change them for each person. The owner can do everything and is not listed. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - Payroll is one permission covering preparation, finalising and payment. Exporting reports is a separate permission (PR-11). *Proposed (Dulan, 1 Nov 2026):* both are the admin's by default, not staff's. Paying partner cash-outs is the admin's by default and may be given to chosen staff. System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - Checking payments, writing off a debt, keeping a cancellation fee and going ahead with expired papers belong to an authorised person. Until the owner names one, only the owner can do them, as the owner can do everything (Derived control); naming one is on the go-live checklist.
  - Every change is recorded with who made it and when (PR-05), and permissions are checked by the server on every request (PR-06).
- **Checks:** AT-24 "Staff without export or payroll permission request those records directly: the server denies access, even outside normal navigation". *Proposed check:* the owner changes a permission; the activity log shows the change, who made it and when.
- **Screens:** 15.1 Permissions.
  - The defaults table is the full list. The owner may give any permission to the admin or any staff member, except adding people, changing permissions and turning accounts off or on (AT-58). Nobody approves their own request; the owner's own is marked "self-approved" (AT-57). System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
- **Decided:** DN-01.

#### ST-15.2 · People

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Owner.
- **Story:** As the owner, I add the admin and staff, see everyone who has an account and turn off the account of someone who leaves, so that each person has their own sign-in.
- **Rules:**
  - SNS has one primary owner, one additional admin and three staff; each partner has one account for all their cars. System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context), [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - A new person signs in with their phone number, gets a first password to change at first sign-in, and starts with their role's default permissions, which the owner can then change (ST-15.1). Sinhala is the default language (PR-01).
  - *Proposed (Dulan, 1 Nov 2026):* the owner types the first password (8 or more characters) when adding a person or resetting a forgotten password, and gives it to them by hand; a reset ends their open sessions. The owner can reset the admin's password too; the admin can also reset their own by email. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - A partner's account is made when the partner is added (ST-11.2).
  - When someone leaves, the owner turns off their account, with a reason: sign-in stops, and everything they recorded keeps their name. A partner's balance stays and can still be paid out. The owner can turn it back on. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - Adding a person and turning an account off or on are recorded in the activity log (PR-05).
- **Checks:** AT-46. AT-47 "The owner turns off the account of a staff member who left: they can no longer sign in; everything they recorded keeps their name". *Proposed check:* a new staff member starts with the agreed staff defaults and must change the first password before anything else.
  - *Proposed (Dulan, 1 Nov 2026):* the owner types the admin's email on 15.4 (required for an admin) and can change the owner's or the admin's email on 15.6; a new email counts once a code sent to it is typed in. The owner's own row on 15.3 opens 15.6 for this. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
- **Screens:** 15.3 People, 15.4 Add a person, 15.6 Person (email, reset a password, turn an account off or on).
- **Decided:** DN-01 (only the owner adds people), DN-03 (the admin gives an email address for one-time codes).

#### ST-15.3 · Business rules

- **Status:** Confirmed.
- **Phase:** 1.
- **Roles:** Owner changes owner settings; the owner, the admin and staff see them; partners do not (Proposed: Dulan, 1 Nov 2026; for the owner to confirm).
- **Story:** As the owner, I see the business rules in force and I change the settings that are mine, so that everyone works to the same rules.
- **Rules:**
  - Set now: extra-km rates per car, starting at LKR 17 to 27 a km by type (System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults)); fuel price per litre, an owner setting with no agreed figure ([Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope)); staff see the expected drawer cash first, then type what they count ([Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation)); expired insurance or licence warns, and going ahead needs an authorised person and a reason; any garage visit is Under repair; reminder lead times, starting at 30 days for insurance and licence, 7 days or 500 km for service and 3 days for payroll, changeable by the owner ([Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability)); no late fee runs on its own, staff decide ([Early and late return](SNS_SYSTEM_DESIGN.md#74-early-and-late-return)); partners cash out any day, to the bank or in cash at the branch ([Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out)); SNS commission per partner car, default 15%; garage-day charge LKR 5,000 a day per car ([Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings)).
  - No decision is left open. A rule the owner adds later is recorded in the system design before it appears here.
  - Every change to a setting is recorded with who, when, and the old and new values (PR-05).
  - The owner changes the business-wide settings here in three groups: rental day times (pickup cutoff, return deadline), reminders, fuel price. Each has its own short form that shows old → new before saving. Limits: reminder days 1 to 90, service km 100 to 5,000, fuel price LKR 1 to 2,000 a litre, times to the minute; the fuel price is "not set" until the owner sets it. Per-car and per-partner settings are changed on that car or partner. A changed cutoff or deadline applies to new rentals only (PR-08). *Proposed: Dulan, 1 Nov 2026; for the owner to confirm.* System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
- **Checks:** AT-45 "A car's insurance expires in 30 days, with the starting reminder settings: it appears in Upcoming work; the owner can change how early" (the reminders themselves are Phase 3). *Proposed check:* the owner changes a setting; the activity log shows who, when, and the old and new values; the admin and staff can read the page but not change it, also when calling the server directly.
- **Screens:** 15.2 Business rules, 15.7 Change a setting.
- **Decided:** shown here as set now: DN-04 (garage days for damage only, admin approves), DN-06 (fuel not counted by default, same level per rental), DN-11 (staff close the day, or 11:59 PM), DN-12 (cash leaving the drawer), DN-15 (payroll deductions), DN-16 (SNS earnings and profit before depreciation).

#### ST-15.4 · Activity log

- **Status:** Confirmed; "can't be edited or deleted" is a Derived control.
- **Phase:** 1; entries fill in as each phase adds its actions.
- **Roles:** Owner, Admin.
- **Story:** As the owner, I see every recorded action and every exceptional decision with its reason, by person and by kind, so that I can check what happened and who did it.
- **Rules:**
  - Every transaction records who entered it; every exceptional decision records the reason, the person, the date and the time (PR-05).
  - Entries are never edited or deleted, by anyone (System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls)).
  - The owner's daily summary of exceptional decisions is built from this log and is shown on the owner's home in Phase 4. System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring).
- **Checks:** *Proposed check:* nobody, the owner included, can change or delete an entry.
- **Screens:** 15.5 Activity log.
- **Decided:** DN-01 (the admin sees the log by default; staff do not).

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
  - One NIC is one customer: a NIC already recorded opens that customer instead of adding a second record. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - Name, NIC, phone, and licence number and expiry are needed to save. The ID and licence copies may come later: until they are in, the customer shows "copies missing". System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - Handover is blocked until the customer's ID copy and licence copy are in. A reference person is needed only when staff decide; their ID and licence copies are then required too. System design → [Handover requirements](SNS_SYSTEM_DESIGN.md#handover-requirements).
  - The copies are private: only people with permission open them, never through a public link. System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
  - An imported customer whose copies were not in SNS's books needs them before their next handover. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
- **Checks:** AT-06 "Missing signed agreement or customer ID or licence copy: handover blocked" and AT-07 "Reference person required but their licence copy missing: handover blocked" (both checked at handover, Phase 2). AT-49 "Staff save a new customer without the licence copy: saved, shows copies missing, handover blocked until it is added". AT-51 "Staff add a new customer with a NIC already recorded: no second record; the existing customer opens, with their debts and flags".
- **Screens:** 08.3 New customer with documents.
  - Copies are kept 7 years after the last rental or settled debt, then listed for the owner to delete; staff and admins with customer access open them and every opening is logged (AT-59).
- **Decided:** DN-02.

#### ST-08.3 · Customer details

- **Status:** Confirmed.
- **Phase:** 1; debts, payments and rentals fill in from Phase 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see a customer's details, documents, warnings, debts and rentals in one place, and I can correct their details, so that I know who I am dealing with.
- **Rules:**
  - Past rentals from SNS's books show marked "Imported", read-only and never recalculated. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - An unpaid debt warns before every new rental until it is paid or written off, as a flag does (AT-55). Recording a payment is Phase 2; writing off a debt is for the authorised person only. System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions), [Corrections and write-offs](SNS_SYSTEM_DESIGN.md#83-corrections-and-write-offs).
  - Decisions taken for this customer show with their reason, person and time (PR-05).
- **Checks:** AT-37 "An imported past rental is opened: shown marked Imported, read-only, never recalculated".
- **Screens:** 08.2 Customer details.
- **Decided:** DN-02.

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

- **Status:** Confirmed.
- **Phase:** 1; rentals, reservations, payments and earnings fill in from Phases 2 and 3.
- **Roles:** Owner sees everything; staff see the car without the partner's earnings and terms (screens 04.2 and 04.3).
- **Story:** As the owner, I see a car's status, papers and service, terms, the partner's earnings from it and its history, so that I know how each car is doing.
- **Rules:**
  - SNS-owned cars have no partner earnings or cash-outs. System design → [Historical terms](SNS_SYSTEM_DESIGN.md#43-historical-terms).
  - Past rentals from SNS's books show marked "Imported" and add no earnings. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - Earnings show only once final. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
- **Checks:** AT-37.
- **Screens:** 04.2 Car details · owner, 04.3 Car details · staff.
- **Decided:** DN-01 (partner earnings and terms: admin by default, not staff).

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
- **Decided:** DN-04 (garage days only for damage during the rental; ST-07.2).

#### ST-04.4 · Starting packages

- **Status:** Confirmed; the extra-km rates are design rates, final per car.
- **Phase:** 1.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I keep the starting package for each car type and the shared defaults, so that a new car starts with the right terms.
- **Rules:**
  - Starting packages: Wagon R and Spacia 4,500 a day; Every (van) 5,000; Alto 4,000; Prius and Axio 6,500; 100 km a day each; extra km 25, 25, 17 and 27 a km. System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults).
  - Shared defaults: SNS commission 15%, long-rental extra LKR 500 a day from day 6, garage-day charge LKR 5,000 a day. System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings).
  - Changing a starting package changes only cars added afterwards. Cars already in the system keep their own package until an admin changes it on the car (ST-04.3). System design → [Initial defaults](SNS_SYSTEM_DESIGN.md#41-initial-defaults).
  - Changing a package never changes rentals already running (PR-08).
- **Checks:** AT-05. AT-50 "An admin changes the Alto starting package from 4,000 to 4,200: existing Altos stay at 4,000; an Alto added afterwards starts at 4,200".
- **Screens:** 04.6 Starting packages.

#### ST-04.5 · Change a car's status

- **Status:** Confirmed.
- **Phase:** 1; the handover block it causes is checked in Phase 2.
- **Roles:** Staff, Admin set Under repair or Temporarily unavailable; only an authorised person marks a car available again; only an admin or the owner retires a car.
- **Story:** As staff, I mark a car Under repair or Temporarily unavailable with a reason, so that nobody hands it over.
- **Rules:**
  - A car under repair or unavailable cannot be handed over until an authorised person marks it available. Any garage visit, planned service included, is Under repair. System design → [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability).
  - The owner's own use marks the car unavailable with a reason and an expected return date, with no trip or km tracking.
  - A car that is sold or returned for good is retired by an admin or the owner, with a reason and date, only when it is not rented or reserved: no new rentals, every past record kept, and a partner's balance from it stays payable.
  - Rented and Overdue come from the rental itself, not from this screen.
- **Checks:** AT-20 "Vehicle marked under repair: rental handover blocked until an authorised availability change". AT-25 "Retire a vehicle: no new rentals; history and money owed kept". AT-52 "Staff try to retire a car; an admin retires a car reserved next week: staff cannot; the admin is refused until the reservation is moved or cancelled".
- **Screens:** 04.5 Change a car's status, 04.7 Car status blocks · reference.
- **Decided:** DN-01 (staff and admins set Under repair or Unavailable; the admin marks a car available).

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

- **Status:** Confirmed (change request CR-001, addendum ADD-003).
- **Phase:** 1.
- **Roles:** Admin adds or replaces it.
- **Story:** As an admin, I add one photo of a car for its card and page, so that staff recognise it.
- **Rules:** one optional photo per car; until one is added, the model's standard image shows. It is not a condition photo, not a handover requirement and not a customer document. System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings).
- **Checks:** AT-29.
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
  - The partner agreement covers commission, the daily cash-out arrangement and who pays which costs. The system prints it; it is signed and kept on paper, and staff record "signed on <date>". Nothing waits on it (AT-83). System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports).
  - A partner never sees the price a customer paid, customer details or other partners' data. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts).
  - Adding a partner is recorded in the activity log (PR-05).
- **Checks:** AT-44 "A partner without a bank account asks to cash out: an authorised person pays cash at the branch and records it once" (Phase 3).
- **Screens:** 11.3 Add a partner.
- **Decided:** DN-20 (printed, signed on paper, date recorded), DN-01 (admin adds partners by default).

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
- **Decided:** DN-20.

### Gaps found while writing Phase 1

Six gaps were found and decided with Dulan for the owner on 26 Oct 2026. Each is now in the system design and its story, with a check: turning off an account (ST-15.2, AT-47), closing a flag (ST-08.5, AT-48), saving a customer before the copies (ST-08.2, AT-49), starting packages for new cars only (ST-04.4, AT-50), one customer per NIC (ST-08.2, AT-51) and retiring a car (ST-04.5, AT-52). The screens 15.3, 08.2, 08.3, 04.6 and 04.5 show them.

## 11. Phase 2 · Rentals

Months 2 and 3: a rental from the first step to the paid bill, with extensions, swaps, payments, deposits, debts, approvals, printed documents and advance reservations. Written with Dulan, 26 Oct 2026, for review. Defaults for who may do what are in System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions); every one is configurable (PR-06).

### 05 New rental

#### ST-05.1 · Start a rental with the customer

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner. Approving a first-time customer: staff or admins.
- **Story:** As staff, I start a rental by finding or adding the customer and reading their warnings, so that I rent to them knowingly.
- **Rules:**
  - A rental starts from the customer: found, or added (ST-08.2). A customer collecting a reservation starts from the reservation instead (ST-18.3). System design → [Normal journey](SNS_SYSTEM_DESIGN.md#71-normal-journey).
  - Flags and unpaid debts warn; staff go ahead only with a reason. An expired licence needs the authorised person (ST-08.4). System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents).
  - Staff decide whether a reference person is needed (ST-05.5).
  - A customer may rent several cars at once; each is its own rental, agreement and bill.
- **Checks:** AT-55 "A customer with an unpaid bill and no flag starts a new rental: a debt warning shows; staff continue only with a reason". AT-09 "Customer rents two vehicles: separate rentals, agreements and bills; one payment may be allocated across both".
- **Screens:** 05.1 Customer and warnings.

#### ST-05.2 · Choose a car

- **Status:** Confirmed; holding the car at the database is a Derived control.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I choose a free car, so that the rental gets a car nobody else holds.
- **Rules:**
  - Only free cars can be chosen. A car under repair, unavailable, retired, rented or reserved on any of the rental's days is not offered. System design → [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability), [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations).
  - The car is held only at handover; until then it stays free. If two people hand over the same car, only one succeeds. System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
  - A car not found at this morning's check is shown as such.
- **Checks:** AT-08 "Two employees submit handovers for the same car: only one succeeds". AT-20 "Car under repair: handover blocked". AT-30 "A car is reserved Fri to Sun; staff try to rent it for Sat: refused".
- **Screens:** 05.2 Choose a car.

#### ST-05.3 · Dates and estimate

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I set how many days and see the return deadline and the estimate, so that the customer knows the price before signing.
- **Rules:**
  - The pickup cutoff and the return deadline are business settings, for now 3:00 PM and 8:00 AM. A pickup before the cutoff ends day one at the next morning's deadline; a pickup at or after it, the morning after. The minimum is one full day. System design → [Business-wide timing](SNS_SYSTEM_DESIGN.md#51-business-wide-timing).
  - Included km are pooled over the rental. From the surcharge's start day (default day 6) each day adds the long-rental extra (default LKR 500). System design → [Kilometres and surcharge](SNS_SYSTEM_DESIGN.md#52-kilometres-and-surcharge), [Example calculations without swaps](SNS_SYSTEM_DESIGN.md#53-example-calculations-without-swaps).
  - The car's package is copied onto the rental now; later package changes never touch it (PR-08).
- **Checks:** AT-01 "Pickup Monday 2 PM: deadline Tuesday 8 AM". AT-02 "Pickup Monday exactly 3 PM: deadline Wednesday 8 AM". AT-03 "One-day Wagon R, 150 km: 4,500 + 1,250 = 5,750". AT-04 "Six-day Wagon R, at most 600 km: 27,000 + 500 = 27,500". AT-05.
- **Screens:** 05.3 Dates and estimate.

#### ST-05.4 · Deposit and when the rent is paid

- **Status:** Confirmed; deposits kept apart from income is a Derived control.
- **Phase:** 2.
- **Roles:** Staff, Admin set or waive a deposit and allow payment after return; each is a recorded decision.
- **Story:** As staff, I set the deposit and agree when the rent is paid, so that SNS holds what it needs for this customer and car.
- **Rules:**
  - Staff set or waive a deposit by car and customer; waiving needs a reason. System design → [Deposits](SNS_SYSTEM_DESIGN.md#82-deposits), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - A deposit is money held, never income (PR-09).
  - The rent may be paid now or at return; staff may allow an unpaid balance after return, with the decision recorded. System design → [Collection](SNS_SYSTEM_DESIGN.md#81-collection).
- **Checks:** *Proposed check:* waiving a deposit without a reason is refused; with one, the reason, name and time are recorded and appear in the owner's daily summary.
- **Screens:** 05.4 Deposit and payment.

#### ST-05.5 · Reference person

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin decide whether one is needed.
- **Story:** As staff, when I decide a rental needs a reference person, I record them with their documents, so that SNS has someone to contact.
- **Rules:** needed only when staff decide; their name, NIC, phone, and ID and licence copies are then required, and handover waits for the copies. System design → [Customer onboarding and mandatory documents](SNS_SYSTEM_DESIGN.md#6-customer-onboarding-and-mandatory-documents), [Handover requirements](SNS_SYSTEM_DESIGN.md#handover-requirements).
- **Checks:** AT-07 "Reference person required but their licence copy missing: handover blocked".
- **Screens:** 05.6 Reference person.

#### ST-05.6 · Review and print the agreement

- **Status:** Confirmed; the conditions are SNS's wording, approved by the owner (DN-20).
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I review the rental and print the agreement in Sinhala or English, so that the customer signs what was agreed.
- **Rules:**
  - The agreement is filled with the customer, car, dates and agreed prices, in the chosen language (PR-10). It is printed, signed, and the signed copy uploaded before handover. System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports).
  - The conditions are SNS's own wording, approved by SNS; nothing is taken from the unverified reference images.
- **Checks:** AT-06 "Missing signed agreement: handover blocked".
- **Screens:** 05.5 Review and print; prints 16.1 or 16.2 (ST-16.1).
- **Decided:** DN-20.

#### ST-05.7 · Ask for a different price

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff request; an admin approves (ST-10.2).
- **Story:** As staff, I ask an admin to change the agreed price or give a discount, with a reason, so that a special price is an approved decision.
- **Rules:**
  - Changing the agreed price or giving a discount needs an admin's approval. System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
  - A discount reduces SNS's and the partner's earnings in proportion. On a partner car, a price above the package goes to the admin, who sets how the extra is split (ST-10.3). System design → [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation).
- **Checks:** AT-39, AT-40 (ST-10.3).
- **Screens:** 05.7 Price change needs admin.
- **Decided:** DN-01 (nobody approves their own request), DN-10 (whole rupees).

#### ST-05.8 · Cancel before handover

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin cancel with a reason; only the authorised person keeps a fee.
- **Story:** As staff, I cancel a rental that was not handed over, with a reason, so that the car is free and any money is settled.
- **Rules:** only before handover; a reason is required; an authorised person may keep a cancellation fee, which is entirely SNS's; the rest is refunded and recorded on the rental as its own line, not as an expense. System design → [Cancellation before handover](SNS_SYSTEM_DESIGN.md#73-cancellation-before-handover), [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation).
- **Checks:** AT-18 "Pre-handover cancellation with authorised fee: refund recorded; fee entirely SNS".
- **Screens:** 05.8 Cancel before handover.

### 06 Rentals

#### ST-06.1 · Rentals list

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see open rentals grouped by what needs doing (overdue, due back, handover in progress, returned today, the rest), so that nothing is missed.
- **Rules:** a filter opened from the navigation or the attention summary is shown and can be removed; reservations are reached from here (ST-18.1); older and cancelled rentals are kept. System design → [Normal journey](SNS_SYSTEM_DESIGN.md#71-normal-journey).
- **Checks:** AT-28 "Staff open Overdue 1 from the navigation: only the overdue rental shows, with a visible filter that can be removed".
- **Screens:** 06.1 Rentals.

#### ST-06.2 · Rental details

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner; the earnings split is shown to the owner.
- **Story:** As staff, I see a rental's customer, car, readings, bill, payments and history in one place, so that I can answer any question about it.
- **Rules:**
  - Each rental day's rent becomes final for the partner at that day's close; extra km and the late charge at return; items waiting for an admin stay out until decided. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - Return status is kept apart from what the customer and SNS still owe. System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
  - A rental marked "Started before go-live" earns for the partner only from go-live; an imported rental is read-only. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - A payment is corrected only by request (ST-09.3).
- **Checks:** AT-14 "A rental runs several days: each day final once, at its close; excess km final at return; nothing counted twice". AT-37. AT-42.
- **Screens:** 06.2 Rental details.
- **Decided:** DN-01 (the admin sees the split by default), DN-11 (staff close the day, or 11:59 PM).

#### ST-06.3 · Overdue rental

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see how late a rental is and call the customer, receive the car or extend, so that late cars are followed up.
- **Rules:** no late fee runs on its own; staff decide any late charge at return, with a reason. No automatic customer messages: staff call. System design → [Early and late return](SNS_SYSTEM_DESIGN.md#74-early-and-late-return), [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring).
- **Checks:** none in the system design.
- **Screens:** 06.3 Overdue rental.

#### ST-06.4 · Hand over the car

- **Status:** Confirmed; holding the car at the database is a Derived control.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I hand over the car only when every required item is in, so that no car leaves without its papers.
- **Rules:**
  - Handover is blocked until the customer's ID copy, licence copy, the signed agreement photo, the outgoing odometer and, when needed, the reference person's copies are in. Nobody can skip one. System design → [Handover requirements](SNS_SYSTEM_DESIGN.md#handover-requirements).
  - The fuel level and the accessories checklist must be recorded, but a missing item or low fuel never blocks handover. Condition photos are optional.
  - A car under repair or unavailable cannot be handed over. Only one handover of a car can succeed.
  - A reserved car's pickup follows the same steps.
- **Checks:** AT-06, AT-07, AT-08, AT-20, AT-35 "Pickup of a reserved car without a signed agreement or ID copy: blocked". AT-53 "A car goes out with an accessory missing and a quarter tank: handover finishes once both are recorded; the customer is not charged for the missing item".
- **Screens:** 06.4 Handover checklist, 06.5 Handover done.

#### ST-06.5 · Extend by phone

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin; no admin approval.
- **Story:** As staff, I extend a rental when the customer calls, so that the new deadline is recorded at the original rate.
- **Rules:**
  - Staff accept a phone extension without admin approval; the person and the new deadline are recorded; the rental keeps its original rates and terms. System design → [Extensions](SNS_SYSTEM_DESIGN.md#72-extensions).
  - An extension that would run into a reservation on the same car is blocked, with the reason, until the reservation is moved or its dates change. System design → [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations).
- **Checks:** AT-05 (the extension keeps the old terms). AT-32 "An extension would run into another customer's reservation: blocked with the reason".
- **Screens:** 06.6 Extend by phone, 06.8 Extend · blocked by a reservation.
- **Decided:** DN-08 (no new signature; the new deadline shows on the final bill, AT-68).

#### ST-06.6 · Swap a car

- **Status:** Confirmed; the record of each car's use is a Derived control.
- **Phase:** 2.
- **Roles:** Staff record the swap; an admin decides the price and the swap-day split (ST-10.2).
- **Story:** As staff, I swap the car on a running rental, recording both readings, so that each car's use is counted on its own.
- **Rules:**
  - The returning car's reading and the replacement's outgoing reading are both required. Only free cars can be the replacement. One rental keeps the sequence of cars it used. System design → [Vehicle swaps](SNS_SYSTEM_DESIGN.md#75-vehicle-swaps).
  - The admin decides the replacement's price, how the swap day is split, the swap day's km allowance and any long-rental extra on that day. Km are counted per car at each car's own rate; the long-rental day count continues from the rental's start; the replacement's surcharge rule applies from the swap. The replacement's terms are saved when it joins (PR-08).
  - Earnings follow the actual use of each car; anything waiting for the admin stays out of a partner's earnings.
- **Checks:** AT-19 "Rental swap: required readings, separate km, recorded admin decisions and the saved rates".
- **Screens:** 06.7 Swap a car.
- **Decided:** DN-07 (the admin picks the swap day's car and divides its allowance, AT-67), DN-08 (no new signature), DN-14 (a swapped-out car is paid as returned, AT-75).

### 07 Return

#### ST-07.1 · Receive the car and settle the bill

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin decide late and damage charges; an admin decides early-return reductions and damage or accessory allocation.
- **Story:** As staff, I record the car's return and settle the bill, so that the customer, SNS and the partner each know where they stand.
- **Rules:**
  - The incoming odometer is required. Extra km = km driven minus the pooled included km, at the car's saved rate. System design → [Handover requirements](SNS_SYSTEM_DESIGN.md#handover-requirements), [Example calculations without swaps](SNS_SYSTEM_DESIGN.md#53-example-calculations-without-swaps).
  - Staff set or waive a late charge, with a reason; it follows the car's commission split. An early-return reduction is the admin's decision. System design → [Early and late return](SNS_SYSTEM_DESIGN.md#74-early-and-late-return).
  - The accessories checklist and fuel level are recorded again. A missing accessory may be charged; on a partner car the admin decides who gets it. Fuel is not counted by default; on a "same level" rental, missing litres are charged at the owner's price per litre, entirely SNS's, or waived with a reason. Litres taken out of the car may be recorded as an estimate, with no money value. Damage charges are staff decisions; the admin allocates them. System design → [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation), [Optional and excluded scope](SNS_SYSTEM_DESIGN.md#16-optional-and-excluded-scope).
  - Staff choose the car's next state; nothing is chosen for them. System design → [Normal journey](SNS_SYSTEM_DESIGN.md#71-normal-journey).
  - Payments and the deposit are applied (ST-07.3, ST-09.1). An unpaid balance becomes customer debt; the partner is paid even when the customer has not paid. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
- **Checks:** AT-03, AT-04, AT-13 "Customer has not paid when the partner asks to cash out: the partner's final earnings stay payable", AT-14, AT-54 "A partner car comes back without its air pump: the charge waits for the admin, out of the partner's earnings".
- **Screens:** 07.1 Return and payment.
- **Decided:** DN-06 (fuel not counted by default; same level per rental, AT-64, AT-65), DN-09 (included km follow the days charged, AT-69), DN-10 (whole rupees, AT-70).

#### ST-07.2 · Garage days on the bill

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff propose; an admin approves the days and amount, corrects them when the car is back, and splits them on a partner car.
- **Story:** As staff, when a car comes back damaged and must go to the garage, I propose the days it cannot be rented, so that an admin can add them to the customer's bill.
- **Rules:** only for damage during this rental, never for a planned service; the rate is the car's garage-day charge (default LKR 5,000 a day); an admin approves the days and amount and corrects the days when the car is back; on a partner car the admin decides the split, as damage recovery, and it stays out of the partner's earnings until decided. System design → [Per-vehicle settings](SNS_SYSTEM_DESIGN.md#42-per-vehicle-settings), [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation).
- **Checks:** AT-62 "A partner car spends 3 days at the garage after damage: staff propose 3 days; once approved they are on the bill and the split waits for the admin". AT-63 "A planned service after a rental: no garage-day charge".
- **Screens:** 07.2 Garage days on the bill.
- **Decided:** DN-04.

#### ST-07.3 · Use the deposit and refund the rest

- **Status:** Confirmed; deposits kept apart from income is a Derived control.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I apply the deposit to the bill and refund what is left, so that the deposit is settled and recorded.
- **Rules:**
  - The deposit pays this rental's bill and damage first; then, with the customer's agreement noted, the same customer's older unpaid bills; the rest is refunded. Nothing is applied beyond what is held. System design → [Deposits](SNS_SYSTEM_DESIGN.md#82-deposits).
  - Every application and refund is recorded. A refund is not an expense; a cash refund shows in the drawer as its own line. A deposit applied to a bill is not counted again as new money (PR-09).
- **Checks:** AT-12 "LKR 10,000 deposit, LKR 7,000 bill: apply 7,000, refund 3,000; no double-counted earnings". AT-56 "10,000 deposit, 7,000 bill, 2,000 older bill, the customer agrees: 7,000, then 2,000, then 1,000 refunded".
- **Screens:** 07.3 Use deposit and refund.

### 09 Money: payments

#### ST-09.1 · Record a payment

- **Status:** Confirmed.
- **Phase:** 2; the bank and card check is Phase 3.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I record each payment with how it was paid, so that every rupee is under the name of who took it.
- **Rules:**
  - Cash, bank transfer, card and mixed payments are recorded by hand; there is no payment integration (PR-14). A bank transfer needs its reference; a card payment needs its receipt number. Bank and card count as paid as soon as they are entered. System design → [Collection](SNS_SYSTEM_DESIGN.md#81-collection).
  - One payment may be allocated across several of the customer's bills, never beyond its amount. System design → [Collection](SNS_SYSTEM_DESIGN.md#81-collection), [Deposits](SNS_SYSTEM_DESIGN.md#82-deposits).
  - A payment is recorded once, even if sent twice. System design → [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
- **Checks:** AT-09, AT-10 "Staff record a bank payment with its reference: counted at once; the check is tracked apart".
- **Screens:** 09.3 Record a payment, 09.4 Split payment · cash and bank.

#### ST-09.2 · Ask for a payment correction

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff request; an admin approves or rejects (ST-10.2).
- **Story:** As staff, I ask for a wrong payment to be corrected, saying what is wrong, what it should be and why, so that the fix is approved and both records stay.
- **Rules:** a correction needs an admin's approval; the original is never changed or deleted; an approved correction is a new dated line, and earnings already final change only by an adjustment line. System design → [Corrections and write-offs](SNS_SYSTEM_DESIGN.md#83-corrections-and-write-offs); PR-07.
- **Checks:** AT-16 "An approved correction affects earnings already final or cashed out: the original lines stay; a dated adjustment line changes the balance". AT-84 "An approved correction takes back a whole 5,750 line at 85%: partner −4,887, SNS −863; both net to 0".
- **Screens:** 09.5 Payment correction request.
- **Decided:** DN-01 (nobody approves their own request), DN-21 (a negative line splits as the mirror of a positive one).

### 08 Customers: write-off

#### ST-08.6 · Write off a debt

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** The authorised person; until one is named, only the owner.
- **Story:** As the authorised person, I write off all or part of a debt that cannot be collected, with a reason, so that the books show the loss honestly.
- **Rules:** a reason is required; the loss is entirely SNS's and no partner's earnings change; the bills stay as they were and the customer's record notes the write-off; it shows in the owner's exceptions. An imported opening debt is written off the same way. System design → [Corrections and write-offs](SNS_SYSTEM_DESIGN.md#83-corrections-and-write-offs), [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
- **Checks:** AT-17 "Customer debt written off: SNS absorbs the loss; partner earnings not reduced". AT-38 "An imported opening debt is written off: same".
- **Screens:** 08.6 Write off a debt.

### 10 Approvals

#### ST-10.1 · Approvals waiting

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I see every request waiting for me with its effect and who bears it, so that I decide with the facts in front of me.
- **Rules:** waiting requests include price changes and discounts, payment corrections, swap pricing and swap-day splits, damage and accessory allocations, early-return reductions and the split of a price above the package. Each shows the requester's reason word for word. System design → [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
- **Checks:** none beyond ST-10.2.
- **Screens:** 10.1 Approvals.
- **Decided:** DN-01: a person never sees their own request as something to approve; the owner's own is marked "self-approved" (AT-57).

#### ST-10.2 · Approve or reject

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I approve or reject a request after a confirm step that repeats its effect, so that nothing is decided by a slip.
- **Rules:** rejecting needs a note; the approver, time and note go into the rental's history, and the requester's reason is kept (PR-05). A decision affecting earnings already final adds a dated adjustment line (PR-07). The requester sees the result.
- **Checks:** AT-16.
- **Screens:** 10.2 Approve · confirm, 10.3 Reject · confirm.

#### ST-10.3 · Split a price above the package on a partner car

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Admin, Owner.
- **Story:** As an admin, when a partner car is rented above its package, I set how the extra is split between SNS and the partner, with a reason, so that the partner's share is fair and decided.
- **Rules:**
  - The package amount follows the car's commission. The extra above it is split as the admin sets for that rental, with a reason; it may be all SNS's. System design → [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation).
  - Until decided, the extra stays out of the partner's earnings; the package share becomes final at each day's close. The partner sees one earning a day, never the price, the extra or SNS's share. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
- **Checks:** AT-39 "The admin keeps the whole extra for SNS: the partner's earning is on the package only". AT-40 "A 50/50 split with a reason: the partner's day earning is the package share plus half the extra, shown as one amount". AT-41 "The day closes before the split is decided: the package share is final; the extra waits".
- **Screens:** 10.4 Approve a higher price on a partner car.
- **Decided:** DN-10 (whole rupees; the partner's share rounds down).

### 16 Documents: rental

#### ST-16.1 · Rental agreement

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I print the rental agreement in Sinhala or English, filled in with this rental, so that the customer signs the right terms.
- **Rules:** filled with SNS's business details, the customer, car, dates, daily rate, included and extra km, and deposit; odometer and fuel are written at handover; the conditions are SNS's approved wording; the signed copy is photographed and uploaded before handover. System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports).
- **Checks:** AT-06.
- **Screens:** 16.1 Rental agreement · Sinhala, 16.2 Rental agreement · English.
- **Decided:** DN-20 (SNS's wording, owner-approved per version), DN-08 (no amended agreement).

#### ST-16.2 · Final bill and payment receipt

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I print the itemised final bill and a receipt for each payment, in Sinhala or English, so that the customer has a clear record.
- **Rules:** the bill lists each charge (days, extra km, fuel, accessories, late charge, damage) and each payment, deposit applied and balance due; the receipt shows the amount received, the bill total, what was paid before and the balance, and who received it. Both print in Sinhala or English (PR-10); the receipt prints on an 80 mm slip or A4. System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports).
- **Checks:** none in the system design.
- **Screens:** 16.3 Final bill, 16.4 Payment receipt · 80 mm slip.

### 02 Home: staff and search

#### ST-02.1 · Staff home

- **Status:** Confirmed.
- **Phase:** 2; the morning-check line comes with Phase 3.
- **Roles:** Staff, Admin.
- **Story:** As staff, I open the system to today's work (overdue cars, cars due back, handovers in progress, reservations collected today, the cars), so that I know what to do first.
- **Rules:** today's work comes from recorded facts and agreed rules only; nothing is invented. System design → [Normal journey](SNS_SYSTEM_DESIGN.md#71-normal-journey), [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations).
- **Checks:** AT-28.
- **Screens:** 02.2 Staff home.

#### ST-02.2 · Search

- **Status:** Confirmed.
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I search by plate, rental number, customer name, NIC or phone, so that I reach any car, rental or customer at once.
- **Rules:** results are grouped as cars, rentals and customers; full NIC and phone are shown (PR-13); a person sees only what their permissions allow (PR-06).
- **Checks:** AT-24.
- **Screens:** 02.4 Search results.

### 18 Reservations

#### ST-18.1 · Reservations list

- **Status:** Confirmed (CR-002).
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see reservations that need attention, those collected today and those coming, so that each reserved car is ready.
- **Rules:** a reserved car that is late back or under repair flags its reservation for attention; collected, cancelled and no-show reservations are kept. System design → [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations).
- **Checks:** none beyond ST-18.2 to ST-18.5.
- **Screens:** 18.1 Reservations.

#### ST-18.2 · Reserve a car

- **Status:** Confirmed (CR-002).
- **Phase:** 2.
- **Roles:** Staff, Admin, by phone or at the counter. Customers do not book themselves.
- **Story:** As staff, I reserve a specific car for a customer's days, up to 30 days ahead, with an optional advance, so that the car is held for them.
- **Rules:** one car for the booked days; no other rental or reservation can hold it on overlapping days; no more than 30 days ahead; the car's package is saved on the reservation; an advance is optional and recorded as any payment. System design → [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations).
- **Checks:** AT-30, AT-31 "The package changes after the reservation is made: pickup uses the saved package", AT-34 "Reserving more than 30 days ahead: refused".
- **Screens:** 18.2 New reservation.

#### ST-18.3 · Reservation details and pickup

- **Status:** Confirmed (CR-002).
- **Phase:** 2.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I open a reservation, change its dates, and start the rental when the customer comes, so that pickup is quick and complete.
- **Rules:** at pickup the reservation becomes a normal rental with its car, dates and saved price; warnings, the signed agreement and every handover item still apply; an advance is applied to the bill. A date change is refused if it would overlap another hold on the car or go beyond 30 days. System design → [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations).
- **Checks:** AT-35.
- **Screens:** 18.3 Reservation details.

#### ST-18.4 · Move a reservation to another car

- **Status:** Confirmed (CR-002).
- **Phase:** 2.
- **Roles:** Staff, Admin; a car at a different price needs an admin's approval.
- **Story:** As staff, I move a reservation to another free car, so that the customer is served when the booked car cannot be.
- **Rules:** only cars free for all the reserved days; a car at the same price moves at once; a different price goes to an admin first, and the customer keeps the saved price until the admin decides. System design → [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
- **Checks:** AT-32 (moving the reservation unblocks the extension). *Proposed check:* moving to a car at a different price waits for an admin; until then the reservation keeps its car and price.
- **Screens:** 18.4 Move to another car.

#### ST-18.5 · Cancel or no-show

- **Status:** Confirmed (CR-002).
- **Phase:** 2.
- **Roles:** Staff, Admin; only the authorised person keeps a fee.
- **Story:** As staff, I cancel a reservation or mark a no-show, with a reason, so that the car is free and any advance is settled.
- **Rules:** as for a cancellation before handover: a reason; the authorised person may keep a fee, entirely SNS's; the rest of the advance is refunded and recorded as its own line, not as an expense; staff mark a no-show by hand; the car is then free. System design → [Advance reservations](SNS_SYSTEM_DESIGN.md#76-advance-reservations), [Cancellation before handover](SNS_SYSTEM_DESIGN.md#73-cancellation-before-handover).
- **Checks:** AT-33 "Reserved customer does not come; an advance was paid: no-show marked; any fee kept is SNS's; the rest refunded; the car is free".
- **Screens:** 18.5 Cancel or no-show.

### Gaps found while writing Phase 2

Four were found and decided with Dulan for the owner on 26 Oct 2026, each now in the system design with a check: fuel and accessories are recorded at handover and never block it (ST-06.4, AT-53); an accessory charge on a partner car is the admin's decision (ST-07.1, AT-54); an unpaid debt warns as a flag does (ST-05.1, AT-55); a deposit may pay the same customer's older bills (ST-07.3, AT-56). Five wording errors in the screens were corrected: when a partner's share becomes final (06.2), the fuel price shown as an example (06.2, 16.3), deposits not called earnings (07.3), and an old board name (16.2).

The owner decisions Phase 2 depended on (DN-01, DN-04, DN-06 to DN-11, DN-20) were settled afterwards; see section 7.

## 12. Phase 3 · Money

Months 4 and 5: the cash drawer and the day's close, the bank and card check, expenses, partner cash-outs and the partner portal, payroll, maintenance reminders and the morning vehicle check. Written with Dulan, 26 Oct 2026, for review.

### 09 Money: drawer, day and expenses

#### ST-09.3 · Money today

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Owner, Admin; staff by permission.
- **Story:** As the owner, I see today's money in separate boxes (received, deposits held, customer debt, what partners can cash out, SNS earnings), so that nothing is mistaken for income.
- **Rules:**
  - Collections, earnings, deposits held and partner payables are kept apart and never added together; SNS earnings are kept apart from partner earnings. System design → [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting).
  - Money received is not SNS earnings; deposits are held, not income (PR-09). Bank and card count as paid when entered; whether they are checked is shown separately. System design → [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation).
  - SNS earnings are SNS cars' rent plus SNS's commission and shares on partner cars, counted when final; profit is always labelled "before depreciation" (DN-16).
- **Checks:** AT-12, AT-79.
- **Screens:** 09.1 Money today.
- **Decided:** DN-16.

#### ST-09.4 · Drawer and money received by staff

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see the drawer's expected cash and every cash line in and out, by who recorded it, so that the shared drawer stays accountable.
- **Rules:**
  - One shared drawer takes collections and pays expenses and refunds; every movement records who did it. Bank and card never go into the drawer. System design → [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation).
  - Expected cash = opening count + cash in − expenses − refunds − cash paid out (partner payouts, salary, owner withdrawals). Each paid-out kind is its own line and never an expense line (DN-12).
  - A refund is not an expense; a deposit received is held, not income.
- **Checks:** AT-72 "Sunil's 10,000 cash-out and 5,000 of Nimal's salary paid from the drawer: expected cash falls by 15,000, each as its own line".
- **Screens:** 09.2 Drawer and payments, 09.10 Money received by staff.
- **Decided:** DN-12.

#### ST-09.5 · Count the drawer and explain a difference

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff count; the authorised person resolves a difference.
- **Story:** As staff, I count the drawer at the end of the day after seeing the expected amount, so that any difference is caught that day.
- **Rules:**
  - Staff see the expected cash first, then type what they count; both figures are kept and never changed. System design → [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation).
  - A shortage or surplus is recorded as it is; the person counting writes what happened; the authorised person resolves it with a note and any receipt or photo. It stays shown against its day until resolved (DN-13).
  - A count entered the next morning is marked late (DN-11).
- **Checks:** AT-74 "The evening count is LKR 500 short: the note is kept; the shortage shows on that day until resolved".
- **Screens:** 09.6 Count the drawer · expected shown, 09.8 Evening money check.
- **Decided:** DN-11, DN-13.

#### ST-09.6 · Bank and card check

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** The authorised person for checking payments; the owner until one is named.
- **Story:** As the authorised person, I check bank transfers against the statement and card slips against the machine total, so that every recorded payment is confirmed.
- **Rules:**
  - Checking is by hand; the system is not linked to any bank (PR-14). A payment stays paid while its check is waiting, matched or flagged; it is never added back to the customer's debt. System design → [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation), [Collection](SNS_SYSTEM_DESIGN.md#81-collection).
  - A payment not on the statement waits up to 3 days, then is flagged for investigation and listed on Exceptions. A fix goes through a payment correction (ST-09.2). Card-machine fees are entered monthly as an SNS expense (DN-13).
- **Checks:** AT-10, AT-11 "A bank payment cannot be matched: flagged for investigation; the customer's debt is not restored", AT-73 "Recorded Monday, not on the statement by Thursday: waiting until Wednesday, flagged on Thursday".
- **Screens:** 09.9 Bank and card check.
- **Decided:** DN-13.

#### ST-09.7 · Close the business day

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff, Admin.
- **Story:** As staff, I close the day after the evening count, so that the day's partner shares become final and can be cashed out.
- **Rules:**
  - Closing shows what is still open (drawer difference, payments waiting, car discrepancies, approvals, handovers in progress) and what becomes final. If nobody closes the day, it closes on its own at 11:59 PM Asia/Colombo. System design → [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - At the close, each rental day's rent share for partner cars becomes final, including rentals still out; extra km and late charges are final at return; items waiting for an admin stay out. Final amounts never change; a correction is a new dated line (PR-07).
  - Closing is recorded with the person and time and cannot be undone.
- **Checks:** AT-14, AT-27 "The day closes with a rental still out: that day's share is final and cash-out-able; extra km waits for return", AT-71 "Nobody presses Close the day: it closes at 11:59 PM".
- **Screens:** 09.11 Close the business day.
- **Decided:** DN-11.

#### ST-09.8 · Expenses

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff, Admin record; an admin decides who bears a cost when staff are unsure.
- **Story:** As staff, I record each expense with what it was for, the car, who bears it and how it was paid, so that costs are counted once and charged to the right person.
- **Rules:**
  - Office rent, salaries, utilities and other business expenses are recorded for reports; salaries come from payroll and are not entered again. System design → [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll).
  - On a partner car, staff choose the owner, SNS or "Admin decides". An owner-responsible cost paid by SNS is taken from the owner's final earnings before a cash-out, or repaid separately; only the unrecovered rest is deducted. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - Refunds are not expenses. Past expenses come from SNS's books, marked "Imported" (PR-04). Card-machine fees are entered once a month.
- **Checks:** AT-15 "An owner expense partly repaid separately: only the unrecovered remainder is deducted".
- **Screens:** 09.12 Expenses, 09.13 Record an expense.
- **Decided:** DN-13.

### 11 Partners: cash-outs and portal

#### ST-11.4 · Partner cash-outs

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Admin by default; may be given to chosen staff.
- **Story:** As an admin, I see each partner's final balance, today's not-final amounts, requests waiting and payouts made, so that partners are paid what is final and no more.
- **Rules:**
  - Each partner has one balance across all their cars; earnings are kept per car and per day. Balance = final earnings minus payouts and approved deductions. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - Items waiting for an admin (swap-day split, damage, accessory or garage-day allocation, early-return reduction, the extra above a package) stay out until decided. Fuel and cancellation fees are entirely SNS's.
  - SNS pays partners even when the customer has not paid; customer debts and partner payables are separate records.
- **Checks:** AT-13, AT-26 "A partner with two cars asks for part of the balance: one balance; payout recorded; the rest stays; a repeated request does not pay twice".
- **Screens:** 11.4 Partner cash-outs.
- **Decided:** DN-14.

#### ST-11.5 · Car earnings by day

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I see a partner car's earnings line by line (each day's rent, extra km, costs, cash-outs), so that every amount can be traced.
- **Rules:**
  - Each line is worked out from the rental's saved commission terms; a partner's share is rounded down to the rupee and SNS takes the difference (DN-10). System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
  - Final lines are never edited; a correction or approved reduction is a new dated adjustment line; an overpayment is recovered from later earnings (PR-07).
  - Opening balances and imported rentals are marked "Imported" and add no earnings (PR-04).
- **Checks:** AT-14, AT-16, AT-36, AT-70.
- **Screens:** 11.5 Car earnings by day.
- **Decided:** DN-10.

#### ST-11.6 · Pay and record a cash-out

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Admin by default ("Pay partner cash-outs" permission).
- **Story:** As an admin, I pay a partner's request in full or in part and record it once, so that the balance is right and nothing is paid twice.
- **Rules:**
  - A bank payout needs its reference; a cash payout at the branch is recorded the same way and shows as its own line in the drawer. Paying less leaves the rest in the balance. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation).
  - A payout is recorded atomically; sending it twice records it once (Derived control).
  - There is no minimum, maximum or frequency limit. A negative balance a departing partner does not repay is written off by the authorised person, as SNS's loss (DN-14).
- **Checks:** AT-26, AT-44 "A partner without a bank account asks to cash out: paid in cash at the branch and recorded once", AT-72, AT-76.
- **Screens:** 11.6 Pay and record a cash-out.
- **Decided:** DN-12, DN-14.

#### ST-11.7 · Partner app: my earnings

- **Status:** Confirmed; owner-data isolation on every request is a Derived control.
- **Phase:** 3.
- **Roles:** Partner.
- **Story:** As a partner, I see my final earnings by day and by car, my cash-outs and a PDF statement, so that I know what SNS owes me.
- **Rules:**
  - A partner sees only their own final earnings and cash-outs, never today's not-final amounts, other partners, customer details or the price a customer paid; a price above the package shows only as their one earning for the day. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts), [Revenue allocation](SNS_SYSTEM_DESIGN.md#84-revenue-allocation).
  - Access is checked on every request, not only by hiding pages (PR-06).
- **Checks:** AT-22 "A partner opens today's not-final earnings or another partner's: access denied", AT-39, AT-40.
- **Screens:** 11.7 Partner app · my earnings; prints 16.5 (ST-16.3).

#### ST-11.8 · Partner app: ask to cash out

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Partner.
- **Story:** As a partner, I ask to cash out all or part of my final balance, to my bank account or at the branch, so that I am paid when I need it.
- **Rules:**
  - Any final amount, any day, with no limits; SNS is told at once; the partner sees the request until it is paid. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
  - A car swapped out of an open rental is paid as returned: its final rent and extra km are payable at once (DN-14).
- **Checks:** AT-26, AT-75 "A partner's car is swapped out on day 2 of an open rental: its final rent and extra km are payable at once".
- **Screens:** 11.8 Partner app · ask to cash out.
- **Decided:** DN-14.

### 13 Payroll

#### ST-13.1 · Prepare and finalise payroll

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Whoever has the one payroll-management permission.
- **Story:** As the payroll person, I prepare each month's salaries with adjustments, advances, loans and what is still owed, then finalise them, so that everyone is paid correctly.
- **Rules:**
  - Salaries are admin-defined amounts entered by hand; no attendance, overtime or statutory (EPF/ETF) calculation. One permission covers preparing, finalising and paying. System design → [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll).
  - Staff cannot see a draft; after finalising, each person sees only their own payslip.
  - Deductions never take a salary below zero; the rest carries to next month. Whole rupees. A finalised payslip is never edited: a mistake is an adjustment line on a later payroll (DN-15).
  - Salary expense, salary payable, loans and cash paid are never counted twice in reports.
- **Checks:** AT-77 "40,000 salary, 50,000 loan, 50,000 deduction set: only 40,000 deducted; 10,000 carries", AT-78 "A finalised payslip had the wrong allowance: next month's payroll has an adjustment line".
- **Screens:** 13.1 Payroll · October draft, 13.2 Add an adjustment.
- **Decided:** DN-15.

#### ST-13.2 · Advances and loans

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Payroll person.
- **Story:** As the payroll person, I record an advance or a loan and how it is taken back, so that the balance is recovered from salary without mistakes.
- **Rules:**
  - Advances and loans, repayments and outstanding balances are kept; deductions come from future salaries within the never-below-zero rule. Paid in cash, it is its own line in the drawer. System design → [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll), [Cash drawer and daily reconciliation](SNS_SYSTEM_DESIGN.md#9-cash-drawer-and-daily-reconciliation).
  - The staff member sees their own advance and what is left to repay.
- **Checks:** AT-77.
- **Screens:** 13.3 Give an advance or loan.
- **Decided:** DN-12, DN-15.

#### ST-13.3 · Record a salary payment

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Payroll person.
- **Story:** As the payroll person, I record each salary payment, in full or in part, so that what is still owed carries forward and nothing is paid twice.
- **Rules:**
  - A partial payment leaves the rest as unpaid salary carried to next month; a repeated payment never overwrites an earlier one. A bank payment needs its reference; a cash payment is its own drawer line. System design → [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll).
- **Checks:** AT-23 "Partial salary or owner payout: the unpaid rest is kept; a repeated payment does not overwrite the earlier one", AT-72.
- **Screens:** 13.4 Record a salary payment.
- **Decided:** DN-12.

#### ST-13.4 · My payslip

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff (their own only).
- **Story:** As a staff member, I see my payslips, advances and loan balance and download a payslip, so that I can check my pay.
- **Rules:**
  - Employees see only their own payslips and advance or loan balances. System design → [Accounts](SNS_SYSTEM_DESIGN.md#31-accounts), [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll).
- **Checks:** AT-24.
- **Screens:** 13.5 My payslip · staff; prints 16.7 (ST-16.5).

### 12 Maintenance

#### ST-12.1 · Maintenance and renewals

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff, Admin, Owner.
- **Story:** As staff, I see cars off the road, costs on cars this month and what is coming up (services, insurance and licence renewals, cars due back), so that nothing expires unnoticed.
- **Rules:**
  - Reminders come only from dates or km entered; lead times are owner settings, starting at 30 days for insurance and licence, 7 days or 500 km for service and 3 days for payroll. System design → [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability).
  - Any garage visit is Under repair; an admin marks the car available again. The owner's own use is Temporarily unavailable with a reason and expected return; no trip or km tracking.
  - Expired insurance or licence warns; going ahead needs the authorised person and a reason.
- **Checks:** AT-20, AT-45.
- **Screens:** 12.1 Maintenance and renewals.

#### ST-12.2 · Add a service or repair record

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff, Admin; "Admin decides" goes to Approvals.
- **Story:** As staff, I record a service or repair with its date, odometer, cost and who pays, and the next service date or km, so that costs and reminders are right.
- **Rules:**
  - Who pays follows the partner's agreed terms; staff choose "Admin decides" when unsure. An owner-responsible cost is deducted from the owner's final earnings before a cash-out. System design → [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out), [Asset records, maintenance, and availability](SNS_SYSTEM_DESIGN.md#11-asset-records-maintenance-and-availability).
  - Saving does not change the car's status; an admin marks it available.
- **Checks:** AT-15, AT-20.
- **Screens:** 12.2 Add a service or repair record.

### 03 Morning check

#### ST-03.1 · Do the morning check

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff.
- **Story:** As staff, I tick each car the records say is at the branch, and add any car I see that the records say is elsewhere, so that the yard and the records agree.
- **Rules:**
  - Staff check the cars present at the branch; the system compares with its records and highlights differences. "At the branch" comes only from this check; there is no tracking of where cars are (PR-14). System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring).
  - A car not found shows "not found at the morning check" on every screen until its discrepancy is closed; a car found that the records put elsewhere opens a discrepancy without changing its status.
- **Checks:** AT-21.
- **Screens:** 03.1 Morning check · in progress, 03.2 Another car is here, 03.3 Morning check · finished.

#### ST-03.2 · Close a car discrepancy

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Whoever has the permission to resolve discrepancies.
- **Story:** As the person allowed, I close a discrepancy with an explanation and the confirmed or corrected status, so that every gap is explained.
- **Rules:**
  - Closing needs both an explanation and the car's confirmed or corrected status; it is recorded with name and time and goes into the owner's daily summary. If the car went out without a record, the rental is recorded first. System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring).
  - These checks support accountability; they cannot guarantee that every physical movement is recorded.
- **Checks:** AT-21 "A daily vehicle discrepancy is closed: explanation present and correct status verified".
- **Screens:** 03.4 Close a missing-car discrepancy.

### 16 Documents: partner and payslip

#### ST-16.3 · Partner earnings statement

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Partner (their own), Admin, Owner.
- **Story:** As a partner, I download a statement of my final earnings by car and day, so that I have a record for each cash-out.
- **Rules:**
  - Final amounts only, per car and per day, with what was left from before, payouts and the balance; items waiting for SNS are named but not counted. System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports), [Vehicle-owner earnings and daily cash-out](SNS_SYSTEM_DESIGN.md#10-vehicle-owner-earnings-and-daily-cash-out).
- **Checks:** AT-22.
- **Screens:** 16.5 Partner earnings statement.

#### ST-16.4 · Partner agreement

- **Status:** Confirmed.
- **Phase:** 1 for adding a partner; printed from Phase 3 with the cash-out terms.
- **Roles:** Admin, Owner.
- **Story:** As an admin, I print the partner agreement filled with the partner's cars and terms, so that it can be signed on paper.
- **Rules:**
  - It covers commission, the daily cash-out and who pays which costs, in Sinhala or English; it is signed and kept on paper, and staff record "signed on <date>"; nothing waits on it; a change of terms prints a new version. SNS supplies the wording and the owner approves each version. System design → [Documents, languages, and exports](SNS_SYSTEM_DESIGN.md#14-documents-languages-and-exports).
- **Checks:** AT-83.
- **Screens:** 16.6 Partner agreement.
- **Decided:** DN-20.

#### ST-16.5 · Payslip

- **Status:** Confirmed.
- **Phase:** 3.
- **Roles:** Staff (their own), payroll person.
- **Story:** As a staff member, I print or download my payslip, so that I have a record of my pay.
- **Rules:**
  - Shows salary, additions, deductions, to pay, payments and still owed; no attendance or statutory calculation. System design → [Business expenses and payroll](SNS_SYSTEM_DESIGN.md#13-business-expenses-and-payroll).
- **Checks:** AT-23.
- **Screens:** 16.7 Payslip.

## 13. Phase 4 · Live

Month 6: the owner's dashboard and reports, loading SNS's starting data, going live, recovery and the outage fallback. Written with Dulan, 26 Oct 2026, for review.

### 02 Home: owner

#### ST-02.3 · Owner home

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Owner.
- **Story:** As the owner, I open the system to today's money, the fleet, what is coming up and what needs me, so that I can run SNS without being at the branch.
- **Rules:**
  - Shows fleet today, collections, SNS earnings, customer debt, partner payments (including today's not-final amounts, owner view only), exceptions and upcoming work; each figure opens what is behind it. System design → [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting).
  - Collections, earnings, deposits held and partner payables are never added together; profit is labelled "before depreciation" (DN-16).
- **Checks:** AT-28, AT-79.
- **Screens:** 02.1 Owner home, 02.5 Owner · More menu.
- **Decided:** DN-16.

#### ST-02.4 · Needs attention and the daily summary

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Owner; Admin by permission.
- **Story:** As the owner, I see every decision made by hand today and everything not yet cleared, so that I can review exceptions each evening.
- **Rules:**
  - The owner gets a daily in-system summary of exceptional decisions (waivers, overrides, corrections, write-offs, self-approved requests, records entered after an outage); no automatic customer messages. System design → [Daily vehicle checks and exception monitoring](SNS_SYSTEM_DESIGN.md#12-daily-vehicle-checks-and-exception-monitoring), [Default permissions](SNS_SYSTEM_DESIGN.md#32-default-permissions).
- **Checks:** AT-57, AT-81.
- **Screens:** 02.3 Needs attention, 02.6 Staff · More menu.

### 14 Reports

#### ST-14.1 · Reports and exports

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Owner, Admin; exports need their own permission.
- **Story:** As the owner, I see collections, SNS earnings, customer debt, partner payments, exceptions and upcoming work for a day, week, month or chosen dates, and export them, so that I and my accountant can review the business.
- **Rules:**
  - Definitions: SNS earnings, profit before depreciation, counted when final, expenses when recorded; an unfinished month is compared with the same days of last month (DN-16). System design → [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting).
  - Imported records are counted in reports, marked "Imported", never as earnings (PR-04). Excel and PDF exports need the export permission, checked by the server (PR-11, PR-06).
- **Checks:** AT-24, AT-37, AT-79.
- **Screens:** 14.1 Reports.
- **Decided:** DN-16.

#### ST-14.2 · Car performance

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Owner, Admin.
- **Story:** As the owner, I see each car's rental days, km, earnings, costs and time off the road, this month against last, so that I know which cars pay.
- **Rules:**
  - Car use = rented days divided by days in the fleet (retired days excluded); SNS's share and the partner's share are shown apart. System design → [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting).
- **Checks:** AT-80 "A car in the fleet all 31 days and rented 22: car use 71%".
- **Screens:** 14.2 Car performance.
- **Decided:** DN-16.

### Starting data

#### ST-SD.1 · Load and approve SNS's starting data

- **Status:** Confirmed (CR-003, ADD-002).
- **Phase:** 4.
- **Roles:** Developer loads; the owner approves.
- **Story:** As the owner, I approve the records loaded from SNS's books before go-live, so that the system starts with the real customers, cars, partners, balances and history.
- **Rules:**
  - Loaded once: customers with their flags, cars and packages, partners; opening balances (drawer cash, customer debts, partner balances, staff advances and loans); past rentals, payments, expenses and payroll. Each is marked "Imported" with who approved it and when. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - Opening balances are final from go-live and never earnings; past records are read-only, never recalculated, counted in reports and never in earnings, cash-outs or the drawer. Imported customers still need their copies before the next handover.
  - Rentals out on go-live day are entered as live rentals marked "Started before go-live"; partner earnings count only days from go-live.
- **Checks:** AT-36, AT-37, AT-38, AT-42.
- **Screens:** No screen of its own; the Imported marker shows on 17.1, 08.2 and 11.2.

#### ST-SD.2 · Go live

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Owner.
- **Story:** As the owner, I go live only when every checklist item is done, so that the first day runs on complete data.
- **Rules:**
  - All of these must be done: business details on printouts, every car, starting packages, insurance and licence dates for every car, every partner car linked, staff accounts, the authorised person named, opening cash counted and entered before the first transaction, SNS's agreement wording approved. System design → [Starting data](SNS_SYSTEM_DESIGN.md#starting-data).
  - Staff training and full testing are part of Phase 4 (approved proposal).
- **Checks:** AT-43 "One car has no insurance date on go-live day: go-live is blocked".
- **Screens:** 01.3 Ready to start · setup checklist (ST-01.3).
- **Decided:** DN-20.

### 17 System, 19 Navigation, and running the system

#### ST-17.1 · System states

- **Status:** Confirmed.
- **Phase:** All.
- **Roles:** Everyone.
- **Story:** As anyone using the system, I see clear empty, offline, error, no-permission, changed-by-someone-else, imported and entered-after-outage states, so that I always know what happened.
- **Rules:**
  - Online only (PR-03): what was typed stays on the screen when the connection drops, and nothing is saved until it is back. A change made by someone else while a page is open must be loaded before saving, so nothing is overwritten. System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context), [Derived integrity controls](SNS_SYSTEM_DESIGN.md#173-derived-integrity-controls).
  - A record entered after an outage keeps its real time and shows who entered it and when.
- **Checks:** AT-24, AT-37, AT-81.
- **Screens:** 17.1 System states, 17.2 Design notes.

#### ST-19.1 · Navigation

- **Status:** Confirmed.
- **Phase:** All.
- **Roles:** Everyone, by role.
- **Story:** As anyone, I reach my work from a side bar on a computer and a bottom bar on a phone, with counts that open filtered lists, so that the next task is one tap away.
- **Rules:**
  - A count such as "Overdue 1" opens the matching list already filtered, with the filter shown and removable. Each role sees only what its permissions allow. System design → [Dashboard and reporting](SNS_SYSTEM_DESIGN.md#15-dashboard-and-reporting).
- **Checks:** AT-28.
- **Screens:** 19.1 Navigation · sidebar.

#### ST-17.2 · When the system is down

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Staff, Owner.
- **Story:** As staff, I keep renting on paper when the system cannot be reached, then enter what happened, so that the branch never stops.
- **Rules:**
  - Office internet down: use mobile data on a phone. System down: use the printed backup pack (blank rental agreement, handover and payment forms) and the fleet list the system prints each evening; enter each paper record afterwards with its real time, marked "entered after outage". This is a paper fallback, not offline operation. System design → [Goals and operating context](SNS_SYSTEM_DESIGN.md#2-goals-and-operating-context).
- **Checks:** AT-81.
- **Screens:** 17.1 System states (the marker). The backup pack and the evening fleet list have no screen yet: to be designed in Phase 4.
- **Decided:** DN-17.

#### ST-17.3 · Backups and recovery

- **Status:** Confirmed.
- **Phase:** 4.
- **Roles:** Developer; the owner holds the accounts.
- **Story:** As the owner, I know the system is backed up every day and can be brought back quickly, so that SNS never loses more than a day.
- **Rules:**
  - Daily automatic backups, kept 30 days, with an off-site copy; at most one day of records may be lost and re-entered from paper; back within 4 working hours; a restore is tested monthly. System design → [Operational and security decisions still required](SNS_SYSTEM_DESIGN.md#18-operational-and-security-decisions-still-required).
  - Hosting: Next.js and PostgreSQL on one DigitalOcean server with private Cloudflare R2 storage, in the owner's name, about LKR 5,000 a month (DN-19).
- **Checks:** AT-82.
- **Screens:** None.
- **Decided:** DN-18, DN-19.
