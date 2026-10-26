# CR-002 · Advance reservations

| | |
| --- | --- |
| Raised | 26 October 2026, by Dulan Nadeeja (developer) |
| Status | **Agreed by the owner** (S D De Silva), recorded by Dulan. Addendum: `addenda/ADD-001-advance-reservations.md` |
| Proposal affected | Proposal v1 (approved, frozen), not edited. Its not-included list names "කලින් book කිරීම්" (advance booking) and says such items can be added later after discussion |
| Price effect | **None.** No charge |
| Phase and timeline effect | **None.** Phase 2 (Rentals), inside the current plan |
| System design | Goals and operating context; §7.6 Advance reservations; §16; AT-30 to AT-35 |

## What

Staff can reserve a specific car for a customer up to 30 days ahead, by phone or at the counter.

- The reservation holds that one car; no other rental or reservation can take it on overlapping days.
- It keeps the car's package from the day it was made.
- Staff may take an optional advance payment, recorded as any payment and applied to the bill.
- Cancellation and no-show follow the existing cancellation rule: a reason, an optional fee kept by SNS, the rest refunded and recorded. Staff mark a no-show by hand.
- A phone extension that would run into a reservation is blocked until staff move the reservation or change its dates. Moving it to a car with a different price needs admin approval.
- At pickup it becomes a normal rental, with every check and handover requirement.

## Why

Customers ask to keep a car for a coming trip. Today SNS can only rent to customers at the counter, so a car promised by phone can be rented to someone else.

## Not changed

- Handover requirements, the agreement, prices and commission rules
- Customers still have no accounts; staff make every reservation
- Prices, phases, payments and the agreement terms of the proposal

## Owner's decision

- [x] Agreed, no charge. Recorded in the system design as Confirmed; addendum ADD-001 issued.
