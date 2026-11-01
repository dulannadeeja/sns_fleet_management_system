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

- **The repository is the master copy** of the design system, the brand guidebook and the screens, so any agent or developer can work from git alone. claude.ai artifacts are viewers: they are refreshed from the repository after a change and never edited directly. Decided 26 Oct 2026 by Dulan (project setup, not a business rule).
- **Screen design:** `screens/` (see `screens/README.md`): 183 screen boards, desktop and phone versions, in numbered modules (`NN-Module-Screen-Desktop|Phone`), with source in `screens/canvas/` and static HTML and PNG in `screens/previews/`. They show examples and sample data, not requirements. Viewer: canvas "SNS Rent Car · Screens" (https://claude.ai/artifact/QwHjboTyDUzjNg2U4HY9td).
- **Design system:** `design-system/` (see `design-system/README.md`): tokens, components (`window.Plate`) and their previews. Viewer: "SNS Design System · Plate" (https://claude.ai/artifact/3iqJRN9jkgBAGqvGSx7RK4).
- **Brand guidebook:** `brand/guidebook/`: identity, colour, type, language, icons, vehicle imagery, layout, money on screen and printed documents.
- **Client proposal:** `proposal/SNS_Rent_a_Car_Proposal_SI.pdf` and `proposal/SNS Rent a Car Proposal.html` in this folder (artifact: https://claude.ai/artifact/DCDGDwQJRuL7K8AUNN4nQ5). Commercial terms and phases live there; requirements live here. **Approved by the client and frozen** (confirmed by Dulan, 24 Oct 2026; approval date to be recorded): changes to scope, phases, price, payments, timeline or the agreement go through a change request (`change-requests/`) and an addendum (`addenda/`), never by editing the proposal.

**Change control.** Every change follows the `sns-change-control` skill (`.claude/skills/sns-change-control/SKILL.md`): update this document first, then propagate in order (PRD → TRD → design system → screens → proposal addendum → agent files → code), run the sync audit and commit. History is kept in git, not inside this document.


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
| Rentals | Walk-in rentals, and advance reservations up to 30 days ahead (§7.6) |
| Initial data | Existing records, opening balances and past rentals and money records, loaded once before go-live (Starting data, below) |
| Price, phases, payments and support | Set by the approved proposal (`proposal/`) |
| Hosting vendor and technology stack | Next.js (TypeScript) web app that installs like an app on a phone, with a PostgreSQL database, on one 2 GB DigitalOcean server (Bangalore or Singapore, chosen by a speed test from Elpitiya) with daily backups; customer document copies and an off-site copy of each night's backup in private Cloudflare R2 storage. About LKR 5,000 a month, within the proposal's running-cost estimate; accounts in the owner's name. Confirmed: agreed by the owner, recorded by Dulan |

Any cash introduced after launch must be recorded as a cash movement, not treated as rental earnings.

**When the system is down.** If only the office internet is down, staff use mobile data on a phone. If the system cannot be reached, staff use a printed backup pack kept at the branch (blank rental agreement, handover and payment forms) and the fleet list the system prints each evening. When the system is back, each paper record is entered with its real time and marked "entered after outage"; the owner sees them in the daily summary. This is a paper fallback, not offline operation. Confirmed: agreed by the owner, recorded by Dulan.

### Starting data

**Confirmed:** agreed by the owner, recorded by Dulan (change request CR-003, addendum ADD-002). No charge; Phase 4, as part of going live.

- **What is loaded:** existing customers (with their flags), cars and their packages, partner owners; opening balances on go-live day (cash in the drawer, customer debts, partner balances owed, staff advances and loans); past rentals; and past payments, expenses and payroll from SNS's books.
- **How:** SNS hands over its books or a file. The developer loads it once, before go-live, and the owner approves it. Every loaded record is marked "Imported", with who approved it and when.
- **Opening balances** are one dated "Opening balance" line each and are final from go-live. Drawer cash is a cash movement. Customer debts can be collected or written off as any debt. Partner balances can be cashed out. Staff advances and loans are recovered as any advance or loan. None of them counts as earnings or income in any report. A mistake is fixed by a dated correction line, never an edit.
- **Past rentals and past money records** are shown on each car, customer and partner, and counted in reports and month comparisons, always marked "Imported". They are read-only and never recalculated. They never create partner earnings, cash-outs or drawer movements: the opening balances already carry what is owed.
- **Imported customers** keep the same handover requirements (§6): ID and licence copies are needed before their next handover if the books did not hold them.
- **Rentals still out on go-live day** are entered before go-live as normal rentals, with their real start date, agreed price and outgoing odometer from the paper agreement, marked "Started before go-live"; the paper agreement and ID copies are uploaded, as handover requires. From go-live they are normal rentals: return, bill, and partner earnings for days from go-live. Earnings for days before go-live are in the partner's opening balance. Confirmed: agreed by the owner, recorded by Dulan.
- **Go-live checklist.** The system goes live only when all of these are done: business details on printouts; every car entered; starting packages; insurance and licence dates for every car; every partner car linked to its owner; staff accounts; the authorised person for checking payments, write-offs, cancellation fees and expired papers; opening cash in the drawer, counted and entered before the first transaction; SNS's agreement wording; and every Open decision in this document. Confirmed: agreed by the owner, recorded by Dulan.

## 3. Actors, access, and accountability

### 3.1 Accounts

- **Primary owner:** One of the two admins. Full owner dashboard and authority to configure critical permissions for other staff.
- **Additional admin:** Access controlled by the primary owner.
- **Employee:** Operational access according to assigned permissions; access to their own payslips and advance/loan balances.
- **Partner vehicle owner:** One account for all their vehicles. Access only to their own final rental earnings (day by day, per vehicle, with downloadable PDFs), their cash-out history, and the ability to request a cash-out. Never today's not-final amounts, other owners' data, customer details, or the price a customer paid (a partner sees their earning, not the rental price; see Revenue allocation, §8.4).

Customer-facing accounts are not confirmed. Customer document delivery is through the agreed printable documents.

**Sign-in.** Everyone (owner, admins, staff, partners) signs in with their own phone number and password; a first password is changed at the first sign-in. The primary owner resets a forgotten password for staff and partners. Confirmed: agreed by the owner, recorded by Dulan.

**Sign-in safety.** Passwords have at least 8 characters; 5 wrong tries lock the account for 15 minutes. The primary owner and the admin each give an email address: signing in on a new device asks for a one-time code sent to it, and they can reset their own forgotten password by email. No SMS is used. Confirmed: agreed by the owner, recorded by Dulan; email is the cost the approved proposal already lists (password reset, LKR 0).

**Sign-in phone numbers.** A sign-in phone number is a Sri Lankan mobile number: 10 digits, starting 070, 071, 072, 074, 075, 076, 077 or 078. It is typed and saved as digits only, with no spaces or +94. The sign-in form says exactly what is wrong with what was typed (a box left empty, a number not in this form, a password shorter than 8 characters). When the number and password are well formed but do not match an account, it gives one message that does not say which was wrong. The one exception is the lock message after 5 wrong tries (AT-60), which only an account can reach; that trade-off is known. Proposed: Dulan, 1 Nov 2026; for the owner to confirm.

**Turning off an account.** When a staff member or admin leaves, or a partner stops, the primary owner turns off their account, with a reason. Their sign-in stops at once. Nothing they recorded changes, and their name stays on it. A partner's cars, final earnings and balance stay; an authorised person can still pay out what is owed. The owner can turn the account back on. Confirmed: agreed by the owner, recorded by Dulan.

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
| Share an above-package price on a partner car | Admin decides the split for each rental, with a reason |
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
| See partner earnings and terms | Admin; not staff |
| See the activity log | Admin; not staff |
| Add or edit cars and packages | Admin; not staff |
| Add or edit partners | Admin; not staff |
| Mark a car under repair or unavailable | Employees or admins |
| Mark a car available again | Admin (the authorised person for availability) |
| Add people, change permissions, turn accounts off or on | Primary owner only; cannot be given to anyone |

Every exceptional decision requires a reason, actor, date, and time. Each transaction must identify the staff member who recorded it, even though staff share one cash drawer.

The table above is the permission catalogue. Confirmed: agreed by the owner, recorded by Dulan.

**Delegation.** The primary owner can give any permission to the admin or any employee, except adding people, changing permissions and turning accounts off or on, which stay with the primary owner. Every grant and removal is recorded. Confirmed: agreed by the owner, recorded by Dulan.

**No self-approval.** Nobody approves their own request (a price change, discount, payment correction or any other approval); another approver must. The primary owner may approve their own, since nobody is above them; it is marked "self-approved" and shown in the daily summary of exceptional decisions. Confirmed: agreed by the owner, recorded by Dulan.

## 4. Vehicles, packages, and historical terms

### 4.1 Initial defaults

| Vehicle type | Daily rental (LKR) | Included km/day | Extra km (LKR/km) |
| --- | ---: | ---: | ---: |
| Wagon R, Spacia | 4,500 | 100 | 25 |
| Every (van) | 5,000 | 100 | 25 |
| Alto | 4,000 | 100 | 17 |
| Prius, Axio | 6,500 | 100 | 27 |

Admins can define each vehicle's package according to its condition and update packages later. These are starting packages: a new vehicle starts with its type's package. Changing a starting package changes only vehicles added afterwards; existing vehicles keep their own package until an admin changes it on that vehicle. Confirmed: agreed by the owner, recorded by Dulan. The extra-km rates above are design rates; final rates will be set per vehicle.

### 4.2 Per-vehicle settings

- Ownership: SNS or partner.
- Daily rate, included daily kilometres, and extra-kilometre rate.
- SNS commission percentage, default 15%.
- Long-rental surcharge amount, default LKR 500 per applicable day.
- Surcharge starting day, default day six.
- Garage-day charge, default LKR 5,000 per day. It applies only when the vehicle goes to the garage because of damage during that rental. Staff propose the days at return; an admin approves the days and the amount, and corrects the days when the vehicle is back from the garage. On a partner vehicle the admin decides the split, as for damage recovery. Confirmed: agreed by the owner, recorded by Dulan.
- Agreed payment terms and expense responsibilities.
- Catalogue photo: optional, one per vehicle, added or replaced by an admin. It is shown on the vehicle's card and profile; until one is added, the system shows the model's standard image. It is not a condition photo, not a handover requirement and not a customer document. Confirmed: agreed by the owner, recorded by Dulan (change request CR-001, addendum ADD-003; no charge, no extra time).

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

Business times are read in Asia/Colombo (Confirmed: agreed by the owner, recorded by Dulan). **Derived control:** store timestamps consistently and test the cutoff, deadline and day close with worked examples (AT-01, AT-02, AT-71).

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

Staff record customer identity and driving-licence details and retain document copies. A reference person is required only sometimes; staff decide. Staff with customer access see full NIC and phone numbers; there is no masking. A customer is saved with name, NIC, phone, and driving-licence number and expiry; the ID and licence copies may be added later. Until they are in, the customer shows "copies missing" and handover stays blocked (below). Confirmed: agreed by the owner, recorded by Dulan. One NIC belongs to one customer record: when staff enter a NIC already recorded, the system opens that customer instead of adding a second one, so debts, flags and rentals stay together. Confirmed: agreed by the owner, recorded by Dulan.

### Handover requirements

Handover is blocked until the following are present:

1. Customer ID copy.
2. Customer driving-licence copy.
3. Signed rental agreement uploaded as a photo or scan.
4. Outgoing odometer reading.
5. Reference person's ID and driving-licence copies, when a reference person is required.

Vehicle-condition photos are optional. Incoming odometer readings are mandatory at return.

An accessories checklist and the fuel level are recorded at handover and return. Handover cannot finish until both are recorded, but a missing accessory or low fuel never blocks it: what is missing is written on the record, so the customer is not charged for it at return. Confirmed: agreed by the owner, recorded by Dulan. An accessory-shortage charge on a partner vehicle is allocated as damage recovery is: an admin decides the split for each case, with a reason, and it stays out of the owner's earnings until decided (§8.4, §10). Confirmed: agreed by the owner, recorded by Dulan.

An expired customer driving licence triggers a warning. An authorised person may override it with a reason. An override does not make the licence legally valid.

Staff may flag a customer for unpaid balances, damage, or other issues. Warnings appear before future rentals; employees may proceed with a recorded reason. Employees or admins close a flag with a reason (for example, the money was paid); it stops warning but stays in the customer's history with who closed it and when. Nothing is deleted. Confirmed: agreed by the owner, recorded by Dulan. An unpaid customer debt warns on its own, as a flag does, before every new rental until it is paid or written off; employees may proceed with a recorded reason. Confirmed: agreed by the owner, recorded by Dulan.

**Document copies.** Customer and reference-person ID and licence copies are kept while the customer is active and for 7 years after their last rental or settled debt. The system then lists them for the primary owner, who deletes them; a signed agreement stays with its rental. Staff and admins with customer access can open copies; every opening is logged with who and when. Copies are never shared outside the system. Confirmed: agreed by the owner, recorded by Dulan; SNS should check the period against Sri Lankan law (Personal Data Protection Act) before go-live.

A customer may rent multiple vehicles simultaneously. Each has its own agreement and bill. Separate actual-driver records per vehicle are outside the agreed scope.

## 7. Rental lifecycle and exceptions

### 7.1 Normal journey

1. Customer arrives, or comes to collect a reservation (§7.6); staff locate or create the customer record and review warnings.
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

- Early-return reductions require an admin decision. Included kilometres follow the days actually charged: with no reduction the customer keeps the agreed days' allowance; if the admin reduces the charged days, the allowance falls with them. The admin sees the effect on extra kilometres before approving. Confirmed: agreed by the owner, recorded by Dulan.
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

**Swap days.** Days before the swap day belong to the old vehicle and days after it to the replacement, each with its own saved rate, allowance and earnings. For the swap day the admin picks which vehicle's rate and allowance apply, then divides that allowance between the two vehicles. Amounts are in whole rupees (§17.3). Confirmed: agreed by the owner, recorded by Dulan.

**No new signature.** A phone extension or a swap needs no amended agreement or new signature. The change (new deadline, or replacement vehicle with its readings and terms) is recorded with who and when, and shown on the final bill. Confirmed: agreed by the owner, recorded by Dulan.

### 7.6 Advance reservations

**Confirmed:** agreed by the owner, recorded by Dulan (change request CR-002, addendum ADD-001). No charge; Phase 2, with rentals.

- **What a reservation holds:** one specific car for the booked days. No other rental or reservation can hold that car on overlapping days.
- **How far ahead:** up to 30 days ahead.
- **Who:** staff or admins make, change and cancel reservations, by phone or at the counter (configurable, as other permissions). Customers do not book themselves.
- **Price:** the reservation keeps the car's package from the day it was made, as a rental keeps its terms (§4.3).
- **Advance payment:** optional; staff decide. It is recorded as any payment (who, method, reference) and applied to the bill.
- **Cancellation and no-show:** the cancellation rule (§7.3) applies. A reason is recorded; an authorised person may keep a cancellation fee, which belongs entirely to SNS; the rest of any advance is refunded and recorded. Staff mark a no-show by hand, and the car is then free.
- **Clashes:** a phone extension (§7.2) that would overlap a reservation on the same car is blocked, with the reason shown, until staff move the reservation to another free car or change its dates. A booked car that is late or under repair flags the reservation for attention. Moving a reservation to a car with a different price needs admin approval, as a price change does (§3.2).
- **Pickup:** the reservation becomes a normal rental. Customer warnings, the printed and signed agreement and the handover requirements (§6) all apply; nothing is skipped because the car was reserved.

## 8. Payments, deposits, and customer balances

### 8.1 Collection

- Cash, bank transfer, card, and mixed payments are supported.
- All payments are manually recorded; no payment-provider integration.
- Bank/card entries count as confirmed immediately when entered.
- Bank transfers require a transaction reference; card payments require a receipt number.
- One payment can be allocated across multiple bills belonging to the customer.
- Payment timing is customer-dependent. Employees can allow an unpaid balance after return.

### 8.2 Deposits

Employees can set or waive a security deposit based on vehicle and customer. Deposits can pay the final bill or damage charges; after that, with the customer's agreement noted, staff may apply what is left to the same customer's older unpaid bills; refund the remaining amount. Record every application and refund. Confirmed (older bills): agreed by the owner, recorded by Dulan.

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
| Accessory-shortage charge | Admin decides allocation, as damage recovery. Confirmed: agreed by the owner, recorded by Dulan |
| Garage-day charge | Admin decides allocation, as damage recovery. Confirmed: agreed by the owner, recorded by Dulan |
| Price above the car's package, on a partner car | The package amount follows the vehicle commission split. The extra above it is split between SNS and the partner as an admin sets for that rental, with a reason; it may be 100% SNS. Confirmed: agreed by the owner, recorded by Dulan |
| Cancellation fee | 100% SNS |
| Fuel | 100% SNS |
| Customer debt write-off | SNS bears loss |

## 9. Cash drawer and daily reconciliation

One shared drawer receives collections and funds expenses and refunds. Every movement is recorded with the responsible user.

Authorised staff reconcile cash, bank transfers, and cards daily:

- Preserve expected and counted cash amounts. Staff see the expected amount first, then enter what they count (Confirmed: agreed by the owner, recorded by Dulan).
- Record, explain, and resolve shortages or surpluses.
- Match bank/card records to statements or card-machine totals.
- Unmatched payments remain flagged for investigation rather than automatically becoming customer debt again.
- Any required payment correction follows the approval process.

**Closing the business day.** Employees or admins close the day with "Close the day" after the evening drawer count; that day's rent shares become final then. If nobody closes it, the day closes on its own at 11:59 PM, Asia/Colombo time, so partners are never held back; a count entered the next morning is marked late. Confirmed: agreed by the owner, recorded by Dulan.

**Reconciliation model:** Recorded payment status is kept separate from reconciliation status (waiting, matched, flagged). A payment stays recorded as paid while its reconciliation is waiting, unmatched or under investigation. Confirmed: agreed by the owner, recorded by Dulan.

**Cash paid out of the drawer.** A partner cash-out, a salary or an owner withdrawal paid in cash is recorded as its own kind of cash-out line, with who paid it and why, and lowers the expected cash. None is an expense line: the salary expense comes from payroll, the partner payout from the partner's balance, and an owner withdrawal is never an expense, so nothing is counted twice. Confirmed: agreed by the owner, recorded by Dulan.

**Fees, delays and differences.** Card-machine fees are entered once a month from the bank statement as an SNS expense, never taken from a customer's bill or a partner's share. A bank or card payment not yet on the statement shows "waiting" for up to 3 days, then is flagged for investigation. For a cash difference the person counting writes what happened; the authorised person resolves it with a note and any receipt or photo; a difference stays shown against its day until resolved. Confirmed: agreed by the owner, recorded by Dulan. A reconciliation adjustment must not silently rewrite the original transaction.

## 10. Vehicle-owner earnings and daily cash-out

Partners can cash out daily. There are no settlement periods.

Each partner has one account covering all their vehicles. Earnings are kept per vehicle and per day, and the partner sees one balance across their vehicles.

1. Calculate each vehicle's earnings using its historical commission terms.
2. Each rental day's charge (and any applicable long-rental surcharge) for that vehicle becomes final when that business day closes, including for rentals still in progress.
3. Extra-kilometre and late-return charges become final when the vehicle is returned and the charge is recorded.
4. Items waiting for an admin decision (swap-day split, damage or accessory allocation, early-return reduction, the share of a price above the package) stay out of the owner's earnings until decided.
5. Apply approved owner-responsible expenses and corrections as dated lines; never count an earning twice.
6. Final earnings minus payouts already made is the owner's **balance ready to cash out**. Only final amounts are visible to the owner; today's not-final amounts are not.
7. The owner requests a cash-out of all or part of the balance from their account (to their bank account, or collected at the branch). An authorised person pays and records the payout (a bank payout needs a reference). A partial payout leaves the rest in the balance.

SNS pays partner owners even when the customer has not paid. Customer receivables and owner payables therefore need separate records.

Expense responsibility depends on the expense and agreement. Owner-responsible expenses paid by SNS are deducted from the owner's earnings before cash-out or repaid separately. Track the remaining balance to prevent double recovery. If deductions exceed earnings, the balance stays negative until covered by later earnings, with the option of separate repayment.

Final earnings lines cannot be edited. Corrections appear as traceable adjustment lines dated when they are made; a negative line splits as the mirror of a positive one ([Derived integrity controls](#173-derived-integrity-controls), AT-84). Overpayments caused by approved rental reductions are recovered from later earnings.

The business day closes when staff close it, or at 11:59 PM if nobody does (§9). Paying a partner in cash at the branch is allowed and shows as its own line in the drawer (§9). Confirmed: agreed by the owner, recorded by Dulan.

**Limits and edge cases.** There is no minimum, maximum or frequency limit: a partner may ask for any final amount at any time. A vehicle swapped out of a rental that is still open is treated as returned: its final rent and its extra kilometres (final when it came back) are payable at once. When a retired vehicle or a departing partner leaves a negative balance, SNS asks the partner to repay it in cash, recorded as a repayment; if it is not repaid, the authorised person writes it off with a reason, as SNS's loss. Confirmed: agreed by the owner, recorded by Dulan.

## 11. Asset records, maintenance, and availability

Track servicing by date and mileage, repairs, insurance expiry, vehicle-licence expiry, expenses, and upcoming reminders.

- Vehicles under repair or marked unavailable cannot be handed over until an authorised person marks them available.
- Any garage visit, planned service included, uses the "Under repair" status (Confirmed: agreed by the owner, recorded by Dulan).
- Reminders appear ahead of time by owner settings, starting at: insurance and revenue licence 30 days before expiry; service 7 days before its date or 500 km before its km, whichever comes first; payroll 3 days before payday (Confirmed: agreed by the owner, recorded by Dulan).
- Expired insurance/licence documents warn staff; proceeding requires the authorised admin decision and reason.
- Temporary owner use can mark the vehicle unavailable with a reason and expected return date, without trip or kilometre tracking.
- Permanently returned/sold vehicles are retired while all historical rental, maintenance, and financial records remain accessible to authorised users. An admin or the primary owner retires a vehicle, with a reason and date, only when it is not rented or reserved. A partner's balance from it stays payable (Confirmed: agreed by the owner, recorded by Dulan).

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

**Deductions and corrections.** Deductions (advance and loan repayments) never take a month's salary below zero; what does not fit carries to the next month. There is no other fixed limit: the payroll-management permission sets each month's deduction. Amounts are whole rupees. A finalised payslip is never edited: a mistake is fixed by an adjustment line on the next payroll, or a separate payment, with a reason, and both stay visible. Confirmed: agreed by the owner, recorded by Dulan. Salary expense, salary payable, employee loan receivable, and cash paid must not be counted twice in reports.

## 14. Documents, languages, and exports

Generate printable customer agreements, vehicle-partner agreements, payment receipts, final itemised bills, payslips, and partner earnings statement PDFs (final amounts only).

Agreements, receipts, and bills support Sinhala or English. Sinhala is also the default interface language, switchable to English per user.

The customer agreement will be redesigned for SNS review. Applicable customer, vehicle, dates, and agreed prices are filled automatically. Print for signature and upload the signed copy before handover.

Vehicle-partner agreements cover commission, the daily cash-out arrangement, and expense responsibilities. The system prints the agreement, filled with the partner's vehicles and terms, in Sinhala or English; it is signed and kept on paper, and staff record "signed on <date>". There is no upload and nothing is blocked by it; when terms change, a new version is printed. Confirmed: agreed by the owner, recorded by Dulan.

**Agreement wording.** SNS supplies the wording of the customer and partner agreements; Dulan enters it in Sinhala and English; the owner approves each version before it is used. It is on the go-live checklist (Starting data). Confirmed: agreed by the owner, recorded by Dulan.

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

**Definitions.** Confirmed: agreed by the owner, recorded by Dulan.

- **SNS earnings:** rent and charges from SNS-owned vehicles, plus SNS's commission and shares on partner vehicles (its share of extras above the package, fuel, cancellation fees, and its share of damage, accessory and garage-day charges). Deposits held, imported records and opening balances are never earnings.
- **Profit (before depreciation):** SNS earnings minus business expenses (salaries, office rent, utilities, card-machine fees, SNS-paid vehicle costs and other expenses). No depreciation at launch; the label always says "before depreciation".
- **When counted:** earnings on the day they become final (rent at the day's close, extra kilometres and late charges at return); expenses on the day they are recorded.
- **Car use:** rented days divided by days the vehicle was in the fleet in the period (retired days excluded).
- **Unfinished month:** compared with the same days of the previous month (for example, 1 to 26 October with 1 to 26 September).

## 16. Optional and excluded scope

| Item | Status |
| --- | --- |
| Fuel accounting | Confirmed in scope |
| Fuel calculation | Estimated litres × price per litre; income allocated entirely to SNS. The price per litre is an owner setting; no figure is agreed |
| Fuel at return | By default fuel is not counted: SNS takes fuel out of returned vehicles before the next customer, and the bill has no fuel line. For one rental, staff may choose "same level": if the vehicle comes back lower than at handover, staff estimate the missing litres and charge them at the owner's price per litre (100% SNS), or waive it with a reason; a higher level is not refunded. Confirmed: agreed by the owner, recorded by Dulan |
| Fuel taken out | Staff may record the litres taken out of a returned vehicle, marked "estimate" (read from the fuel gauge), with who and when. Litres only: no money value, never income or earnings, never in the drawer. Confirmed: agreed by the owner, recorded by Dulan |
| Garage-day charge | Confirmed in scope; default LKR 5,000/day per vehicle; trigger and partner split open |
| Vehicle catalogue photo (one optional photo per vehicle) | Confirmed; change request CR-001, addendum ADD-003, no charge |
| Non-rental vehicle movement tracking | Future extension |
| Advance reservations | Confirmed; CR-002, agreed by the owner, no charge, Phase 2 (§7.6) |
| Offline operation | Excluded |
| Historical imports and opening balances | Confirmed; CR-003, agreed by the owner, no charge, Phase 4 (§2, Starting data) |
| Automatic customer reminders | Excluded; staff handle manually |
| Bank/card/payment-provider integration | Excluded; manual recording |
| Separate driver records | Excluded |
| Attendance and automatic overtime | Excluded |
| GPS tracking | Excluded (approved proposal; recorded by Dulan 26 Oct 2026) |
| App-store app | Excluded; the website works like an app on a phone (approved proposal; recorded by Dulan 26 Oct 2026) |
| Price, phases, payments and support | Set by the approved proposal |
| Hosting vendor and technology stack | Next.js (TypeScript) web app that installs like an app on a phone, with a PostgreSQL database, on one 2 GB DigitalOcean server (Bangalore or Singapore, chosen by a speed test from Elpitiya) with daily backups; customer document copies and an off-site copy of each night's backup in private Cloudflare R2 storage. About LKR 5,000 a month, within the proposal's running-cost estimate; accounts in the owner's name. Confirmed: agreed by the owner, recorded by Dulan |

No additional scope is authorised merely by appearing as a proposed technical option in this document.

## 17. Proposed logical structure — not yet approved

This section organises the confirmed behaviour for engineering. The stack and hosting are set in §2 (Confirmed); the technical design is in the TRD.

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
| Reservation | A specific car held for future days, its saved package and any advance; becomes a Rental at pickup |
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

**Proposed architecture:** One Next.js application organised as modules (a modular monolith), with PostgreSQL, private object storage (Cloudflare R2) and background tasks for PDFs, reminders, the 11:59 PM day close and nightly backups. The stack and hosting are Confirmed (§2); the module layout, data model and enforcement of these controls are in `TRD.md`.

### 17.3 Derived integrity controls

- Enforce vehicle exclusivity at the server/database level, not only in the screen.
- Use exact decimal/minor-unit monetary arithmetic. Every amount is kept and shown in whole rupees: bills, payments, refunds and deposits are whole; a partner's share of each earnings line is rounded down to the rupee and SNS takes the difference, so the shares always add up to the charge. Confirmed: agreed by the owner, recorded by Dulan. A negative line (a correction or adjustment that reduces earnings) splits as the exact mirror of the matching positive line: the partner's share is rounded toward zero and SNS takes the difference, so a full correction undoes the original to the rupee (for example −5,750 at 85%: partner −4,887, SNS −863). Confirmed 31 Oct 2026: agreed by the owner, recorded by Dulan.
- Record payout and payment operations atomically; make retries safe against duplication.
- Reject invalid/missing odometer inputs; define a controlled correction path for errors or meter replacement.
- Retain original approved financial records and add adjustments rather than destructive edits.
- Separate rental return status from unpaid customer and owner balances.
- Isolate owner data by authorisation on every request, not merely hidden menu items.
- Private documents must not use unrestricted public URLs.
- Do not show owners any earnings before they are final (business day closed, or vehicle returned for km and late charges).

## 18. Operational and security decisions still required

**Backups and recovery.** Backups run automatically every day (Confirmed by the client-approved proposal, Phase 4). At most one day of records may be lost; staff re-enter that day from the paper backup pack and receipts. The system is back within 4 working hours. Backups are kept for 30 days and a restore is tested once a month. Confirmed: agreed by the owner, recorded by Dulan.

| Open decision | Consequence if unresolved | Decision owner |
| --- | --- | --- |
| None at present | — | — |

## 19. Acceptance scenarios for implementation planning

These are requirement checks, not claims that software has been built or tested.

| ID | Scenario | Expected outcome |
| --- | --- | --- |
| AT-01 | Pickup Monday 2 PM under 3 PM/8 AM settings | One-day deadline Tuesday 8 AM |
| AT-02 | Pickup Monday exactly 3 PM | One-day deadline Wednesday 8 AM |
| AT-03 | One-day Wagon R, 150 km, no adjustments | LKR 4,500 base + LKR 1,250 excess = LKR 5,750; owner 4,887 (85% = 4,887.50, rounded down) and SNS 863 at 15% |
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
| AT-29 | Vehicle with no catalogue photo; an admin then adds one (CR-001) | Card and profile show the model's standard image, then the photo; handover requirements are unchanged; staff without admin rights cannot add or replace it |
| AT-30 | A car is reserved for Fri to Sun; staff try to rent or reserve the same car for Sat | Refused: the car is held on overlapping days |
| AT-31 | The car's package changes after the reservation is made | Pickup uses the package saved on the reservation |
| AT-32 | A phone extension would run into another customer's reservation on the same car | Extension blocked with the reason, until the reservation is moved to another free car or its dates change |
| AT-33 | Reserved customer does not come; an advance was paid | Staff mark a no-show; any fee kept is entirely SNS's; the rest of the advance is refunded and recorded; the car is free |
| AT-34 | Staff try to reserve a car more than 30 days ahead | Refused |
| AT-35 | Pickup of a reserved car without a signed agreement or ID copy | Handover blocked, as for any rental (AT-06) |
| AT-36 | A partner's opening balance is loaded; past rentals of their cars are imported | The opening balance can be cashed out from go-live; the imported rentals add no earnings; nothing is paid twice |
| AT-37 | An imported past rental is opened, or a report covers its month | Shown marked "Imported", read-only, never recalculated; counted in reports, never in earnings, cash-outs or the drawer |
| AT-38 | An imported opening customer debt is written off | SNS bears the loss; partner earnings unchanged (as AT-17) |
| AT-39 | A partner car is rented above its package price; the admin keeps the whole extra for SNS | The partner's earning is worked out on the package price only; the partner sees no customer price and no extra |
| AT-40 | Same, but the admin sets a 50/50 split of the extra, with a reason | The partner's day earning is their package share plus half the extra, shown as one amount; SNS keeps its commission plus the other half |
| AT-41 | The business day closes before the admin decides the split | The package share becomes final; the extra waits, out of the partner's earnings, until decided |
| AT-42 | A car is out on a paper rental on go-live day | Entered before go-live as a live rental marked "Started before go-live"; its return and bill work as any rental; partner earnings count only days from go-live |
| AT-43 | One car still has no insurance date on go-live day | Go-live is blocked until it is entered |
| AT-44 | A partner without a bank account asks to cash out | An authorised person pays cash at the branch and records it; the payout is recorded once, as for a bank payout |
| AT-45 | A car's insurance expires in 30 days, with the starting reminder settings | It appears in Upcoming work; the owner can change how early |
| AT-46 | A staff member forgets their password | The primary owner resets it; the staff member changes it at the next sign-in |
| AT-47 | The owner turns off the account of a staff member who left | They can no longer sign in; everything they recorded keeps their name and is unchanged |
| AT-48 | Staff close a customer's flag with a reason | No warning at the next rental; the flag, its reason, who closed it and when stay in the customer's history |
| AT-49 | Staff save a new customer without the licence copy | The customer is saved and shows "copies missing"; their handover is blocked until the copy is added (as AT-06) |
| AT-50 | An admin changes the Alto starting package from 4,000 to 4,200 a day | Alto cars already in the system stay at 4,000; an Alto added afterwards starts at 4,200 |
| AT-51 | Staff add a new customer with a NIC already recorded | No second record; the existing customer opens, with their debts and flags |
| AT-52 | Staff try to retire a car; then an admin retires a car that is reserved next week | Staff cannot; the admin is refused until the reservation is moved or cancelled |
| AT-53 | A car goes out with its spare-wheel tool missing and a quarter tank | Handover finishes once the fuel level and checklist are recorded; at return the missing tool is not charged to this customer |
| AT-54 | A partner car comes back without its air pump; LKR 2,000 is charged | The 2,000 waits for an admin decision, out of the partner's earnings; once the admin sets the split with a reason, the partner's share becomes final |
| AT-55 | A customer with an unpaid bill and no flag starts a new rental | A debt warning shows; staff continue only with a reason, which is recorded and appears in the owner's daily summary |
| AT-56 | LKR 10,000 deposit, LKR 7,000 final bill, LKR 2,000 older bill; the customer agrees | 7,000 pays this bill, 2,000 pays the older bill, 1,000 is refunded; nothing is applied beyond what is held |
| AT-57 | Kamal (admin) requests a discount, then opens it to approve | He cannot approve it; another approver must. The owner approving their own request succeeds, marked "self-approved" in the daily summary |
| AT-58 | The owner tries to give an admin the permission to change permissions | Refused: it stays with the primary owner |
| AT-59 | Staff open a customer's NIC copy | It opens for staff with customer access; the opening is logged with who and when; there is no public link |
| AT-60 | Someone types a wrong password 5 times | The account locks for 15 minutes |
| AT-61 | The admin signs in on a new phone | A one-time code is emailed to the admin; sign-in finishes only with it |
| AT-62 | A partner car comes back damaged and spends 3 days at the garage | Staff propose 3 garage days; once an admin approves, 3 × the car's garage-day rate is on the bill and the split waits for the admin, out of the partner's earnings |
| AT-63 | A car goes to the garage for a planned service after a rental | No garage-day charge can be added to that customer's bill |
| AT-64 | A rental with fuel not counted comes back with less fuel | No fuel line on the bill |
| AT-65 | A "same level" rental comes back 8 litres lower | 8 × the owner's price per litre is on the bill, 100% SNS, unless staff waive it with a reason |
| AT-66 | Staff record 10 litres taken out of a returned car | Shown as "10 L · estimate" with who and when; no money value, not in the drawer or earnings |
| AT-67 | A Wagon R (100 km/day) is swapped for a Prius (120 km/day) on day 3 of 5; the admin gives day 3 to the Prius and divides 60/60 km | Days 1–2: Wagon R rate and 200 km; days 4–5: Prius rate and 240 km; day 3: Prius rate, 60 km to each car; each car's extra km at its own rate |
| AT-68 | A rental is extended by phone, then its car is swapped | No new signature is asked for; the final bill shows the new deadline and both cars with their readings |
| AT-69 | A 5-day Wagon R rental returns after 3 days with 380 km | No reduction: 5 days, 500 km included, no extra km. Admin reduces to 3 days: 300 km included, 80 extra km charged at the car's rate |
| AT-70 | A discount makes a partner's day share 3,824.25 | The partner's line is 3,824; SNS's share takes the 0.25 difference; the bill and shares add up exactly |
| AT-71 | Nobody presses "Close the day" on Tuesday | Tuesday closes on its own at 11:59 PM Asia/Colombo; Tuesday's rent shares become final; a drawer count entered on Wednesday morning is marked late |
| AT-72 | Kamal pays Sunil's LKR 10,000 cash-out and LKR 5,000 of Nimal's salary from the drawer | Expected cash falls by 15,000, shown as a partner payout and a salary line; neither is an expense line; reports count each once |
| AT-73 | A bank payment recorded Monday is not on the statement by Thursday | It showed "waiting" Monday to Wednesday and is flagged on Thursday; the customer's debt is not restored |
| AT-74 | The evening count is LKR 500 short | The counter's note is kept; the shortage shows on that day until the authorised person resolves it with a note |
| AT-75 | A partner's car is swapped out on day 2 of an open 5-day rental | Its final rent and extra km are payable at once; the rental stays open on the replacement |
| AT-76 | A partner leaves with a balance of −3,000 and does not repay | The authorised person writes off 3,000 with a reason; SNS bears it; the balance is 0 |
| AT-77 | Nimal earns 40,000 and owes 50,000 on a loan; the payroll person sets a 50,000 deduction | Only 40,000 is deducted; net pay is 0; 10,000 of the loan carries to next month |
| AT-78 | A finalised payslip had the wrong allowance | The payslip is unchanged; next month's payroll has an adjustment line with the reason |
| AT-79 | On 26 October the owner opens this month's report | October 1–26 is compared with September 1–26; profit is labelled "before depreciation"; deposits held are not in earnings |
| AT-80 | A car was in the fleet all 31 days of a month and rented 22 | Car use shows 71% (22 ÷ 31) |
| AT-81 | A rental was handed over on paper at 10:00 during an outage and entered at 14:00 | It shows pickup 10:00, marked "entered after outage" with who entered it at 14:00, and appears in the owner's daily summary |
| AT-82 | The monthly restore test is run | Last night's backup restores to a test copy and the day's records are present |
| AT-83 | A partner is added and the agreement printed but not yet marked signed | Cash-outs are not held back; the partner page shows "agreement not yet signed" until staff record the date |
| AT-84 | An approved correction takes back a whole 5,750 line on a partner car at 85% | Adjustment line −5,750: partner −4,887, SNS −863; with the original line the partner and SNS each net to 0 |

## 20. Readiness and next steps

**Ready:** Stakeholder review of scope, initial screen mapping, and further calculation workshops.

**Not yet ready:** An unconditional fixed-price commitment, final financial implementation, or production launch. Resolve the financial edge cases and permission decisions before building those workflows. Resolve security, recovery, agreement wording, and operational ownership before launch.

Recommended next sequence, subject to stakeholder agreement:

1. Review this document and record corrections.
2. Resolve monetary edge cases using examples.
3. Agree screen journeys and detailed permissions.
4. Select architecture and hosting. Delivery phases, price, payments and support are set by the approved proposal.
5. Implement and validate against acceptance scenarios and SNS-approved documents.
