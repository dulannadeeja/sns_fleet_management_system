# CR-003 · Starting data: existing records, opening balances and past records

| | |
| --- | --- |
| Raised | 26 October 2026, by Dulan Nadeeja (developer) |
| Status | **Agreed by the owner** (S D De Silva), recorded by Dulan. Addendum: `addenda/ADD-002-starting-data.md` |
| Proposal affected | Proposal v1 (approved, frozen), not edited. Its not-included list names "පරණ පොත් වල තියෙන ගණන් ඇතුළත් කිරීම · බිංදුවෙන් පටන්" (entering figures from the old books; start from zero) and says such items can be added later after discussion |
| Price effect | **None.** No charge |
| Phase and timeline effect | **None.** Phase 4 (Live), as part of going live |
| System design | Goals and operating context, Starting data; §16; AT-36 to AT-38 |

## What

Before go-live, the developer loads SNS's existing data once, from the books or a file SNS hands over, and the owner approves it:

- **Records:** customers (with their flags), cars and packages, partner owners.
- **Opening balances on go-live day:** cash in the drawer, customer debts, partner balances owed, staff advances and loans. Each is a final dated line; none counts as earnings or income. Partner balances can be cashed out; customer debts collected or written off; advances and loans recovered.
- **Past rentals and past money records** (payments, expenses, payroll): shown on each record and counted in reports and month comparisons, always marked "Imported", read-only, never recalculated, and never creating partner earnings, cash-outs or drawer movements.

## Why

SNS is running today. Starting from zero would leave out what customers and SNS already owe, what partners are owed, and every past month the owner wants to compare with.

## Not changed

- Handover requirements: an imported customer still needs ID and licence copies before their next handover
- Money rules: final amounts are corrected only by dated lines; deposits are held money; nothing is called profit
- Prices, phases, payments and the agreement terms of the proposal

## Owner's decision

- [x] Agreed, no charge. Recorded in the system design as Confirmed; addendum ADD-002 issued.
