# SNS Rent Car · Product requirements (PRD)

What the SNS Rent Car system must do, written as stories a developer can build and a tester can check.

This document is **derived** from `SNS_SYSTEM_DESIGN.md`, the source of truth (rank 1). The PRD is rank 2: it may restate, detail or split what the source of truth says, never contradict or extend it. Where they differ, the source of truth wins and this file is corrected. Every story cites the source-of-truth section (`SoT §n`) and acceptance scenarios (`AT-nn`) it comes from. Changes follow `.agents/skills/sns-change-control/SKILL.md`: the source of truth first, then this file.

Status of this draft: front section and Phase 1 to 4 modules, written with Dulan from 26 Oct 2026. Sections not yet written say so.

## 1. Sources

| Source | What this PRD takes from it |
| --- | --- |
| `SNS_SYSTEM_DESIGN.md` | Every requirement, rule, status and acceptance scenario |
| `proposal/` (approved, frozen) | The four delivery phases each module belongs to; nothing else |
| `screens/` | The screens each story uses (`NN.n`). Screens show sample data and never add a rule |
| `brand/guidebook/`, `design-system/` | How screens look and read; cited where a story depends on it |

## 2. How to read a story

```text
ST-NN.n  Title
Status:   Confirmed | Derived control (review before build) | Proposed (not built until agreed)
Phase:    1–4, from the approved proposal
Roles:    who uses it (default permissions, SoT §3.2; all configurable)
Story:    As <role>, I can … so that …
Rules:    what it must obey, each with its SoT §
Checks:   AT-ids from SoT §19. A check written here with no AT-id is marked (Proposed check)
          and is not a requirement until it is added to SoT §19.
Screens:  NN.n Name
Decisions needed: DN-nn, where an Open item blocks part of the story
```

- **Status** is copied from the source of truth and never raised here. Only the owner, S D De Silva, confirms a rule; Dulan records it in the source of truth.
- **Open** items are never answered in a story. They appear as `Decision needed` (section 7) and the story says what waits on them.
- IDs follow the screen modules: `ST-05.3` is the third story in module 05. Screen numbers are `NN.n` as in `screens/README.md`.

## 3. Roles

From SoT §3.1. Permissions are configurable; the defaults are in SoT §3.2.

| Role | Who | Sees and does |
| --- | --- | --- |
| **Owner** | The primary owner, S D De Silva; one of the two admins | Everything, the owner dashboard, and sets critical permissions for others |
| **Admin** | The additional admin | What the owner allows |
| **Staff** | Three employees | Daily operations by permission; their own payslips and advance or loan balances |
| **Partner** | A vehicle owner who is not SNS; one account for all their cars | Only their own final earnings (by day and by car, PDFs), their cash-out history, and asking for a cash-out. Never today's not-final amounts, other partners' data or customer details |

Customers have no accounts (SoT §3.1). They get printed documents (SoT §14).

## 4. Phases

From the approved proposal. Price and payments are in the proposal and are not repeated here.

| Phase | When | Promised |
| --- | --- | --- |
| 1 · Foundation | Month 1 | Staff accounts and permissions, customers and documents, cars and packages, partner owners |
| 2 · Rentals | Months 2–3 | Rentals, agreement print, handover and return, bill, extensions, swaps, payments, deposits, customer debt, fuel and accessories |
| 3 · Money | Months 4–5 | Cash drawer and daily count, partner payments (daily cash-out) and partner portal, expenses, payroll, maintenance reminders, vehicle check |
| 4 · Live | Month 6 | Owner dashboard, reports, full testing, going live, staff training |

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
| 06 Rentals | 06.1–06.7 | 2 | Not yet written |
| 07 Return | 07.1–07.3 | 2 | Not yet written |
| 09 Money: payments | 09.3–09.5 | 2 | Not yet written |
| 08 Customers: write-off | 08.6 | 2 | Not yet written |
| 10 Approvals | 10.1–10.3 | 2 | Not yet written |
| 16 Documents: rental | 16.1–16.4 | 2 | Not yet written |
| 02 Home: staff and search | 02.2, 02.4 | 2 | Not yet written |
| 09 Money: drawer, day and expenses | 09.1–09.2, 09.6–09.13 | 3 | Not yet written |
| 11 Partners: cash-outs and portal | 11.4–11.8 | 3 | Not yet written |
| 13 Payroll | 13.1–13.5 | 3 | Not yet written |
| 12 Maintenance | 12.1–12.2 | 3 | Not yet written |
| 03 Morning check | 03.1–03.4 | 3 | Not yet written |
| 16 Documents: partner and payslip | 16.5–16.7 | 3 | Not yet written |
| 02 Home: owner | 02.1, 02.3, 02.5–02.6 | 4 | Not yet written |
| 14 Reports | 14.1–14.2 | 4 | Not yet written |
| 17 System states, 19 Navigation | 17.1–17.2, 19.1 | All | Not yet written |

