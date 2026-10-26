# 08 · Money and evidence on screen

## Rules that protect the money

These are unchanged from Concept A.

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

The new moves were chosen from real product screens on Mobbin; Ratna's evidence still applies to the layout and components.

| Move | Mobbin screen | Used in Plate as |
| --- | --- | --- |
| Cool light ground, the vehicle as the hero | [Waymo "My car"](https://mobbin.com/screens/e8d3839e-537f-40a8-981c-1b87645e441a) | `paper` ground |
| Strong yellow beside near-black | [Bumble](https://mobbin.com/screens/1792fae8-a30f-4a41-a9c2-cbdc8d0b2548) | `plate-ground` with `plate-ink`, kept small |
| Labelled sidebar grouped by job, Create button on top | [Jobber](https://mobbin.com/screens/9d13e7c9-3793-49e8-b1b8-016d669aec25), [Shopify](https://mobbin.com/screens/a2704a6b-d772-46e4-b7e6-26653af6d44f) | `NavRail` |
| Car papers on a light ground | [Lloyds "Manage vehicle"](https://mobbin.com/screens/bfb6ebd8-5097-4f7a-bce4-2243ae5efc6d) | Maintenance and renewals screens |
| One soft 3D car image per type | [Uber "Choose a ride"](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea) | `VehicleImage` from the SNS vehicle pack |

None of these proves anything about SNS users. Test Plate in Sinhala with the owner and staff, on their own phones and office PCs, outdoors as well as in the office.
