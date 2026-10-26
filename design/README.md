> **Single source of truth:** `E:\sns_fleet_managment_system\SNS_SYSTEM_DESIGN.md`. Requirements and business rules live there and win over anything in this design system or the screens. Agent instructions: `AGENTS.md` in the same folder. Screens: canvas "SNS Rent Car · Plate" (https://claude.ai/artifact/XPpVE6ZafYtyG4gRZukHYz). Proposal: `proposal/SNS_Rent_a_Car_Proposal_SI.pdf` in the same folder (https://claude.ai/artifact/DCDGDwQJRuL7K8AUNN4nQ5).

Plate is the current and only visual system for the SNS Rent Car management website, made from Ratna and chosen by the owner on 24 Oct 2026 (Theme A). It changes the look and leaves the experience alone: screens, flows, words, permissions and money rules are unchanged. Ratna and Concepts A/B/C are retired.

It is used by the owner, one admin and three staff at one branch near Elpitiya, on office computers and phones, in Sinhala first. The idea is in the name: **the Sri Lankan number plate is the one thing that stands out.** Every car is shown by its plate, on a yellow plate face; everything else stays quiet.

## What changed from Ratna, and why

| Part | Ratna | Plate | Reason |
| --- | --- | --- | --- |
| Ground | Warm paper `#f6f4ef` | Cool mist `#eef1f0` | The cream ground was flagged on every screen by the Impeccable check as a default look. A cool grey keeps the calm and lets the yellow plate carry the warmth. |
| Signature | Sapphire alone | Yellow plate face `plate-ground` `#f6c343` | Staff read plates all day. Making the plate the one bright thing helps them find a car on a list before reading a word. |
| Action colour | Sapphire `#1d3fbf` | Action blue `#1756a9` (token still named `sapphire`) | Slightly calmer next to the yellow; 7.1:1 with white text. The name is kept so every component and screen keeps working. |
| Type | Inter + Noto Sans Sinhala | Yaldevi for words, Gemunu Libre for plates and figures | The proposal SNS approved is set in these two faces, so the product and its paperwork now look like one business. |
| Rented status | Slate | Charcoal `#2c3330` | Matches the new neutral family; still not blue. |

**Test before rollout:** an early Ratna draft dropped Yaldevi because it looked small next to Inter. Plate uses Yaldevi for both scripts, so the mismatch is gone, but its text sits a little taller: Theme A screens needed up to about 10% more height. Check it on the staff phones outdoors.

## Content fundamentals

These are unchanged from Concept A.

- **Write plain, everyday Sinhala.** Keep English only for words SNS already uses: car, bill, cash, km, partner, deposit, staff, agreement, photo, admin.
- **Labels are short nouns; actions are verbs.**
    - Navigation: "වාහන", "කුලී", "මුදල්" (vehicles, rentals, money).
    - Buttons: "අලුත් කුලියක්" (new rental), "ආපසු ගන්න" (receive return), "ගෙවීම සටහන් කරන්න" (record payment).
    - When something is missing, the button names it: "අත්සන් කළ agreement එකේ photo එක දාන්න".
- **Say who and when on every money or vehicle event:** "Nimal · 9:52".
- **Write money as `LKR 48,950`**, with thousands separators and Western digits. Signs carry a word.
- **Dates:** "Fri 23 Oct 8:00". Overdue reads as time past the deadline: "+3h 05m".
- **Never use "profit" (ලාභය).** Its definition is an open owner decision.
- **Never claim more than the record knows.** "Matched" names who matched it. Nothing is "verified". A car not found at the morning check says so.
- **No emoji anywhere.**
- **Required fields** say so in words after the label: "(අනිවාර්යයි · required)", in `overdue` colour. Approved by Dulan on 25 Oct 2026; it replaces the informal "(ඕන)".
- **Open owner decisions** carry "තීරණය කරන්න · Decide". Approved by Dulan on 25 Oct 2026.
- **The menu group headings are approved** (Dulan, 25 Oct 2026): "වාහන සහ කුලී · Cars and rentals", "මුදල් · Money", "ව්‍යාපාරය · Running SNS".
- **Other Sinhala labels are still drafts for SNS review.**

## Visual foundations

**Colour**

- **Neutrals do most of the work.** `paper` is the page, `card` every surface you read or tap, `sunken` photo frames and read-only fields. `ink` (on paper 14.7:1) and `ink-muted` (6.9:1) are the text.
- **The plate is the signature.** `plate-ground` with `plate-ink` is used only for number plates, the SNS mark and the active rail or tab pill. It never marks a status, never fills a button, never covers a large area.
- **Action blue (`sapphire`) is for doing things:** the primary button, links and the focus ring. It never marks a status.
- **Status colours outrank both.** Each status is a tint with dark text, plus its icon and word.
    - **Overdue is the only solid chip** (white on `overdue`).
    - **Temporarily unavailable** also takes a dashed border, so it is never confused with Rented.
- **Fleet ticks** use the brighter `*-tick` colours; never without the worded legend.
- **Money signs:** received in `available`, going out in `overdue`, always with + or − and a word.
- **Focus ring:** 3px `focus` with a 2px offset.

**Type**

- **Yaldevi for every word, Sinhala and English.** One family for both scripts keeps a mixed line like "Deposit තියාගෙන · Held, not income" in one voice.
- **Gemunu Libre for plates, money, counts and times** (`plate`, `figure`, and anything marked `rt-num`), with tabular figures so columns line up. Headings (`h1`, `h2`, the top-bar title) use it too.
- **Three weights:** 400 reading, 500 labels, 600 headings, buttons, plates and figures. Never heavier: bold Sinhala loses its vowel signs.
- **Bilingual labels have two voices.** In "සිංහල · English" the Sinhala is the label and the English a quieter echo (`rt-en`).
- **Sizes:** `body` 17px on phones, `body-desktop` 16px on computers, nothing on screen under `caption` 14px. Line height 1.7; let labels wrap.
- **Printed documents** (agreement, receipt, bill, payslip, partner statement) keep body text at 14px or more, but fine print and notes may be 12px (about 9pt on A4). Never below 12px. Decided by Dulan on 25 Oct 2026.
- **No letter-spacing beyond the plate's, no capitals styling, no eyebrow labels.**

**Navigation**

- **Desktop: `NavRail`, always on the left of the page, never above it.** At 1,100px and wider it is a 264px labelled sidebar; narrower, a 104px rail with icon over Sinhala label. It stays in view while the page scrolls. Counts link straight to their filtered list.
- **The 264px sidebar** (concept A, chosen by Dulan on 25 Oct 2026, after Jobber and Shopify).
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
- **The order of screens and the steps inside each flow are Concept A's.** Plate changes no routes.

**Dashboard layout**

- **Owner home (desktop), top to bottom, in Concept A's order:**
    1. Top bar (greeting, date, search)
    2. `AttentionBar`
    3. The money ledger as separate `MoneyBlock`s
    4. Vehicles: `FleetStrip` (its legend links replace the old status filter buttons), then the gallery grouped by status
    5. Coming up
- **Phone:** the same order in one column. The gallery becomes `VehicleRow`s.
- **Two-pane layouts need at least 1280px.** Below that they stack.
- **Spacing:** `space-6` between blocks and `space-8` between sections on desktop; `space-4` margins on phones.
- **Radius:**
    - `radius-lg` for cards
    - `radius-md` for buttons, chips and inputs
    - `radius-sm` for plates and ticks
    - `radius-pill` only for count badges, nav pills and the centre action
- **Depth:** declare elevation once. Cards take a 1px `line` border and no shadow. `shadow-lift` is only for the phone centre action and open sheets.
- **Fewer containers.** Group by proximity and dividers first. A card is for something you tap as one object. Never nest cards.

**Never ship a placeholder as if it were a value**

- A figure nobody has counted yet is **not** written as `[so far]` or `[current balance]`. A bracketed token reads as an unfinished screen and teaches staff to distrust the numbers.
- Say what is true instead: "තවම ගණන් කළේ නැහැ · not counted yet", "මේ වෙනකම් · so far today", or the count of records behind it ("4 customers · 1 over 30 days"). The figure appears when the record has one.
- Record ids never break across lines. `VehicleCard` and `VehicleRow` set `R-0218`, `BOC-448812` and the like with a non-breaking hyphen.

**Status on a card**

- The chip over the photo carries the **status word only**, so it fits a card at any width, including two-up on a phone.
- The detail that qualifies it — "+3h 05m", "AC fault", "back 25 Oct" — goes on its own line in the card body, in that status's colour. Same on desktop and phone; one vocabulary.

**Imagery and vectors**

- **Every car shows its model's image (`VehicleImage`)** from the SNS vehicle PNG pack v2: soft 3D, front three-quarter, transparent, pearl silver-grey, made for the `paper` ground. Wagon R, Alto, Spacia, Every, Prius and Axio each have their own; any other model shows the generic car. Adopted by Dulan on 25 Oct 2026; it replaces the hatch, van and sedan line drawings.
- **The image never carries data.** No plate, status, price or text on it, no tint and no crop; the whole car is always visible. It shows the kind of car, not this car: its colour is not the car's colour.
- **Sizes:** heroes use the 512px file (`size="lg"`); rows, cards and pickers the 256px file, in a slot at least 56 × 44 px.
- **A car's own photo** (optional, one per car, added by an admin on 04.4 Edit car) takes the model image's place in `VehicleCard` and `VehicleRow` (`photo`). Until it is added, the model image shows. System design §4.2, **Proposed** under change request CR-001 (no charge), waiting for the owner's agreement.
- **The SNS logo (`BrandMark`)** is the yellow road "S" with the SNS RENT CAR wordmark, supplied by SNS on 25 Oct 2026. Use the supplied file only, on light grounds, once per screen and at the head of every printed document. Never redraw or recolour it, and never add a car maker's badge.
- **SNS 3D icons (`GameIcon`, 44, supplied by SNS on 25 Oct 2026):** soft pearl objects in the vehicle pack's style, each with one accent from its menu group (teal cars and rentals, lavender money, mauve running SNS; none for today, search and empty states). The accents live only inside the images and are not UI colours.
    - **Only on:** launcher tiles and quick actions (`LauncherTile`, 56px), empty states (`EmptyState`, 96px, no accent) and done screens (`ConfirmationBlock icon`, 72–96px).
    - **Never on:** statuses, money states, warnings, navigation or buttons, which keep the line icons. No streaks, points, badges or scores for staff, no confetti.
- **No other decorative illustrations, gradients, glass effects or stock people.**

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

## Iconography

- **The `Icon` set:** 24px grid, **1.75px round stroke**, drawn in `currentColor`. These are original drawings, except `wrench`, which follows the open-licence Lucide shape.
- **Every icon appears with a visible word.** No icon-only navigation.
- **Fixed meanings:**
    - `clockAlert` overdue · `check` available or done · `key` rented · `wrench` under repair · `pause` temporarily unavailable
    - `link` matched · `unlink` unmatched · `lock` finalised · `eyeOff` provisional · `hourglass` waiting · `question` not found at the morning check

## Rules that protect the money

These are unchanged from Concept A.

- **Separate blocks.** Money received, the drawer, reconciliation, deposits held, customer debt, partner payable (finalised), partner share (provisional) and SNS earnings are separate `MoneyBlock`s. They are never added together.
- **During the day, blocks say "මේ වෙනකම් · so far".**
- **Two pills for a staff payment.** It shows "Recorded · [name]" and a separate reconciliation pill. An unmatched payment stays paid on the bill.
- **A disabled action always has a `BlockedPanel` or `Checklist` beside it.**
- **After any money or vehicle action, show a `ConfirmationBlock`, not a toast.**
- **Open owner decisions stay open.** Two examples: whether missing accessories block a handover, and which state a car enters after return. These are shown as "open" items, not decided by the design.

## Evidence

The new moves were chosen from real product screens on Mobbin; Ratna's evidence still applies to the layout and components.

| Move | Mobbin screen | Used in Plate as |
| --- | --- | --- |
| Cool light ground, the vehicle as the hero | [Waymo "My car"](https://mobbin.com/screens/e8d3839e-537f-40a8-981c-1b87645e441a) | `paper` ground |
| Strong yellow beside near-black | [Bumble](https://mobbin.com/screens/1792fae8-a30f-4a41-a9c2-cbdc8d0b2548) | `plate-ground` with `plate-ink`, kept small |
| Labelled sidebar grouped by job, Create button on top | [Jobber](https://mobbin.com/screens/9d13e7c9-3793-49e8-b1b8-016d669aec25), [Shopify](https://mobbin.com/screens/a2704a6b-d772-46e4-b7e6-26653af6d44f) | `NavRail` |
| Car papers on a light ground | [Lloyds "Manage vehicle"](https://mobbin.com/screens/bfb6ebd8-5097-4f7a-bce4-2243ae5efc6d) | Maintenance and renewals screens |
| One soft 3D car image per type | [Uber "Choose a ride"](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea) | `VehicleImage` from the SNS vehicle pack |

None of these proves anything about SNS users. Test Plate in Sinhala with the owner and staff, on their own phones and office PCs, outdoors as well as in the office.

## Local font loading (26 October 2026)

Use the supplied local `fonts/plate/fonts.css`: Yaldevi for interface text; Gemunu Libre for headings, plates and figures. Heading tokens now match the existing screen styles. Component stylesheets import the local font stylesheet first; static HTML previews link it from the head. Font files and their SIL OFL notices were extracted from the original project font ZIP. External Google Fonts access is no longer required. This local fix does not claim that online artifacts have been republished.
