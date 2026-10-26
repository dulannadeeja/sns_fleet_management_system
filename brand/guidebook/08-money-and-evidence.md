# 08 · Money and evidence on screen

## Rules that protect the money

- **Separate blocks.** Money received, the drawer, reconciliation, deposits held, customer debt, partner payable (finalised), partner share (provisional) and SNS earnings are separate `MoneyBlock`s. They are never added together.
- **During the day, blocks say "මේ වෙනකම් · so far".**
- **Two pills for a staff payment.** It shows "Recorded · [name]" and a separate reconciliation pill. An unmatched payment stays paid on the bill.
- **A disabled action always has a `BlockedPanel` or `Checklist` beside it.**
- **After any money or vehicle action, show a `ConfirmationBlock`, not a toast.**
- **Open owner decisions stay open.** Two examples: whether missing accessories block a handover, and which state a car enters after return. These are shown as "open" items, not decided by the design.

## Never ship a placeholder as if it were a value

- A figure nobody has counted yet is **not** written as `[so far]` or `[current balance]`. A bracketed token reads as an unfinished screen and teaches staff to distrust the numbers.
- Say what is true instead: "තවම ගණන් කළේ නැහැ · not counted yet", "මේ වෙනකම් · so far today", or the count of records behind it ("4 customers · 1 over 30 days"). The figure appears when the record has one.
- Record ids never break across lines. `VehicleCard` and `VehicleRow` set `R-0218`, `BOC-448812` and the like with a non-breaking hyphen.

## Design evidence

These moves were chosen from real product screens on Mobbin.

| Move | Mobbin screen | Used in Plate as |
| --- | --- | --- |
| Cool light ground, the vehicle as the hero | [Waymo "My car"](https://mobbin.com/screens/e8d3839e-537f-40a8-981c-1b87645e441a) | `paper` ground |
| Strong yellow beside near-black | [Bumble](https://mobbin.com/screens/1792fae8-a30f-4a41-a9c2-cbdc8d0b2548) | `plate-ground` with `plate-ink`, kept small |
| Labelled sidebar grouped by job, Create button on top | [Jobber](https://mobbin.com/screens/9d13e7c9-3793-49e8-b1b8-016d669aec25), [Shopify](https://mobbin.com/screens/a2704a6b-d772-46e4-b7e6-26653af6d44f) | `NavRail` |
| Car papers on a light ground | [Lloyds "Manage vehicle"](https://mobbin.com/screens/bfb6ebd8-5097-4f7a-bce4-2243ae5efc6d) | Maintenance and renewals screens |
| One soft 3D car image per type | [Uber "Choose a ride"](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea) | `VehicleImage` from the SNS vehicle pack |
| Upcoming bookings grouped by day | [Turo "Booked"](https://mobbin.com/screens/0e71a725-ae83-4748-aa71-3328231d5147), [Time2book](https://mobbin.com/screens/68d65d3e-c5ff-400b-b942-ff8c409da40b) | 18.1 Reservations |
| One row per car with days across | [Turo calendar](https://mobbin.com/screens/9fec30d6-182e-4422-ad71-c8b192fed6c4) | The 30-day strip on 18.2 New reservation |
| Booking summary beside the form | [KAYAK](https://mobbin.com/screens/27e92235-5e13-4a84-92a6-0dd3253d94e9) | Summary on 18.2 and 18.3 |
| Cancel showing the reason and refund first | [Tripadvisor](https://mobbin.com/screens/d5195b25-2e63-4b6c-b768-0d27f56827cd), [Turo cancel](https://mobbin.com/screens/adf00382-a6d2-409c-81ce-255d9a5f5f5f) | 18.5 Cancel or no-show |
| Change and cancel as separate actions | [Expedia "Manage booking"](https://mobbin.com/screens/9c4f3fca-fbb2-4dd0-b926-113ad4e3b94f) | Actions on 18.3 |
| A clash warning on the page, with its reason | [Fresha](https://mobbin.com/screens/ac5e971e-8cfb-47ca-9b36-bb6ae392b53f) | `BlockedPanel` on 06.8 Extend |

None of these proves anything about SNS users. Test Plate in Sinhala with the owner and staff, on their own phones and office PCs, outdoors as well as in the office.