## 6. Rules for every module

These apply to every story and are not repeated in each.

| ID | Rule | Status | Source |
| --- | --- | --- | --- |
| PR-01 | Sinhala is the default interface language; each user can switch to English. Plain everyday Sinhala; English only for words SNS already uses. | Confirmed | SoT §2, §14; `brand/guidebook/04-language-and-voice.md` |
| PR-02 | Works on office computers and phones. | Confirmed | SoT §2 |
| PR-03 | Online only; no offline operation. | Confirmed | SoT §2, §16 |
| PR-04 | Fresh start: zero opening balances, no historical imports. Cash introduced after launch is recorded as a cash movement, not rental earnings. | Confirmed | SoT §2, §16 |
| PR-05 | Every transaction records the staff member who entered it. Every exceptional decision records a reason, actor, date and time. | Confirmed | SoT §3.2 |
| PR-06 | Permissions are configurable, starting from the defaults in SoT §3.2. They are enforced by the server on every request, not only by hiding menu items. | Confirmed; enforcement is a Derived control | SoT §3.2, §17.3; AT-24 |
| PR-07 | Money that is final is never edited; a correction is a new dated line that keeps the original. | Confirmed | SoT §8.3, §10 |
| PR-08 | Each rental keeps the terms that applied when it was agreed (prices, commission, cutoff, deadline); package changes affect new rentals only. | Confirmed; snapshot storage is a Derived control | SoT §4.3; AT-05 |
| PR-09 | Never invent data; sample and example values are labelled. Nothing is called "profit" until the owner defines SNS earnings. Deposits are held money, not income. | Confirmed | SoT §8.2, §15; `AGENTS.md` §4 |
| PR-10 | Printed agreements, receipts and bills are available in Sinhala or English. | Confirmed | SoT §14 |
| PR-11 | Report exports (Excel and PDF) need their own permission. | Confirmed | SoT §3.2, §14 |
| PR-12 | Data is backed up automatically every day. | Confirmed | SoT §18 |
| PR-13 | Staff with customer access see full NIC and phone numbers; no masking. | Confirmed | SoT §6 |
| PR-14 | No GPS, automatic bank verification, payment integration, fraud guarantees or customer trust scores. | Confirmed | SoT §2 (no trust guarantee), §8.1 (manual recording), §12 (no fraud guarantee), §16 (GPS, payment integration); `AGENTS.md` §4 (no trust scores) |
| PR-15 | Business times are read in Asia/Colombo. | Proposed | SoT §5.1 |

## 7. Decisions needed

Every Open item in the source of truth, with the stories it blocks. A story never assumes an answer to one of these. When the owner decides, the source of truth changes first, then the stories.

