# AttentionBar
The sticky row of labelled counts at the top of every owner and admin screen. Each count opens a filtered list.

**Provide:** `items`, each with:
- `label`: always visible text
- `count`
- `tone`: `overdue` | `warning` | `info` | `neutral`
- `icon`
- `href`: the list it opens, already filtered (system design §15, AT-28). Overdue opens the overdue rentals; Open items and Today's decisions open Needs attention; Waiting for admin opens Approvals.
- or `onClick` in the app

**Rules:**
- **The categories never double-count:**
    - **Overdue:** cars past their deadline.
    - **Open items:** unresolved differences, unmatched payments, morning-check mismatches and reservations flagged for attention (a reserved car late back or under repair, ST-18.1).
    - **Waiting for admin:** staff requests and allocations only an admin can decide.
    - **Today's decisions:** decisions staff took with a reason, such as a waiver or an override.
- **It always counts the whole business**, even when a panel below is narrowed to one car.
- **Mobile:** a 2×2 grid, sticky under the header.

Pattern references (Mobbin):
- [DocuSign home — two large counts with labels ("Action required", "Waiting for others")](https://mobbin.com/screens/d15d340b-3c85-45bd-8c4f-add659823a6e)
- [Jobber home — workflow columns as labelled counts with sub-states](https://mobbin.com/screens/850e0dd4-ef8e-45a8-846d-c6545868509c)
