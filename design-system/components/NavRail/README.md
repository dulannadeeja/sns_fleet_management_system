# NavRail
The desktop navigation: a 264px labelled sidebar (chosen 25 Oct 2026). The SNS logo sits at the top, then the items grouped by job. Settings sits at the bottom. "New rental", search, the language switch and the account live in the top bar (`AppHeader`), decided by Dulan on 25 Oct 2026.

**Provide:**
- `items` `[{icon, label, href, active, badge, badgeTone, badgeHref, group, en}]`. `badgeHref` makes the count its own link to the filtered list (Rentals 1 opens the overdue rentals; system design §15, AT-28).
- optional `footer`.
- `newHref` and `newLabel` still work, but screens no longer use them: "New rental" belongs in `AppHeader`.
- **Give its slot `style="flex: none"`** and the page column `flex: 1 1 0; min-width: 0`, in a shell that never wraps (`flex-wrap: nowrap`). The sidebar sets its own width.

**How it groups:** by the Sinhala label, so screens keep passing the same items as before.
- Top, with no heading: අද · Today, උදේ check · Morning check.
- වාහන සහ කුලී · Cars and rentals: Cars, Rentals, Customers.
- මුදල් · Money: Money, Drawer, Partners, Payroll, My payslip, My earnings, Cash out.
- ව්‍යාපාරය · Running SNS: Approvals, Maintenance, Reports.
- Bottom: සැකසුම් · Settings.
- `group` (0–3, or 9 for the bottom) overrides this, and `en` overrides the English echo. The group headings are Sinhala drafts for SNS to review.

**Rules:**
- **It is always on the left.** It never wraps above the page, whatever the window width.
- **It stays in view while the page scrolls** (sticky, full window height; the list scrolls inside it if needed).
- **Below 1,100px window width it becomes a 104px rail:** the logo mark, then each item as its icon over the Sinhala label (14px), group headings replaced by dividers, counts on the icon's corner. Labels never disappear.
- **At 1,100px and wider: the 264px sidebar,** Sinhala first with the English echo.
- **Trim items by permission,** exactly as before. A partner sees only their own money items.
- **Counts sit at the end of the line.** They're red only for overdue (`badgeTone: 'overdue'`) and dark for things waiting on this person, such as approvals. A count is never the only signal; the screen behind it says what it is.
- **The active item takes the plate-yellow pill,** as the old rail did.
- **The search stays in `AppHeader`;** the sidebar doesn't repeat it.

Pattern references (Mobbin):
- [Jobber — labelled items in groups](https://mobbin.com/screens/9d13e7c9-3793-49e8-b1b8-016d669aec25)
- [Shopify admin — grouped sidebar with counts at the end of the line](https://mobbin.com/screens/a2704a6b-d772-46e4-b7e6-26653af6d44f)
- [Bonsai — labelled sidebar with Tools and Finances groups](https://mobbin.com/screens/65f29225-29eb-493b-933c-61c47b213275)
