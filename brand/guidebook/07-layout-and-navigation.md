# 07 · Layout, navigation and responsive

## Navigation

- **Desktop: `NavRail`, always on the left of the page, never above it.** At 1,100px and wider it is a 264px labelled sidebar; narrower, a 104px rail with icon over Sinhala label. It stays in view while the page scrolls. Counts link straight to their filtered list.
- **The 264px sidebar** (chosen by Dulan on 25 Oct 2026, after Jobber and Shopify).
    - The SNS logo sits at the top.
    - Then the items, grouped by job: today, cars and rentals, money, running SNS. Settings sits at the bottom.
    - Every item shows its Sinhala label and an English echo.
    - The active item's pill is `plate-ground` (yellow) with `plate-ink`.
    - Counts sit at the end of the line: red for overdue, dark for things waiting.
    - **A count opens its list already filtered** ("Rentals 1" opens the overdue rental), with the filter shown as a removable chip. The same goes for `AttentionBar` items. System design §15, AT-28.
    - Items are trimmed by permission, exactly as before.
- **Top bar: `AppHeader`**, white with a hairline (Dulan, 25 Oct 2026). Left to right:
    - the page title and today's date
    - search, which opens the search screen (plate, name, NIC, phone or rental number)
    - "අලුත් කුලියක් · New rental", for anyone who can start a rental
    - the සිං / EN switch
    - the person's initials, with name and role when the bar is 1,100px or wider
    - Partners get neither search nor New rental.
- **Phone page header: `PageHeader`** with a real back link (arrowLeft), title and subtitle.
- **Phone: `BottomTabBar`.** Four labelled tabs plus an optional raised centre action. The centre action is only for the person's most frequent task:
    - staff: "අලුත්" (new rental)
    - owner: no centre action, because the owner mostly reads
- **The order of screens and the steps inside each flow are set by `screens/`.** The visual system changes no routes.

## Dashboard layout

- **Owner home (desktop), top to bottom:**
    1. Top bar: "අද · Today", the date, search
    2. `AttentionBar`
    3. Two columns. Left: "For you to decide" (approvals waiting, then open items) and "Coming up" (returns, service, owner use, renewals, payroll). Right: money, one row per kind of money, never added together: collected today (cash, bank, card, refunds and expenses kept apart), SNS earnings against the same days last month, customer debt, partner payable and cash-out requests; then, each under its own label, deposits held, partners' not-final amounts, and the drawer and bank and card checks
    4. Vehicles: `FleetStrip` (its legend links open the filtered lists), then only the cars that need a look, a link to car performance (14.2) and a link to 04.1 All cars, which keeps the full gallery
- **Staff home (desktop), top to bottom:** top bar with search; quick actions (new rental, receive return, record payment; expense and drawer count as smaller links); overdue and due back, with reservations collecting today; handovers waiting for documents; the morning check; Vehicles as the `FleetStrip` and a link to 04.1 All cars.
- **Phone:** the same order in one column, by the task done first. Each list shows its first rows and a link to where all its items are. Staff start new rentals from the centre button.
- **Rows, not cards:** each list is one card with divided rows; every row opens what is behind it. A figure the sample data does not have is shown as "—" with a note, never invented.
- Every home board ends with a line saying its names, plates, counts and amounts are sample data.
- Proposed: dashboard first pass for review, recorded by Dulan, 26 Oct 2026.
- **Two-pane layouts need at least 1280px.** Below that they stack.
- **Spacing:** `space-6` between blocks and `space-8` between sections on desktop; `space-4` margins on phones.
- **Radius:**
    - `radius-lg` for cards
    - `radius-md` for buttons, chips and inputs
    - `radius-sm` for plates and ticks
    - `radius-pill` only for count badges, nav pills and the centre action
- **Depth:** declare elevation once. Cards take a 1px `line` border and no shadow. `shadow-lift` is only for the phone centre action and open sheets.
- **Fewer containers.** Group by proximity and dividers first. A card is for something you tap as one object. Never nest cards.

## Status on a card

- The chip over the photo carries the **status word only**, so it fits a card at any width, including two-up on a phone.
- The detail that qualifies it — "+3h 05m", "AC fault", "back 25 Oct" — goes on its own line in the card body, in that status's colour. Same on desktop and phone; one vocabulary.

## Responsive layout

Checked on 25 Oct 2026 by rendering every screen at 320, 360, 390, 430 and 768 px (phone screens) and 768, 1024, 1100, 1280, 1440, 1920 and 2560 px (desktop screens). The supported minimum is 360 px; at 320 nothing scrolls sideways, but 11 phone screens are crowded.

- **Phone screens** fill the width (`width: 100%`, `min-width: 320px`). The page header sticks to the top and the tab bar to the bottom. When a sheet or dialog is open, both sit under its dimmed backdrop.
- **Desktop screens:**
    - The page is centred, up to 1600 px wide.
    - From 1100 px the sidebar is 264 px. Below 1100 px it becomes the 104 px rail.
    - When the top bar is under 1000 px wide, search shrinks to its icon (its label stays for screen readers), "New rental" shows only the Sinhala text, and the account name is hidden. This is the one place an icon stands alone.
- **Tables** keep their columns and scroll sideways inside their card (`.rt-tscroll`).
    - A table's minimum width gives the first flexible column at least 200 px and each other one at least 140 px.
    - The edge that has more columns fades out.
    - Card headings and buttons stay outside the scrolling part.
- **List rows** (picture, plate, who, chip, status, arrow; `.rt-lrows` / `.rt-lrow`) stack into picture, details, arrow when the list is under 720 px wide, instead of scrolling.
- **Label and value rows** use `minmax(0, 1fr) fit-content(55%)`, so a long value wraps instead of crushing its label. Rows with a chip or button on the right use `fit-content(45%)` on phones.
- **Card grids** of 3 to 5 columns use `auto-fill` with a minimum card width (150 to 260 px), and never more columns than designed.
- **Headings with a button** wrap the button onto its own line when there is no room.
- **Blocked-reason panels** (`.rt-blocked`) stack question over answer when they are under 340 px wide.
- **Minimums:**
    - Text is at least 14 px on screens.
    - Tap targets are at least 44 px: tab labels, language buttons and chips. Text links inside sentences get a larger touch area on touch screens.
