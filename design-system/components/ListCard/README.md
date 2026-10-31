# ListCard
One card of divided rows. Use it on home screens and summaries for "what needs you", "coming up", money and the cars that need a look. Every row opens what is behind it.

**Provide:**
- `title` ("සිංහල · English"), optional `sub` (one short line under the title)
- `more`: `{ label, href }`, the link to where all the items are
- `groups`: each with an optional `label` and its `rows`; or plain `rows` when there are no groups
- `foot`: a footnote, for example what "—" means
- `bare: true`: rows only, no title or border, for rows inside a card that already has its own head (staff home's overdue block)
- `columns`: `2` puts the rows in two columns on desktop (one column below 900px)

**A row (`ListRow`)** has:
- `icon`, and `tone`: `warning`, `overdue` or `key` (handovers) for the icon tile
- `title` and `detail`; optional `plate` (a plate before the detail) and `tag` (a short warning, such as a missing document)
- one value: `figure` (Gemunu Libre; `currency: true` adds "LKR") or `meta` (muted text such as a date)
- `href`; `small: true` for secondary rows
- or `car` (a `VehicleRow`) or `link` (`{ label, href }`, a "see all" row)

**Rules:**
- **One kind of thing per row.** Money rows are never summed across rows. Collections, earnings, deposits held, partner payables and customer debt each get their own row; held and not-final money go under their own `label`.
- **No invented figures.** A figure the data does not have is "—" with a `foot` saying so.
- **Rows are rows, not cards.** Never put a card inside a row or a ListCard inside a ListCard.
- **Touch:** rows are at least 52px tall; the `more` link is 48px.
- **Order** follows the screen's task order, set in `brand/guidebook/07-layout-and-navigation.md` (Dashboard layout).