| ID | Open decision | SoT | Blocks | Phase | Decides |
| --- | --- | --- | --- | --- | --- |
| DN-01 | Exact permission catalogue, delegation limits, whether a requester may approve their own price or payment correction, approval workflow | §3.2, §18 | 15 Settings, 10 Approvals | 1, 2 | SNS owner |
| DN-02 | Document retention, deletion and access scope | §18 | 08 Customers, 06 Rentals | 1 | SNS owner with advice |
| DN-03 | Login recovery and stronger protection for owner and admin accounts | §18 | 01 Start, 15 Settings | 1 | SNS owner with developer |
| DN-04 | Garage-day charge: what triggers it, who decides it, how it is split on a partner car | §4.2 | 07 Return | 2 | SNS owner |
| DN-05 | Whether a missing accessory or the fuel level blocks handover; how an accessory-shortage charge is split on a partner car | §6 | 06 Rentals, 07 Return | 2 | SNS owner |
| DN-06 | Fuel charging workflow: same-level return versus paid fuel | §16, §18 | 06 Rentals, 07 Return | 2 | SNS owner |
| DN-07 | Swaps: allowance pool on a swap day when allowances differ, rounding, partial-day earnings outside the admin-allocated day | §7.5, §18 | 06 Rentals | 2 | SNS owner |
| DN-08 | Amended agreement or signature after an extension or swap | §7.5, §18 | 06 Rentals, 16 Documents | 2 | SNS owner |
| DN-09 | Effect of an early return on included kilometres | §18 | 07 Return | 2 | SNS owner |
| DN-10 | Charge and discount allocation, and currency rounding | §7.5, §10, §13, §18 | 07 Return, 11 Partners, 13 Payroll | 2, 3 | SNS owner with developer |
| DN-11 | Business-day close time, which also decides when partner earnings become final | §9, §10, §18 | 09 Money, 11 Partners | 3 | SNS owner |
| DN-12 | Whether partner cash-outs, salaries and owner withdrawals paid in cash leave the drawer, and how they change the expected cash | §9, §10, §18 | 09 Money, 11 Partners, 13 Payroll | 3 | SNS owner |
| DN-13 | Payment-processor fees, bank and card posting delays, evidence needed to resolve a cash difference | §9 | 09 Money | 3 | SNS owner |
| DN-14 | Cash-out limits and frequency, if any; a returned car segment while its swapped rental is still open; final recovery when a retired car or partner has no future earnings | §10, §18 | 11 Partners | 3 | SNS owner |
| DN-15 | Payroll deduction limits, rounding, adjustments after finalisation, deductions above net salary | §13, §18 | 13 Payroll | 3 | SNS owner |
| DN-16 | Reporting definitions: what counts as SNS earnings ("profit"), depreciation, when expenses and earnings are recognised, the utilisation measure, comparing an unfinished month | §15, §18 | 02 Home (owner), 14 Reports | 4 | SNS owner |
| DN-17 | Outage procedure for an online-only branch | §18 | 17 System | 4 | SNS owner |
| DN-18 | Acceptable data loss and recovery time (daily backup itself is Confirmed) | §18 | TRD | 4 | SNS owner with developer |
| DN-19 | Hosting vendor and technology stack | §16, §18 | TRD | — | Dulan and SNS owner |

## 8. Proposed, not yet agreed

Built only after the owner agrees and the source of truth marks them Confirmed.

| Item | SoT | Note |
| --- | --- | --- |
| Optional catalogue photo per car | §4.2, §16; AT-29 | Change request `change-requests/CR-001-vehicle-catalogue-photo.md`, awaiting the owner |
| Business times in Asia/Colombo; exact day-boundary and business-day-close calculations | §5.1 | Needs worked examples and confirmation |
| Recorded payment status kept separate from reconciliation status | §9 | Reconciliation model |
| Responsive web application, modular backend, relational database, private file storage | §17.2 | Architecture candidate; the TRD takes it up |

## 9. Out of scope

From SoT §16 and the approved proposal's list of what is not included. None of these is built.

| Item | Source |
| --- | --- |
| Advance reservations; rentals are walk-in only | SoT §2, §16; proposal |
| Offline operation | SoT §16; proposal |
| Historical imports and opening balances | SoT §16; proposal |
| Automatic customer reminders (SMS, WhatsApp) | SoT §12, §16; proposal |
| Bank, card or payment-provider integration | SoT §8.1, §16; proposal |
| Separate driver records | SoT §6, §16 |
| Attendance, overtime, automatic statutory (EPF/ETF) calculations | SoT §13, §16; proposal |
| GPS tracking | SoT §16; proposal |
| Non-rental vehicle movement tracking (future extension) | SoT §11, §16 |
| An app-store app (the website works like an app on a phone) | SoT §16; proposal |
