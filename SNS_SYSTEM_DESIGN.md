# SNS Rent Car — System Design

Date: 25 October 2026  
Status: Consolidated requirements draft for stakeholder review  
Business: SNS Rent Car, one physical branch

## 1. Purpose and decision authority

This document consolidates the decisions made with Dulan for the proposed SNS Rent Car system. It is the initial source of truth for further design discussions. It is not a claim that the implementation specification, commercial agreement, or legal wording is complete.

**Status labels:**

- **Confirmed:** Explicit stakeholder decisions from the planning conversation.
- **Derived control:** Behaviour needed to make those decisions internally consistent; review before implementation.
- **Proposed:** A design recommendation, not an approved requirement.
- **Open:** A decision still required. Do not silently implement an assumed answer.
- **Deferred:** Outside the current release or explicitly postponed.

Later stakeholder decisions supersede this document. Update this document before propagating changes into implementation tasks or a client proposal. Continue unresolved decisions with the stakeholder one question at a time.

**Single source of truth.** This file, `SNS_SYSTEM_DESIGN.md` at the repository root, is the one source of truth for requirements and decisions. Every other reference follows it; where one disagrees, this document wins and the other is corrected.

**Companion references (latest only):**

- **Screen design:** design canvas "SNS Rent Car · Plate" (https://claude.ai/artifact/XPpVE6ZafYtyG4gRZukHYz): 170 screens, desktop and phone versions, in 17 numbered modules (`NN-Module-Screen-Desktop|Phone`). It shows examples and sample data, not requirements.
- **Design system:** "SNS Rent Car · Plate" (https://claude.ai/artifact/E1pWnYhfHjpZ9C18ipGBWv): tokens, components (`window.Plate`) and the brand book. Earlier systems (Ratna, Concept A/B/C) are retired.
- **Offline copy of the screens and design system:** `design/` in this folder, a read-only snapshot for agents and tools that cannot open claude.ai (see `design/README.md`). The online canvas and design system stay the master copy.
- **Client proposal:** `proposal/SNS_Rent_a_Car_Proposal_SI.pdf` and `proposal/SNS Rent a Car Proposal.html` in this folder (artifact: https://claude.ai/artifact/DCDGDwQJRuL7K8AUNN4nQ5). Commercial terms and phases live there; requirements live here. **Approved by the client and frozen** (confirmed by Dulan, 24 Oct 2026; approval date to be recorded): changes to scope, phases, price, payments, timeline or the agreement go through a change request (`change-requests/`) and an addendum (`addenda/`), never by editing the proposal.

**Change control.** Every change follows the `sns-change-control` skill (`.agents/skills/sns-change-control/SKILL.md`): update this document first, then propagate in order (PRD → TRD → design system → screens → proposal addendum → agent files → code), run the sync audit and commit. History is kept in git, not inside this document.


## 2. Goals and operating context

### Confirmed goals

1. Manage SNS's daily rental operations, customer records, payments, expenses, partner earnings and cash-outs, vehicle maintenance, and payroll.
2. Reduce manual paperwork by generating printable documents and retaining signed copies.
3. Improve employee accountability and support detection of financial and vehicle discrepancies.
4. Give the primary owner a detailed view of business activity and performance.
5. Give vehicle partners access to their final earnings, and let them request a cash-out on any day.

SNS primarily serves customers from its local area because trust is important when releasing vehicles. Customer approval remains a staff decision supported by records; the system does not guarantee customer trustworthiness.

| Dimension | Confirmed scope |
| --- | --- |
| Locations | One branch |
| Vehicles at launch | Approximately 30 |
| Ownership | SNS-owned and partner-owned vehicles |
| Staff | One primary owner, one additional admin, three employees |
| Devices | Office computers and mobile phones |
| Connectivity | Online-only |
| Interface | Sinhala default; English switch per user |
| Rentals | Walk-in rentals, no advance reservations |
| Initial data | Fresh start, zero opening balances, no historical imports |
| Budget and hosting | Deferred for later decision |

Any cash introduced after launch must be recorded as a cash movement, not treated as rental earnings.

## 3. Actors, access, and accountability

### 3.1 Accounts

- **Primary owner:** One of the two admins. Full owner dashboard and authority to configure critical permissions for other staff.
- **Additional admin:** Access controlled by the primary owner.
- **Employee:** Operational access according to assigned permissions; access to their own payslips and advance/loan balances.
- **Partner vehicle owner:** One account for all their vehicles. Access only to their own final rental earnings (day by day, per vehicle, with downloadable PDFs), their cash-out history, and the ability to request a cash-out. Never today's not-final amounts, other owners' data, or customer details.

Customer-facing accounts are not confirmed. Customer document delivery is through the agreed printable documents.

### 3.2 Default permissions

All critical permissions are configurable. The following are agreed defaults, not hard-coded role restrictions.

| Action | Default rule |
| --- | --- |
| Approve a first-time customer | Employees or admins |
| Proceed despite a customer flag | Employees or admins; reason recorded |
| Set or waive a deposit | Employees or admins; exceptional decision recorded |
| Allow payment after return | Employees or admins; decision recorded |
| Extend a rental by phone | Employees or admins |
| Decide a late-return charge | Employees or admins; no separate approval |
| Decide a damage charge | Employees or admins |
| Allocate damage proceeds | Admin decides |
| Change agreed rental price or grant discount | Admin approval required |
| Correct a recorded payment | Admin approval required |
| Reduce charges for an early return | Admin decides |
| Decide swap pricing and swap-day allocations | Admin decides |
| Issue refunds or pay expenses | Employees or admins |
| Pay partner cash-out requests and record payouts | Admin by default; may delegate to selected employees |
| Reconcile payments and resolve discrepancies | Authorised person; configurable |
| Override expired-document warnings | Authorised person, following the relevant admin/override permission |
| Write off a customer debt | Authorised person |
| Retain a cancellation fee | Authorised person |
| Manage payroll | One payroll-management permission; no separate preparation/finalisation/payment permissions |
| Export reports | Separate configurable export permission |

Every exceptional decision requires a reason, actor, date, and time. Each transaction must identify the staff member who recorded it, even though staff share one cash drawer.

**Open:** Exact permission catalogue, delegation limits, and whether a requester may approve their own price/payment correction. These should be settled before implementing approvals.

## 4. Vehicles, packages, and historical terms

### 4.1 Initial defaults

| Vehicle type | Daily rental (LKR) | Included km/day | Extra km (LKR/km) |
| --- | ---: | ---: | ---: |
| Wagon R, Spacia | 4,500 | 100 | 25 |
| Every (van) | 5,000 | 100 | 25 |
| Alto | 4,000 | 100 | 17 |
| Prius, Axio | 6,500 | 100 | 27 |

Admins can define each vehicle's package according to its condition and update packages later. The extra-km rates above are design rates; final rates will be set per vehicle.

### 4.2 Per-vehicle settings

- Ownership: SNS or partner.
- Daily rate, included daily kilometres, and extra-kilometre rate.
- SNS commission percentage, default 15%.
- Long-rental surcharge amount, default LKR 500 per applicable day.
- Surcharge starting day, default day six.
- Garage-day charge, default LKR 5,000 per day. **Open:** what triggers it, who decides it, and how it is split on a partner vehicle.
- Agreed payment terms and expense responsibilities.
- Catalogue photo: optional, one per vehicle, added or replaced by an admin. It is shown on the vehicle's card and profile; until one is added, the system shows the model's standard image. It is not a condition photo, not a handover requirement and not a customer document. **Proposed** under change request CR-001 (no charge, no extra time), decided by Dulan on 25 Oct 2026; becomes Confirmed when the owner agrees CR-001.

### 4.3 Historical terms

Existing rentals retain agreed prices, commission percentages, pickup cutoff, and return deadline. Extensions retain original rates. Changes apply to new rentals only.

**Derived control:** Store a snapshot/version of applicable terms on each rental and vehicle-use segment rather than recalculating old rentals using current package settings. Capture a replacement vehicle's applicable terms when it joins a rental.

SNS-owned vehicle rental earnings belong to SNS; there are no partner earnings or cash-outs for those vehicles.

## 5. Rental calendar and charges

### 5.1 Business-wide timing

Pickup cutoff and return deadline are business-wide settings. The provisional example uses 3:00 PM and 8:00 AM; the owner can choose different times later.

| Pickup example | Deadline for one rental day |
| --- | --- |
| Monday before 3:00 PM | Tuesday at 8:00 AM |
| Monday at or after 3:00 PM | Wednesday at 8:00 AM |

Pickup exactly at the cutoff belongs to the next rental day. The minimum charge is one full rental day; there are no shorter-hire packages.

**Proposed:** Interpret all business timestamps in Asia/Colombo and retain timestamps consistently in storage. Exact day-boundary and business-day-close calculations still require worked examples and confirmation.

### 5.2 Kilometres and surcharge

- For the same vehicle, included kilometres are pooled across the rental: three days at 100 km/day provides 300 km total.
- Under the default surcharge, days one through five have no surcharge. Day six adds LKR 500, day seven adds another LKR 500.
- Both amount and starting day are configurable per vehicle.
- Late-return charges are staff decisions, not an assumed automatic hourly or full-day rule.
- An admin decides whether to reduce charges after early return.

### 5.3 Example calculations without swaps

For an undiscounted rental with a constant vehicle package:

```text
included_km = charged_days × included_km_per_day
extra_km = max(0, return_odometer - outgoing_odometer - included_km)
extra_km_charge = extra_km × extra_km_rate
surcharge_days = max(0, charged_days - surcharge_start_day + 1)
long_rental_surcharge = surcharge_days × surcharge_per_day
base_rental_charge = charged_days × daily_rate
```

These formulas do not resolve discretionary late returns, early-return allowance changes, or swap-day allocation rules; those require the recorded decision and rules described below.

## 6. Customer onboarding and mandatory documents

Staff record customer identity and driving-licence details and retain document copies. A reference person is required only sometimes; staff decide. Staff with customer access see full NIC and phone numbers; there is no masking.

### Handover requirements

Handover is blocked until the following are present:

1. Customer ID copy.
2. Customer driving-licence copy.
3. Signed rental agreement uploaded as a photo or scan.
4. Outgoing odometer reading.
5. Reference person's ID and driving-licence copies, when a reference person is required.

Vehicle-condition photos are optional. Incoming odometer readings are mandatory at return.

An accessories checklist is recorded at handover and return. **Open:** whether a missing accessory or the fuel level blocks handover, and how an accessory-shortage charge is allocated on a partner vehicle.

An expired customer driving licence triggers a warning. An authorised person may override it with a reason. An override does not make the licence legally valid.

Staff may flag a customer for unpaid balances, damage, or other issues. Warnings appear before future rentals; employees may proceed with a recorded reason.

A customer may rent multiple vehicles simultaneously. Each has its own agreement and bill. Separate actual-driver records per vehicle are outside the agreed scope.

## 7. Rental lifecycle and exceptions

### 7.1 Normal journey

1. Customer arrives; staff locate or create the customer record and review warnings.
2. Staff select an available vehicle and agree the rental dates, terms, payment timing, and deposit.
3. System generates the agreement in the selected language.
4. Customer signs the printed agreement; staff upload it and required identity documents.
5. Staff record the outgoing odometer and any optional photos; system validates handover requirements.
6. Vehicle is handed over and becomes rented.
7. Staff manage any phone extension, swap, payment, or exceptional decision.
8. On return, staff record the incoming odometer and relevant charges/decisions.
9. System calculates the bill; staff allocate deposits, collect payments, record debt, and refund any balance due to the customer.
10. Vehicle becomes available or is marked unavailable/under repair. Financial obligations remain traceable even if collection or payout occurs later.

### 7.2 Extensions

Employees can accept phone extensions without separate admin approval. Record the staff member and revised deadline. Retain original rental rates and historical terms.

### 7.3 Cancellation before handover

Staff can cancel a rental before handover with a reason. An authorised person can retain a cancellation fee; record the fee and refund. Cancellation fees belong entirely to SNS and do not contribute to partner earnings.

### 7.4 Early and late return

- Early-return reductions require an admin decision.
- Late-return charges may be set or waived by employees with a reason.
- Late-return charges follow the vehicle's commission split.
- If an approved adjustment creates an owner overpayment (for example, after the owner has already cashed out), recover it from the owner's later earnings before their next cash-out.

### 7.5 Vehicle swaps

| Topic | Confirmed rule |
| --- | --- |
| Replacement price | Admin decides case by case |
| Earnings | Based on actual use of each vehicle |
| Swap-day rental split | Admin decides |
| Kilometre calculations | Separate for each vehicle |
| Swap-day included allowance | Admin divides it between the two vehicles |
| Extra-kilometre rate | Each vehicle's own saved package rate |
| Surcharge day count | Continues from original rental start |
| Replacement surcharge rule | Replacement's amount and starting day apply from swap onward |
| Swap-day surcharge | Admin decides amount and allocation |

**Derived control:** Capture the old vehicle's return reading and replacement vehicle's outgoing reading. Preserve one rental's sequence of vehicle-use segments. Prevent simultaneous active allocation of a vehicle across rentals, including concurrent employee submissions.

**Open:** Define the allowance pool on a swap day when vehicle allowances differ, rounding, partial-day earnings outside the admin-allocated day, and any amended agreement/signature required for a swap or extension.

## 8. Payments, deposits, and customer balances

### 8.1 Collection

- Cash, bank transfer, card, and mixed payments are supported.
- All payments are manually recorded; no payment-provider integration.
- Bank/card entries count as confirmed immediately when entered.
- Bank transfers require a transaction reference; card payments require a receipt number.
- One payment can be allocated across multiple bills belonging to the customer.
- Payment timing is customer-dependent. Employees can allow an unpaid balance after return.

### 8.2 Deposits

Employees can set or waive a security deposit based on vehicle and customer. Deposits can pay the final bill or damage charges; refund the remaining amount. Record every application and refund.

**Derived control:** Refundable deposits are money held, not rental earnings. Advances/payments must not be counted again when allocated to a bill. Allocations cannot exceed the available payment/deposit balance.

### 8.3 Corrections and write-offs

Payment corrections require admin approval and retain the original record plus correction history. Authorised staff can write off an uncollectable debt with a reason. The loss belongs entirely to SNS; vehicle-owner earnings remain unchanged.

### 8.4 Revenue allocation

| Item | Allocation |
| --- | --- |
| Base rental and extra-kilometre charges | Vehicle commission split |
| Long-rental surcharge | Vehicle commission split |
| Late-return charge | Vehicle commission split |
| Discount | Reduces SNS and owner earnings proportionally |
| Damage recovery | Admin decides allocation |
| Cancellation fee | 100% SNS |
| Fuel | 100% SNS |
| Customer debt write-off | SNS bears loss |

## 9. Cash drawer and daily reconciliation

One shared drawer receives collections and funds expenses and refunds. Every movement is recorded with the responsible user.

Authorised staff reconcile cash, bank transfers, and cards daily:

- Preserve expected and counted cash amounts.
- Record, explain, and resolve shortages or surpluses.
- Match bank/card records to statements or card-machine totals.
- Unmatched payments remain flagged for investigation rather than automatically becoming customer debt again.
- Any required payment correction follows the approval process.

**Proposed reconciliation model:** Separate recorded payment status from reconciliation status. A payment can remain recorded as confirmed while reconciliation is unmatched or under investigation.

**Open:** Treatment of payment-processor fees, bank/card posting delays, business-day closure time (which also decides when partner earnings become final), whether and how partner cash-outs, salaries, and owner withdrawals paid in cash leave the drawer and affect expected cash, and the evidence needed to resolve a cash difference. A reconciliation adjustment must not silently rewrite the original transaction.

## 10. Vehicle-owner earnings and daily cash-out

Partners can cash out daily. There are no settlement periods.

Each partner has one account covering all their vehicles. Earnings are kept per vehicle and per day, and the partner sees one balance across their vehicles.

1. Calculate each vehicle's earnings using its historical commission terms.
2. Each rental day's charge (and any applicable long-rental surcharge) for that vehicle becomes final when that business day closes, including for rentals still in progress.
3. Extra-kilometre and late-return charges become final when the vehicle is returned and the charge is recorded.
4. Items waiting for an admin decision (swap-day split, damage or accessory allocation, early-return reduction) stay out of the owner's earnings until decided.
5. Apply approved owner-responsible expenses and corrections as dated lines; never count an earning twice.
6. Final earnings minus payouts already made is the owner's **balance ready to cash out**. Only final amounts are visible to the owner; today's not-final amounts are not.
7. The owner requests a cash-out of all or part of the balance from their account (to their bank account, or collected at the branch). An authorised person pays and records the payout (a bank payout needs a reference). A partial payout leaves the rest in the balance.

SNS pays partner owners even when the customer has not paid. Customer receivables and owner payables therefore need separate records.

Expense responsibility depends on the expense and agreement. Owner-responsible expenses paid by SNS are deducted from the owner's earnings before cash-out or repaid separately. Track the remaining balance to prevent double recovery. If deductions exceed earnings, the balance stays negative until covered by later earnings, with the option of separate repayment.

Final earnings lines cannot be edited. Corrections appear as traceable adjustment lines dated when they are made. Overpayments caused by approved rental reductions are recovered from later earnings.

**Open:** The business-day close time (it decides when each day's earnings become final); whether cash payouts from the drawer are allowed and how they appear in the drawer count; minimum or maximum cash-out amounts and how often a partner may request one, if any limits are wanted; rounding; treatment of a returned segment while its overall swapped rental remains open; and final recovery if a retired vehicle or owner has no future earnings.

## 11. Asset records, maintenance, and availability

Track servicing by date and mileage, repairs, insurance expiry, vehicle-licence expiry, expenses, and upcoming reminders.

- Vehicles under repair or marked unavailable cannot be handed over until an authorised person marks them available.
- Expired insurance/licence documents warn staff; proceeding requires the authorised admin decision and reason.
- Temporary owner use can mark the vehicle unavailable with a reason and expected return date, without trip or kilometre tracking.
- Permanently returned/sold vehicles are retired while all historical rental, maintenance, and financial records remain accessible to authorised users.

Detailed non-rental movement/odometer tracking is a future extension, not a launch requirement.

## 12. Daily vehicle checks and exception monitoring

Staff perform a physical check of vehicles present at the branch. Compare observations with system records and highlight differences.

Only a person with the configured permission may resolve a discrepancy. Closure requires both an explanation and confirmation/correction of the vehicle's system status.

The primary owner receives a daily in-system summary of exceptional decisions. No automatic customer reminder messages are in scope; staff handle reminders manually.

These controls provide accountability and help detect discrepancies. They cannot guarantee that employees never commit fraud or that all physical activity is recorded.

## 13. Business expenses and payroll

Record office rent, salaries, utilities, and other general business expenses for reporting.

Payroll includes:

- Admin-defined employee pay arrangements.
- Monthly salary amounts and manually entered adjustments.
- Advances and employee loans, repayments, and outstanding balances.
- Deductions from future salaries.
- Partial salary payments and carried-forward unpaid salary.
- Payslips and employee access to their own records.

One configurable payroll-management permission covers preparation, finalisation, and payment. There is no agreed separate payroll approval role.

Attendance and automated overtime calculations are excluded. Automatic statutory deduction calculations, filings, or compliance certification have not been requested or designed.

**Open:** Deduction limits, rounding, adjustments after payroll finalisation, and whether deductions may exceed net salary. Salary expense, salary payable, employee loan receivable, and cash paid must not be counted twice in reports.

## 14. Documents, languages, and exports

Generate printable customer agreements, vehicle-partner agreements, payment receipts, final itemised bills, payslips, and partner earnings statement PDFs (final amounts only).

Agreements, receipts, and bills support Sinhala or English. Sinhala is also the default interface language, switchable to English per user.

The customer agreement will be redesigned for SNS review. Applicable customer, vehicle, dates, and agreed prices are filled automatically. Print for signature and upload the signed copy before handover.

Vehicle-partner agreements cover commission, the daily cash-out arrangement, and expense responsibilities. Their exact wording and signing/upload workflow still need confirmation.

Reference files provided:

- `reference/client-agreement/WhatsApp Image 2026-10-22 at 13.41.23.jpeg`
- `reference/client-agreement/WhatsApp Image 2026-10-22 at 13.41.24.jpeg`

The reference agreement's Sinhala wording has not been fully verified. Do not infer contractual clauses or replace the confirmed package prices with unverified text from those images. SNS must approve wording and translations before use.

Financial and vehicle-performance reports support Excel and PDF export, governed by a separate permission.

## 15. Dashboard and reporting

The primary owner has a detailed dashboard with drill-downs to supporting records and comparisons with the previous month. Other staff see only information allowed by their permissions.

A count shown in the navigation or the attention summary (for example "Overdue 1") opens the matching list already filtered to those records, with the filter shown and removable. **Confirmed** 25 Oct 2026 by Dulan.

| Area | Required information |
| --- | --- |
| Fleet today | Available, rented, overdue, under repair, temporarily unavailable |
| Collections | Cash, bank, card, refunds, expenses, expected drawer balance, reconciliation differences |
| SNS earnings | Own-vehicle income, partner commissions, cancellation fees, expenses, operating profit |
| Customer debt | Outstanding balances, age, partial payments, write-offs |
| Partner payments | Final balances ready to cash out (per owner and per vehicle), today's not-final amounts (owner view only), pending cash-out requests, payouts and partial payouts |
| Vehicle performance | Rental days, kilometres, earnings, maintenance costs, downtime |
| Exceptions | Discounts, waived deposits/charges, overrides, corrections, unmatched payments, vehicle discrepancies |
| Upcoming work | Returns, service, renewals, partner cash-out requests, payroll |

Keep collections, earnings, deposits held, and partner payables visually and mathematically separate. Likewise distinguish SNS earnings from partner earnings.

**Open:** Exact profit definition, depreciation/asset costs, recognition date of expenses and earnings, utilisation denominator, and comparable-period treatment for an unfinished month. Dashboard labels must not imply a final accounting profit before these are defined.

## 16. Optional and excluded scope

| Item | Status |
| --- | --- |
| Fuel accounting | Confirmed in scope |
| Fuel calculation | Estimated litres × price per litre; income allocated entirely to SNS |
| Same-fuel-level return versus paid fuel | Original business requirement; detailed workflow still to be designed |
| Garage-day charge | Confirmed in scope; default LKR 5,000/day per vehicle; trigger and partner split open |
| Vehicle catalogue photo (one optional photo per vehicle) | Proposed; change request CR-001, no charge, awaiting owner agreement |
| Non-rental vehicle movement tracking | Future extension |
| Advance reservations | Excluded |
| Offline operation | Excluded |
| Historical imports/opening balances | Excluded; fresh start |
| Automatic customer reminders | Excluded; staff handle manually |
| Bank/card/payment-provider integration | Excluded; manual recording |
| Separate driver records | Excluded |
| Attendance and automatic overtime | Excluded |
| Hosting, vendor, stack, budget, delivery price | Undecided |

No additional scope is authorised merely by appearing as a proposed technical option in this document.

## 17. Proposed logical structure — not yet approved

This section organises the confirmed behaviour for future engineering discussion. It does not select a technology stack or hosting vendor.

### 17.1 Modules

1. Identity, roles, permissions, approvals, audit history.
2. Customers, flags, reference people, private documents.
3. Vehicles, ownership, package versions, availability, asset records.
4. Rentals, vehicle-use segments, extensions, swaps, return decisions.
5. Charges, payments, allocations, deposits, refunds, receivables.
6. Cash movements, expenses, reconciliation.
7. Partner earnings (daily finalisation), cash-out requests, payouts, adjustments.
8. Maintenance, expiry reminders, daily vehicle checks.
9. Payroll, loans, advances, salary payments.
10. Documents, dashboards, notifications, exports.

### 17.2 Core records and relationships

| Record | Purpose / relationship |
| --- | --- |
| User, PermissionAssignment | Identifies actor and permitted actions |
| Customer, CustomerFlag, ReferencePerson | Rental eligibility evidence and history |
| Document, AgreementVersion | Private file metadata, signed copy, template/version association |
| Vehicle, PartnerOwner, VehicleTermsVersion | Asset identity, ownership, historical financial terms |
| Rental | Customer agreement and billing lifecycle |
| RentalVehicleSegment | Actual vehicle usage within a rental, readings, saved terms, swap allocations |
| Charge, Adjustment | Itemised bill and traceable changes |
| Payment, PaymentAllocation | One payment allocated across one or more bills |
| DepositMovement, Refund | Held money, application, and refund history |
| Expense, OwnerExpenseRecovery | Cost responsibility and outstanding recovery |
| EarningLine, CashoutRequest, Payout | Per-vehicle, per-day final earnings; owner's cash-out requests; payment history |
| CashMovement, Reconciliation, Discrepancy | Money movement and independent checking |
| MaintenanceRecord, VehicleCheck | Service and physical accountability |
| PayrollPeriod, PayrollEntry, EmployeeLoan, SalaryPayment | Manual payroll and balances |
| Approval, AuditEvent, Notification | Decisions, history, daily summaries |

**Proposed architecture:** A responsive web application and modular backend with a relational database, private object storage, and background tasks for PDFs/reminders. A modular monolith is a candidate, not a selected architecture. Hosting and cost decisions remain deferred.

### 17.3 Derived integrity controls

- Enforce vehicle exclusivity at the server/database level, not only in the screen.
- Use exact decimal/minor-unit monetary arithmetic; agree rounding rules before coding.
- Record payout and payment operations atomically; make retries safe against duplication.
- Reject invalid/missing odometer inputs; define a controlled correction path for errors or meter replacement.
- Retain original approved financial records and add adjustments rather than destructive edits.
- Separate rental return status from unpaid customer and owner balances.
- Isolate owner data by authorisation on every request, not merely hidden menu items.
- Private documents must not use unrestricted public URLs.
- Do not show owners any earnings before they are final (business day closed, or vehicle returned for km and late charges).

## 18. Operational and security decisions still required

| Open decision | Consequence if unresolved | Decision owner |
| --- | --- | --- |
| Backup frequency, acceptable data loss, recovery time | Cannot define recovery design or reliable operating cost | SNS owner with developer |
| Outage procedure for an online-only branch | Staff may have no agreed process during downtime | SNS owner |
| Document retention, deletion, access scope | Sensitive identity documents may be retained or exposed unnecessarily | SNS owner with appropriate advice |
| Login recovery and stronger protection for owner/admin accounts | Account loss/compromise handling is undefined | SNS owner with developer |
| Approval workflow and self-approval restrictions | Critical overrides may not provide intended independent review | SNS owner |
| Business-day close time (decides when partner earnings become final) | Owner earnings and drawer counts can differ depending on implementation assumptions | SNS owner |
| Cash partner payouts from the drawer | Expected drawer cash may be wrong | SNS owner |
| Early-return effects on included kilometres | Customer final bills may be inconsistent | SNS owner |
| Swap allowance and rate edge cases | Double charging or under-allocation is possible | SNS owner |
| Charge/discount allocation and currency rounding | Small discrepancies can accumulate between bills and partner earnings | SNS owner with developer |
| Document amendments after extensions/swaps | Signed agreement may not reflect changed terms | SNS owner |
| Final payout after vehicle retirement | Outstanding deductions may have no future earnings to recover from | SNS owner |
| Payroll corrections and excessive deductions | Salary/loan balances can become misleading | SNS owner |
| Reporting definitions | Profit and utilisation may be misunderstood | SNS owner |
| Fuel module inclusion | Final scope and charging rules remain uncertain | SNS owner |
| Budget, stack, vendors, support commitments | No binding cost or delivery promise can be made | Dulan and SNS owner |

## 19. Acceptance scenarios for implementation planning

These are requirement checks, not claims that software has been built or tested.

| ID | Scenario | Expected outcome |
| --- | --- | --- |
| AT-01 | Pickup Monday 2 PM under 3 PM/8 AM settings | One-day deadline Tuesday 8 AM |
| AT-02 | Pickup Monday exactly 3 PM | One-day deadline Wednesday 8 AM |
| AT-03 | One-day Wagon R, 150 km, no adjustments | LKR 4,500 base + LKR 1,250 excess = LKR 5,750; SNS 862.50 and owner 4,887.50 at 15% |
| AT-04 | Six-day Wagon R, at most 600 km, default package | LKR 27,000 base + LKR 500 surcharge = LKR 27,500; SNS 4,125 and owner 23,375 |
| AT-05 | Admin changes package while rental active | Old rental/extension retains old snapshot; new rental uses new version |
| AT-06 | Missing signed agreement or customer ID/licence copy | Handover blocked |
| AT-07 | Reference person required but their licence copy missing | Handover blocked |
| AT-08 | Two employees submit handovers for same vehicle | Only one succeeds; no duplicate active allocation |
| AT-09 | Customer rents two vehicles | Separate rentals, agreements, bills; one payment may be allocated across both |
| AT-10 | Employee records bank payment with reference | Recorded confirmed immediately; reconciliation status tracked separately |
| AT-11 | Bank payment cannot be matched at daily check | Flag for investigation; do not automatically restore customer debt |
| AT-12 | LKR 10,000 deposit, LKR 7,000 final bill, no other charges/payments | Apply 7,000, refund 3,000; no double-counted rental earnings |
| AT-13 | Customer has not paid when the owner asks to cash out | Owner's final earnings remain payable; customer debt stays with SNS |
| AT-14 | Rental runs over several days | Each rental day becomes final once, at that day's close; excess km final at return; nothing counted twice |
| AT-15 | Owner expense partly repaid separately | Only the unrecovered remainder is deducted from earnings |
| AT-16 | Approved correction affects earnings already final or cashed out | Original lines unchanged; a dated adjustment line reduces or increases the balance |
| AT-17 | Customer debt is written off | SNS absorbs loss; partner earnings not reduced |
| AT-18 | Pre-handover cancellation with authorised fee | Refund recorded; cancellation fee entirely SNS |
| AT-19 | Rental swap | Mandatory readings, separate km calculation, recorded admin allocations and applicable historical rates |
| AT-20 | Vehicle marked under repair | Rental handover blocked until authorised availability change |
| AT-21 | Daily vehicle discrepancy is closed | Explanation present and correct vehicle status verified |
| AT-22 | Owner accesses today's not-final earnings or another owner's earnings | Access denied |
| AT-23 | Partial salary or owner payout | Unpaid remainder retained; repeated payment does not overwrite previous payment |
| AT-24 | Staff without export/payroll permission requests those records directly | Server denies access even outside normal navigation |
| AT-25 | Retire a vehicle | No new rental eligibility; historic records and financial obligations retained |
| AT-26 | Owner with two vehicles requests a partial cash-out | One balance across both vehicles; payout recorded; the rest stays available; a repeated submission does not pay twice |
| AT-27 | Business day closes with a rental still out | That day's share becomes final and cash-out-able; extra km for the rental waits for return |
| AT-28 | Staff open "Overdue 1" from the navigation or attention summary | The rentals list opens showing only the overdue rental, with a visible filter that can be removed |
| AT-29 | Vehicle with no catalogue photo; an admin then adds one (Proposed, CR-001) | Card and profile show the model's standard image, then the photo; handover requirements are unchanged; staff without admin rights cannot add or replace it |

## 20. Readiness and next steps

**Ready:** Stakeholder review of scope, initial screen mapping, and further calculation workshops.

**Not yet ready:** An unconditional fixed-price commitment, final financial implementation, or production launch. Resolve the financial edge cases and permission decisions before building those workflows. Resolve security, recovery, agreement wording, and operational ownership before launch.

Recommended next sequence, subject to stakeholder agreement:

1. Review this document and record corrections.
2. Resolve monetary edge cases using examples.
3. Agree screen journeys and detailed permissions.
4. Select architecture, hosting, delivery phases, budget, and support terms.
5. Implement and validate against acceptance scenarios and SNS-approved documents.
