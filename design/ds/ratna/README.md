Ratna is the second visual system for the SNS Rent Car management website. It changes the look and leaves the experience alone: the screens, flows, words, permissions and money rules are the same as Concept A ("Today, by vehicle"). It is used by the owner, one admin and three staff at one branch near Elpitiya, on office computers and phones, in Sinhala first. *Ratna* (රත්න) means gem; the brand colour is Ceylon sapphire.

The people using it are new to software, so every rule favours recognising something over remembering it: a photo or outline with the plate, a word beside every icon, one clear verb per screen.

## What changed from the first system, and why

| Part | First system (SNS) | Ratna | Reason |
| --- | --- | --- | --- |
| Ground | Cool grey, navy header and sidebar | Warm paper `#f6f4ef`, white surfaces, light top bar | Staff use phones outdoors at the yard. A light page holds up in sunlight; a dark navy bar sits beside the photos and fights them. |
| Brand colour | Navy + gold | Sapphire, alone | Gold failed contrast on white (2.4:1) and was too close to the warning amber. Sapphire passes 8.4:1 as text and as a button. |
| Rented status | Blue | Slate | Blue now belongs to the brand only, so a sapphire button is never mistaken for a status. |
| Navigation (desktop) | 248px navy sidebar | 128px labelled rail | Gives the vehicle gallery more width. Each item still shows its word. |
| Navigation (phone) | 4–5 flat tabs | 4 tabs + a raised "අලුත්" (new rental) centre action | Starting a rental is the most frequent staff task. |
| Fleet overview | Five count tiles | `FleetStrip`: one tick per car | 30 cars fit on one line. The eye sees the one red tick before reading any number. |
| Type | Noto Sans + Noto Sans Sinhala | Inter + Noto Sans Sinhala, three weights, English as a quieter echo | Cleaner figures and a clearer split between Sinhala and English. (An earlier Ratna draft used Hanken Grotesk, Yaldevi and Barlow Semi Condensed; Yaldevi rendered small and loopy beside the Latin, so it was replaced.) |
| Vehicle outline | Filled grey shape | Line drawing on a dashed road | Reads as a drawing, not a missing photo; matches the 1.75px icons. |

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
- **The Sinhala labels are drafts for SNS review.**

## Visual foundations

**Colour**

- **Three neutrals do most of the work.** `paper` is the page, `card` is every surface you read or tap, `sunken` is photo frames and read-only fields. `ink` and `ink-muted` are the text (16.1:1 and 6.6:1 on paper).
- **Sapphire is the only brand colour.** Use it for the primary button, the active rail or tab pill, links and the focus ring. It never marks a status. Most of any screen stays neutral; sapphire should cover well under a tenth of it.
- **Status colours outrank the brand.** Each status is a tint with dark text, plus its icon and word.
    - **Overdue is the only solid chip** (white on `overdue`, 6.6:1).
    - **Temporarily unavailable** also takes a dashed border, so it is never confused with Rented.
- **Fleet ticks** use slightly brighter `*-tick` colours because they are graphics, not text. A tick is never shown without the worded legend.
- **Money signs:** received amounts in `available`, money going out in `overdue`, always with + or − and a word.
- **Focus ring:** 3px `focus` (sapphire) with a 2px offset.

**Type**

- **One pair, everywhere: Inter for English and numbers, Noto Sans Sinhala for Sinhala.** Both are free on Google Fonts, both are built for screens, and they sit at the same height and stroke weight, so a mixed line like "Deposit තියාගෙන · Held, not income" reads as one voice. There is no third font: plates, money and counts use Inter too.
- **Three weights only.**
    - 400 for reading text.
    - 500 for labels, chips, rail and tab items.
    - 600 for headings, buttons, plates, figures and the selected rail or tab item.
    - Never 700 or heavier: bold Sinhala clots and loses its vowel signs.
- **Bilingual labels have two voices.** In "සිංහල · English", the Sinhala is the label and the English is a quieter echo (400 weight, slightly lighter). Components do this automatically for labels written that way (`AttentionBar`, `MoneyBlock`, `Checklist`, `BlockedPanel`, `ConfirmationBlock`, `Notice`, `AppHeader`); in hand-written markup, wrap the English part in `<span class="rt-en">`.
- **`plate`** and **`figure`** are Inter 600 with tabular figures, so columns of money and counts line up. A plate gets its look from the plate frame, not from a special font.
- **Sizes:** `body` 17px on phones, `body-desktop` 16px on computers, nothing under `caption` 14px.
- **Line height 1.7.** Sinhala vowel signs sit above and below the letters. Let labels wrap rather than cut them off.
- **No letter-spacing, no capitals styling, no eyebrow labels above headings.** Hierarchy comes from size and weight.

**Navigation**

- **Desktop: `NavRail`** (128px). An icon inside a pill above a visible label; the active item's pill is `sapphire-tint`. The SNS mark sits at the top. The items are trimmed by permission, exactly as in Concept A.
- **Top bar: `AppHeader`**, white with a hairline. It holds the page title and today's date, a search box (plate, name or rental number), the language switch, and the person's initials and role.
- **Phone: `BottomTabBar`.** Four labelled tabs plus an optional raised centre action. The centre action is only for the person's most frequent task:
    - staff: "අලුත්" (new rental)
    - owner: no centre action, because the owner mostly reads
- **The order of screens and the steps inside each flow are Concept A's.** Ratna changes no routes.

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

- **One catalogue photo per vehicle** (16:10) when SNS has one.
- **No photo: `VehicleSilhouette`.** It is a line drawing (hatch, van or sedan) with a white body, sapphire-tint glass, ink wheels and a dashed road line, on `sunken`. People allowed to edit vehicles also see "Photo නැහැ · එකතු කරන්න".
- **The brand mark is the plate.** "SNS" is set inside a number-plate frame with a thin sapphire inner rule (`BrandMark`). SNS has no logo; do not draw one or any car maker's badge.
- **No decorative illustrations, gradients, glass effects or stock people.**

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

The new visual moves come from real product screens found on Mobbin. The UX patterns keep their Concept A sources; see the first system.

| Move | Mobbin screen | Used in Ratna as |
| --- | --- | --- |
| Labelled icon rail beside a wide grid | [Turo host (web)](https://mobbin.com/screens/0e71a725-ae83-4748-aa71-3328231d5147) | `NavRail` |
| Warm paper ground, calm working screens | [Jobber](https://mobbin.com/screens/50f5f03d-9bbb-4e5b-aae8-7051e509dbd6), [komoot](https://mobbin.com/screens/f59e0baf-df83-432b-ac06-8b533006a875) | `paper` ground |
| One accent on a quiet ground; a big numeral as the graphic | [Polestar](https://mobbin.com/screens/2a951757-674c-4479-95a8-5fa820009c05) | Sapphire alone; plate-face figures |
| Raised centre action in a labelled tab bar | [ElevenLabs](https://mobbin.com/screens/84b4c2ce-7b32-4595-b59f-005f5ed09e87) | `BottomTabBar` `fab` |
| Pill around the active tab icon | [Waymo](https://mobbin.com/screens/e8d3839e-537f-40a8-981c-1b87645e441a), [Strava](https://mobbin.com/screens/0c3728d9-6036-464c-87af-c2cd954344ad) | Rail and tab active state |
| Vehicle as the hero of its card | [Tesla](https://mobbin.com/screens/c0a37ffb-23c3-44d7-a3e8-fd50735582e0), [Mercedes](https://mobbin.com/screens/56a361b4-84db-48cf-a4f4-58e398914361) | `VehicleCard` photo area |
| Colourful tiles (counter-example: gradients) | [Rivian](https://mobbin.com/screens/a299be57-dd7b-4bda-b598-d94fe14034ad) | Flat tints only |

None of these references proves anything about SNS users. Test Ratna in Sinhala with the owner and staff, on their own phones and office PCs, outdoors as well as in the office.
