# SNS Plate: extracted technical specification

> Historical extraction: F05/F14 were fixed locally afterward. See TYPOGRAPHY_FIX.md and current design/design-system/tokens.json for the corrected heading families and local font loading.

26 October 2026. Observed local snapshot; not a replacement source of truth. Conflicts are preserved and cross-referenced in AUDIT.md.

## Authority and runtime

Requirements: SNS_SYSTEM_DESIGN.md. Visual master: online Plate system/canvas. Local design/ is read-only. CHANGELOG records canvas v64 / system v13. React 18 is declared in design-system.json. The component bundle expects window.React and exports window.Plate. This prototype library does not select a production stack.

## Colour tokens

| Token | Value | Existing usage |
| --- | --- | --- |
| `paper` | `#eef1f0` | Page ground: a cool mist grey. Not cream; calm in office light and holds up outdoors on phones. |
| `card` | `#ffffff` | Cards, rows, sheets, the nav rail, the top bar and the phone tab bar. |
| `sunken` | `#e4e9e7` | Photo frames, read-only fields, segmented-control track, quiet notices. |
| `line` | `#d6dcd9` | Dividers and card borders (decorative; never the only boundary of a control). |
| `line-strong` | `#78827d` | Input and secondary-button borders (3.97:1 on card). |
| `ink` | `#1b1f1d` | Text and figures on paper and card; also the text on a yellow plate (10.2:1 on plate-ground). |
| `ink-muted` | `#4b5450` | Secondary text and metadata: 6.9:1 on paper, 7.8:1 on card. |
| `sapphire` | `#1756a9` | Action blue: primary buttons, links, focus ring. White on it 7.1:1. Never a status colour. (Name kept from Ratna so components stay compatible.) |
| `sapphire-strong` | `#0f3e7e` | Primary button hover/pressed; emphasis text on sapphire-tint. |
| `sapphire-tint` | `#e2ebf7` | Selected rows, info notices, matched/deposit pills. Sapphire text on it 5.9:1. |
| `on-sapphire` | `#ffffff` | Text and icons on sapphire and sapphire-strong. |
| `overdue` | `#b42318` | Overdue only: the one solid status chip (white text 6.6:1), the overdue card border and fleet tick; money going out. Never decorative. |
| `overdue-tint` | `#fdeceb` | Overdue row band and unmatched/open pill background (overdue text on it). |
| `available` | `#146c43` | Available chip text/icon on available-tint (5.5:1); money coming in. |
| `available-tint` | `#ddf3e6` | Available chip and Paid pill background. |
| `available-tick` | `#3aa675` | Available ticks in the fleet strip (graphic only, always beside a worded legend). |
| `rented` | `#2c3330` | Rented chip text/icon on rented-tint and rented ticks. Charcoal, so blue stays the action colour. |
| `rented-tint` | `#e3e7e5` | Rented chip background. |
| `repair` | `#9a4100` | Under-repair chip text/icon on repair-tint (5.7:1). |
| `repair-tint` | `#fcead9` | Under-repair chip background. |
| `repair-tick` | `#d9822b` | Under-repair ticks in the fleet strip. |
| `unavailable` | `#565d59` | Temporarily-unavailable chip text/icon; the chip also takes a dashed border. |
| `unavailable-tint` | `#eceeed` | Temporarily-unavailable chip background. |
| `unavailable-tick` | `#b9bac0` | Temporarily-unavailable ticks in the fleet strip. |
| `warning` | `#7a5000` | Not-found, expiring, admin-pending: text/icon on warning-tint (6.3:1). |
| `warning-tint` | `#fff1cc` | Warning band and pill background. |
| `focus` | `#1756a9` | 3px focus ring on paper and card. |
| `plate-ground` | `#f6c343` | The signature: the face of every number plate (PlateBadge, BrandMark) and the active rail/tab pill. Never a status, never a button, never a large area. |
| `plate-ink` | `#1b1f1d` | Text and frame on plate-ground (10.2:1). |

## Typography

Yaldevi for Sinhala/English words. Gemunu Libre for plates, money, counts, times and documented headings (token conflict F05). Weights 400 reading, 500 labels, 600 headings/actions. Bilingual English echoes use rt-en. Screen minimum 14px; print body 14px, fine print 12px. No uppercase styling. Letter-spacing conflict F06.

| Style | Token family | Size | Line height | Weight |
| --- | --- | --- | --- | --- |
| display | sans | 28px | 40px | 600 |
| title | sans | 22px | 32px | 600 |
| heading | sans | 18px | 28px | 600 |
| body | sans | 17px | 29px | 400 |
| body-desktop | sans | 16px | 27px | 400 |
| label | sans | 15px | 24px | 500 |
| caption | sans | 14px | 22px | 400 |
| plate | plate | 20px | 26px | 600 |
| figure | plate | 26px | 34px | 600 |

## Spacing

| Token | Value | Existing usage |
| --- | --- | --- |
| `space-1` | `4px` | Icon-to-label gap inside chips. |
| `space-2` | `8px` | Minimum gap between touch targets. |
| `space-3` | `12px` | Row padding; gap between cards on phones. |
| `space-4` | `16px` | Card padding; phone side margin. |
| `space-6` | `24px` | Gap between blocks on desktop. |
| `space-8` | `32px` | Gap between page sections; desktop page margin. |

## Radius

| Token | Value | Existing usage |
| --- | --- | --- |
| `radius-sm` | `6px` | Plate badge, fleet ticks. |
| `radius-md` | `12px` | Buttons, inputs, chips, notices, rail items. |
| `radius-lg` | `16px` | Cards, money blocks, sheets. |
| `radius-pill` | `999px` | Count badges and the phone centre action only. |

## Size

| Token | Value | Existing usage |
| --- | --- | --- |
| `touch-min` | `48px` | Minimum tap target. |
| `rail` | `128px` | Desktop navigation rail: icon above a visible label. |
| `topbar` | `68px` | Desktop and phone top bar height. |
| `nav-bottom` | `76px` | Phone tab bar with the raised centre action. |
| `thumb-row` | `64px` | Vehicle thumbnail in compact rows. |

## Shadow

| Token | Value | Existing usage |
| --- | --- | --- |
| `shadow-lift` | `0 6px 16px rgba(27,31,29,0.16)` | Only the phone centre action and open sheets. Cards use a border, never a shadow. |

## Layout and interaction

- Phone supported minimum: 360px. Source minimum 320px; guide acknowledges crowded cases there. One column, 16px margins, sticky PageHeader and BottomTabBar. Four labelled tabs; optional staff centre action; none for owner.
- Desktop: left sidebar 264px at >=1100px, 104px below; centered content up to 1600px. Stale --rail=128px must not silently become the implementation contract.
- Two-pane layout minimum documented as 1280px. Top bar compacts below 1000px of bar width. List rows stack below 720px; blocked panels below 340px.
- Tables scroll inside their container with headings/actions outside. Grids reflow; headings/actions and long values wrap.
- Cards: line border, no shadow; no nested cards. Lift shadow only for centre action and sheets. Focus: 3px blue ring, 2px offset.
- Recorded and reconciliation money states are distinct. Unmatched does not undo payment. Matched attribution is documented but optional in props (F15).
- Separate collections, drawer, reconciliation, held deposits, customer debt, final partner payable, provisional share and SNS earnings. No combined total.
- Partner views expose final amounts only. Day-close time remains Open. Corrections are dated adjustment lines.
- Disabled actions have a nearby BlockedPanel or Checklist; money/vehicle actions get persistent ConfirmationBlock feedback.

## Assets and content

Supplied SNS logo only: no redraw/recolour; once per screen and on printed documents. Whole model images without tint, crop or embedded data. 256px thumbnails and documented 512px hero images. Catalogue photos remain Proposed under CR-001. Extra vehicle family art does not add business scope.

44 supplied 3D icons: launcher/quick actions, empty states and confirmations. Line icons: 24px grid, 1.75px round stroke, currentColor, visible label; compact top-bar search is a documented exception. No new AI imagery generated.

Sinhala first; per-user English switch. Plain everyday language, verb actions, LKR with grouping and Western digits. Label sample values. Do not invent an earnings definition. Staff with access see full NIC/phone values. No GPS, payment integration, trust scores or automatic bank verification.

## Component documentation (verbatim extraction)

### AppHeader

Source: `design/design-system/components/AppHeader/README.md`

# AppHeader
The light desktop top bar. Left to right:

1. The page title and subtitle.
2. Search.
3. A "New rental" button.
4. The සිං / EN switch.
5. The signed-in person: an initials avatar, with name and role.

Decided by Dulan on 25 Oct 2026, together with the labelled sidebar (`NavRail`).

**Provide:**
- `title`, optional `subtitle`
- `searchHref` (link to the search screen) and optional `search` (the placeholder words). Without `searchHref`, `search` renders a plain input as before.
- `newHref`: the "New rental" link, optional `newLabel`
- `user`, `role`, `lang`, `onLang`, `showMark`

**Rules:**
- **"New rental" only for people who can start a rental,** and never inside the new-rental flow. Partners get neither search nor "New rental".
- **Search is on every owner and staff screen.** It opens the search screen (plate, name, NIC, phone or rental number), so it is never a decorative box.
- **When the bar is narrower than 1,100px** (a 1280 screen with the sidebar), the person shows as the initials avatar only. Name and role stay in its tooltip and for screen readers. At 1,100px and wider, name and role show beside it.
- **One primary button in the bar.** "New rental" is the only filled button; the page's own main action stays in the page.

Pattern references (Mobbin):
- [Shopify admin: search in the top bar, account at the right](https://mobbin.com/screens/a2704a6b-d772-46e4-b7e6-26653af6d44f)
- [Jobber: Create button kept in reach on every screen](https://mobbin.com/screens/9d13e7c9-3793-49e8-b1b8-016d669aec25)


### AttentionBar

Source: `design/design-system/components/AttentionBar/README.md`

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
    - **Open items:** unresolved differences, unmatched payments and morning-check mismatches.
    - **Waiting for admin:** staff requests and allocations only an admin can decide.
    - **Today's decisions:** decisions staff took with a reason, such as a waiver or an override.
- **It always counts the whole business**, even when a panel below is narrowed to one car.
- **Mobile:** a 2×2 grid, sticky under the header.

Pattern references (Mobbin):
- [DocuSign home — two large counts with labels ("Action required", "Waiting for others")](https://mobbin.com/screens/d15d340b-3c85-45bd-8c4f-add659823a6e)
- [Jobber home — workflow columns as labelled counts with sub-states](https://mobbin.com/screens/850e0dd4-ef8e-45a8-846d-c6545868509c)


### BlockedPanel

Source: `design/design-system/components/BlockedPanel/README.md`

# BlockedPanel
A four-part explanation placed beside any disabled or denied action: what is blocked, why, who can do it, and the next step, with an optional request button.

**Provide:** `what`, `why`, `who`, `next`, optional `actionLabel`/`onAction`, `lang`.

- **Show it inline next to the locked control.** A server denial uses the same panel as a page.
- **For a partner or another owner's record, say only "මෙය ඔබට බලන්න බැහැ · not available to you".** Never reveal that the record exists.
- **The request path is a button, not a hint.**

Pattern references (Mobbin):
- [WRITER — unavailable card with its reason written in place](https://mobbin.com/screens/269c7d1c-02b9-4d4a-92fb-75ed3817bbbc)
- [Mixpanel "You need permission" — explanation + Request access (a full page; SNS keeps the explanation beside the control instead)](https://mobbin.com/screens/8bc4ab67-6d62-4d1e-944c-05bc5bff956b)
- [Miro — approval dialog with "Requested by" / "For" stacks, one primary Approve and an info note](https://mobbin.com/screens/02eade30-1b52-4579-b5b5-9a7e2f724cf0)
- [Jobber permissions — plain-language permission levels](https://mobbin.com/screens/e84e6db5-7580-49e3-b8d3-dee483a2779c)


### BottomTabBar

Source: `design/design-system/components/BottomTabBar/README.md`

# BottomTabBar
The phone navigation: four tabs, each an icon above a visible label inside a pill that fills when active, plus an optional raised centre action for the most frequent job (staff: අලුත්, new rental).

**Provide:** `tabs` `[{icon, label, href, active, badge}]` and optional `fab` `{icon, label, href, active}`. The centre action always has its label under it. With `href` each tab is a real link; `onClick` still works in the app.

Every phone screen with tabs uses this component (39 screens, moved from hand-built bars on 25 Oct 2026).

- **Never icon-only.** Mercury's icon-only bar is the counter-example.
- **The owner gets:** වාහන · අවධානයට · මුදල් · අනුමැති · තවත් (Vehicles, Attention, Money, Approvals, More).
- **An employee gets:** වාහන · කුලී · අලුත් · ලාච්චුව · තවත් (Vehicles, Rentals, New, Drawer, More).

Pattern references (Mobbin):
- [Turo host "Your car" — icon + label rows, status card with a word and a one-sentence explanation, labelled bottom tabs](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)
- [Evernote — labelled bottom tabs and labelled action tiles](https://mobbin.com/screens/994d7f92-f1a5-44f8-9126-4a032d4bf71a)
- [Mercury — icon-only bottom tabs (counter-example: not used)](https://mobbin.com/screens/ddcbfcf1-b1c2-49c3-89e4-f68d768a7bf3)
- [Qantas — tile labels that wrap to two lines](https://mobbin.com/screens/e172e8f4-d9cf-438d-b3f4-5cae2e7c00f8)


### BrandMark

Source: `design/design-system/components/BrandMark/README.md`

# BrandMark
The SNS Rent Car logo: the yellow road "S" with the SNS RENT CAR wordmark, supplied by SNS on 25 Oct 2026.

**Provide:**
- optional `size`: `sm` (28px tall), default (36px), `lg` (56px, sign-in).
- optional `variant="mark"`: the yellow "S" alone, only where the full logo cannot fit (an app icon, a favicon). Never the mark alone in the app's own header or on paper.

**Rules:**
- **Use the supplied file, never a redrawing.** Don't recolour, stretch, rotate, outline or add effects. Don't rebuild it from type.
- **Light grounds only:** `paper`, `card` or white paper. Keep clear space of at least half its height on every side.
- **Place it once per screen:** top of the desktop rail, the phone top bar, the sign-in screen, and the head of every printed document.
- **Its yellow belongs to the logo.** It matches `plate-ground` closely; the rule that the plate yellow is used only on plates, the SNS mark and the active nav pill still stands.
- **Name in text stays as registered:** printed documents keep "S.N.S. Rent a Car · Reg. 1/4/140" under the logo.

Source: `E:\sns_fleet_managment_system\brand\logo\sns-logo-original.png` (1774 × 887, transparent). The Brand asset group holds a trimmed copy 720px wide and the "S" mark at 256px tall. In the app, point the bundle's `LOGO` map at the logo files.


### Button

Source: `design/design-system/components/Button/README.md`

# Button
Actions are verbs, with an icon plus a word, at least 48px tall.

**Provide:**
- `children`: the verb, in Sinhala by default
- optional `icon`
- `variant`: `primary` | `secondary` | `quiet` | `danger`
- `full` for full-width mobile actions
- `disabled` and `onClick`

**Rules:**
- **One primary button per screen.** On mobile it is full-width at the bottom.
- **Labels are verbs that name the result:** "අලුත් කුලියක්" (new rental), "ආපසු ගන්න" (receive return), "ගෙවීම සටහන් කරන්න" (record payment).
- **When the next step is missing, the button names it.** For example "Upload the signed agreement photo", rather than a vague "Continue".
- **Never leave a disabled button unexplained.** Put a `BlockedPanel` or a `Checklist` next to it. Phones have no hover, so tooltips don't count.
- **Sapphire is the only brand colour on buttons; status colours never fill a primary button.**

Pattern references (Mobbin):
- [Jobber create menu — every quick action is an icon plus a word](https://mobbin.com/screens/85be30de-6c55-4b32-a446-5caff51d4595)
- [Meetup — "Record transaction" / "Record expense" labelled buttons, type pills, "paid using cash (confirmation #)"](https://mobbin.com/screens/a93a0849-8e6a-42b1-81b8-4ad48ee00010)
- [Turo "Next steps" — checklist with "Required" tags; the button names the next missing item](https://mobbin.com/screens/735b3b29-a44f-4f3f-87ec-c7b7ccc56b0c)


### Checklist

Source: `design/design-system/components/Checklist/README.md`

# Checklist
The handover or return gate: each required item shows done (who · when) or missing ("Required"), and the main button names the next missing item.

**Provide:**
- `title` and `progressLabel`
- `items`, each with:
    - `state`: `done` | `missing` | `open`
    - `label`
    - `meta`: who and when, or the value
    - `tag`
    - `icon`
- `footer`: usually the primary `Button`

**Rules:**
- **The confirmed blocking items:** ID copy, licence copy, signed agreement photo, outgoing odometer, and reference-person documents when required.
- **An `open` item has no blocking rule decided yet.** For example accessories ("Blocks handover? — owner decision pending"). Never silently block or allow it.
- **One item per row, at least 64px tall.** Tapping a missing item opens the camera or upload.

Pattern references (Mobbin):
- [Turo "Next steps" — checklist with "Required" tags; the button names the next missing item](https://mobbin.com/screens/735b3b29-a44f-4f3f-87ec-c7b7ccc56b0c)
- [Grab Driver — one large labelled photo slot per document](https://mobbin.com/screens/d8cc7171-fe81-4e90-b8d2-e25fca401981)
- [Starling — what you have (ticks) vs what will be asked (arrows), as two labelled lists](https://mobbin.com/screens/353728f1-c56a-4096-9f8b-7312006f6efb)


### ConfirmationBlock

Source: `design/design-system/components/ConfirmationBlock/README.md`

# ConfirmationBlock
Persistent feedback after a money or vehicle action. It names what happened, who did it and when, the money effect and the next step. It stays on screen until dismissed. Toasts are too easy to miss for these actions.

**Provide:** `title`, `sentence`, `rows` `[{label, value}]`, `actions`, and optional `icon`: a 3D done icon (`done-handover`, `done-return`, `done-payment`, `done-drawer`, `done-cashout`, `done-day`, `done-sign-in`) that takes the check mark's place. The facts stay the same; there is no confetti.

- **Every balance that changed appears as its own row.**
- **Bank and card lines repeat their reconciliation state.** For example "not yet checked".
- **The affected card or row also updates, and a `HistoryLine` is added.**

Pattern references (Mobbin):
- [Jobber "Payment Recorded" — check in a soft circle, title, one sentence with the amount, "View receipt" + "Done"](https://mobbin.com/screens/ffc24d22-55cf-4e32-afa6-39c76c713375)
- [State Farm — confirmation as labelled field stacks (number, amount, to, date) plus a processing note](https://mobbin.com/screens/8aa6af94-32bb-4904-b4b6-843523772511)
- [DoorDash Dasher — confirmation toast with a check and a sentence](https://mobbin.com/screens/ef78ad87-a9ea-424c-a5b0-d96f877c5e94)


### EmptyState

Source: `design/design-system/components/EmptyState/README.md`

# EmptyState
What a list or result shows when it has nothing in it: a calm 3D icon with no accent, what is empty in plain words, what happens next, and at most one action.

**Provide:** `icon` (`empty-overdue`, `empty-approvals`, `empty-debts`, `empty-search`, `empty-expenses`, `empty-checks`, `offline`, or a section icon such as `rentals`), `title`, `body`, optional children for the action.

- **Empty is good news, said plainly:** "Nothing is waiting for approval", not a cheer.
- **Never hide a count of zero that matters** (for example 0 overdue on the attention bar stays visible there).


### FleetStrip

Source: `design/design-system/components/FleetStrip/README.md`

# FleetStrip
The whole fleet in one line: one rounded tick per car, in the fixed status order, with a worded legend and counts that filter the gallery.

**Provide:** `cars` `[{plate, status, warn}]`, `lang`, and `hrefs` `{overdue, available, rented, repair, unavailable}`: the list each legend entry opens. A status without an href shows as plain text, never as a dead link.

- **It is data, not decoration.** Thirty ticks are thirty cars, so the owner sees the shape of the day before reading a number.
- **Ticks never stand alone.** The legend below always names each status with icon, word and count.
- **A tick with a warning** (not found at the morning check) carries an amber inner ring.

Pattern references (Mobbin):
- [Polestar: one bold data graphic carrying the screen](https://mobbin.com/screens/2a951757-674c-4479-95a8-5fa820009c05)
- [Jobber home: workflow counts](https://mobbin.com/screens/850e0dd4-ef8e-45a8-846d-c6545868509c)


### GameIcon

Source: `design/design-system/components/GameIcon/README.md`

# GameIcon
One of the 44 SNS 3D icons: soft pearl miniatures with one accent per menu group (teal for cars and rentals, lavender for money, mauve for running SNS, none for today, search and empty states). Supplied by SNS on 25 Oct 2026 (`brand/icons/png-1024` in the project folder); the system uses 256px copies.

**Provide:** `name` (see the preview), `size` (`tile` 56px, default · `lg` 72px · `hero` 96px · or a number), optional `label` (alt text, only when no visible word sits next to it).

**Where they go, and only there:**
- **Launcher tiles and quick actions** (`LauncherTile`, `LauncherGrid`).
- **Empty states** (`EmptyState`): the calm, no-accent icons.
- **Done screens:** above or inside the `ConfirmationBlock` (its `icon` prop), never instead of the facts (who, when, amount).

**Never:** car status, money states, warnings, the sidebar, the phone tab bar or buttons. Those keep the line `Icon` set, whose meanings are fixed. No streaks, points, badges or scores for staff. No confetti. The accent colours live only inside the images; they are not UI colours.


### HistoryLine

Source: `design/design-system/components/HistoryLine/README.md`

# HistoryLine
One sentence per event: actor · what · record · amount, then an optional state pill, the reason in quotes, and the time.

**Provide:** `actor`, `action`, optional `target`, `amount`, `type` (a `StatePill` kind), `reason`, `time`, `lang`.

- **Name the actor every time.** System-generated events say "System".
- **Corrections read as old → new, with the requester and the approver.** The original record is never edited.
- **Staff see only their own lines** and lines on records they may open. Colleagues' amounts are hidden by default (an owner decision).

Pattern references (Mobbin):
- [7shifts activity log — actor, coloured verb chip with a word, object, time](https://mobbin.com/screens/8b845427-b403-4eb7-87c9-aa771a00d378)
- [Toggl audit log — "From → To" values for changes](https://mobbin.com/screens/2deef352-1f6b-4757-a4c9-dcce106b0e6a)
- [Deel payment history — "Initiated by: Manual · By [name]" column](https://mobbin.com/screens/2af37619-c01a-45c8-b29e-58e54b6e7e9b)


### Icon

Source: `design/design-system/components/Icon/README.md`

# Icon
The SNS line-icon set: 24px grid, 1.75px round stroke, drawn in `currentColor` so it takes the colour of the text beside it.

**Use:** `<Plate.Icon name="car" size={20} />`. Provide `name` (see the preview for every name) and optionally `size` and `title`.

- **Always pair an icon with a visible word.** Navigation, actions and statuses never rely on an icon alone. The client is new to software, and an icon by itself is a guess.
- **Without `title`** the icon is hidden from screen readers (decorative next to its label). Set `title` only when the icon stands alone inside a labelled control.
- **Meanings are fixed.** `clockAlert` = overdue, `check` = available or done, `key` = rented, `wrench` = under repair, `pause` = temporarily unavailable, `link` = matched (never a tick), `unlink` = unmatched, `lock` = finalised or locked, `eyeOff` = provisional (the partner cannot see it), `hourglass` = waiting, `question` = not found at the morning check.
- **`arrowLeft`** is the back arrow (used by `PageHeader`). Don't rotate `arrowRight` for it.
- **Don't** use emoji as status or icons (the proposal's ⏳ is replaced by `hourglass`).

Pattern references (Mobbin):
- [Jobber create menu — every quick action is an icon plus a word](https://mobbin.com/screens/85be30de-6c55-4b32-a446-5caff51d4595)
- [Evernote — labelled bottom tabs and labelled action tiles](https://mobbin.com/screens/994d7f92-f1a5-44f8-9126-4a032d4bf71a)
- [Mercury — icon-only bottom tabs (counter-example: not used)](https://mobbin.com/screens/ddcbfcf1-b1c2-49c3-89e4-f68d768a7bf3)


### LanguageSwitch

Source: `design/design-system/components/LanguageSwitch/README.md`

# LanguageSwitch
The "සිං | EN" toggle. Each option is written in its own script, and the choice is remembered for each person.

**Provide:** `lang` and `onChange`. Add `onLight` when it sits on white.

- **Sinhala is the default.** Printed documents choose their language separately, per document.

Pattern references: no Mobbin reference used; this follows the confirmed preference.


### LauncherTile

Source: `design/design-system/components/LauncherTile/README.md`

# LauncherTile and LauncherGrid
A tile that starts a job or opens a section: 3D icon (56px) over the Sinhala label, the English echo under it, an optional short note and count. `LauncherGrid` puts tiles under a group heading.

**Provide:** `LauncherGrid` `title`, `columns` (2, 3 or 4–5 on desktop), `items` `[{icon, label: 'සිංහල · English', href, sub, badge, badgeTone}]`.

**Used on:** 02.5 Owner · More (3 columns), 02.6 Staff · More (2 columns, with notes), staff home quick actions (2 columns on phones, 5 on desktop).

**Rules:**
- **Always a word under the icon.** Sinhala first, English below in the quieter voice.
- **Three or more columns** set labels at 14px (the minimum) so long Sinhala words fit whole.
- **A count** uses the same rule as the sidebar: red only for overdue.

Pattern references (Mobbin):
- [Grab home: 3D object per service tile](https://mobbin.com/screens/03a1e8f4-90df-4f9e-9469-a35baf68cdfc)
- [Careem services grid](https://mobbin.com/screens/b1559fe6-7770-40f7-b6a2-cf02f085e9dc)
- [Urban Company: object tiles with a label under each](https://mobbin.com/screens/63710c41-3195-4a78-8183-132fdeacd8e1)


### MoneyBlock

Source: `design/design-system/components/MoneyBlock/README.md`

# MoneyBlock
One kind of money per block, with a fixed label, a figure or a time-of-day state, optional lines, and a note saying what it includes and excludes.

**Provide:**
- `label` and `icon`
- `figure` (a number, in LKR) or a `state` sentence
- optional `lines` `[{label, amount, sign: 'in'|'out', total}]` and `pill` (a `StatePill`)
- `note`
- `alert` for an open difference

**The blocks, never added together:**
- Money received today
- Drawer
- Reconciliation
- Deposits held (not income)
- Customer debt
- Partner payable (finalised)
- Partner share (provisional, the partner cannot see it)
- SNS earnings ("definition pending owner decision")

**Rules:**
- **During the day, show "so far · not yet counted / not yet checked"**, not close-of-day-looking totals.
- **Never use the word "profit" (ලාභය).** Its definition is an open owner decision.
- **Refunds and expenses are separate lines.** A refund returns customer money; an expense is a cost.
- **Signs carry words:** "+ Cash in", "− Refunds". Colour is never the only cue.

Pattern references (Mobbin):
- [Upwork overview — money states (in progress, pending, available) side by side, each labelled, never summed](https://mobbin.com/screens/87c3379b-2f64-40fd-b0d6-bbf30afd8985)
- [Fresha daily sales — "payments collected" and "refunds paid" in separate columns, cash movement apart from sales](https://mobbin.com/screens/47e06b3c-bba2-49f8-b11c-e8d3be3d6084)
- [Square reconciliation — one-sentence verdict above a short waterfall (SNS does this manually, never automatically)](https://mobbin.com/screens/93f0333b-55c6-4b0f-9a0e-881c5498d490)
- [Meetup — "Record transaction" / "Record expense" labelled buttons, type pills, "paid using cash (confirmation #)"](https://mobbin.com/screens/a93a0849-8e6a-42b1-81b8-4ad48ee00010)


### NavRail

Source: `design/design-system/components/NavRail/README.md`

# NavRail
The desktop navigation: a 264px labelled sidebar (concept A, chosen 25 Oct 2026). The SNS logo sits at the top, then the items grouped by job. Settings sits at the bottom. "New rental", search, the language switch and the account live in the top bar (`AppHeader`), decided by Dulan on 25 Oct 2026.

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


### Notice

Source: `design/design-system/components/Notice/README.md`

# Notice
An inline message with an icon, a bold first line and a sentence: `info`, `warning` or `danger`.

**Provide:** `tone`, `title`, `children`.

- **Use it for rules the user must not miss at the moment they act.** Examples: an old-debt warning before choosing a car, or "stays paid" on an unmatched payment.
- **Danger is for overdue and money differences only.**

Pattern references (Mobbin):
- [Turo host "Your car" — icon + label rows, status card with a word and a one-sentence explanation, labelled bottom tabs](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)


### PageHeader

Source: `design/design-system/components/PageHeader/README.md`

# PageHeader
The phone page header: a back link, the page title (Sinhala · English) and a subtitle such as who and when. Added on 25 Oct 2026; every phone screen with a back arrow uses it (69 screens).

**Provide:** `backHref`, `title`, optional `subtitle`, `backLabel` (default "ආපසු · Back"), `numeric` (sets the title in the figure font, for rental numbers like R‑0218), and optional children for one action at the right.

**Rules:**
- **The back link is a real link** to the screen the person came from in the flow, always on the same device.
- **One line of title.** Long titles wrap rather than truncate; Sinhala first.
- **No tabs on flow screens.** Screens inside a flow (new rental, return, payment) have a back link and no tab bar; top-level screens have the tab bar and no back link.

Pattern references (Mobbin):
- [Turo host "Your car": back arrow, title and labelled content](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)


### PlateBadge

Source: `design/design-system/components/PlateBadge/README.md`

# PlateBadge
The registration number on a yellow plate face (`plate-ground`, `plate-ink`). It is the primary identifier of every vehicle, and the largest text on a vehicle card.

**Provide:** `plate`, and optional `size` (`sm` for rows, `lg` for headers).

- **Always show the plate wherever a vehicle appears.** That includes cards, rows, tasks, bills, settlements and history lines. Many SNS cars are similar white Wagon Rs, Everys and Priuses, so a photo or model alone does not identify a car.
- **Keep the plate exactly as written on the car.** Don't abbreviate or truncate it.

Pattern references (Mobbin):
- [Setel — vehicle card with the registration as headline, model underneath](https://mobbin.com/screens/bc22fcd8-ab06-41ea-ad15-c9869adf0f16)
- [Lloyds — vehicle page: large photo, renewal tiles (MOT, tax) with icon + label + date, dashed tiles for missing items](https://mobbin.com/screens/9f05b39a-3e76-488d-849d-81273fb6b96d)


### StatePill

Source: `design/design-system/components/StatePill/README.md`

# StatePill
States of money records: recorded, reconciliation, settlement, payout, pending decision and deposit. Each pill is an icon plus a word.

**Provide:**
- `kind`: `recorded` | `notChecked` | `matched` | `unmatched` | `resolved` | `open` | `provisional` | `finalised` | `paid` | `partPaid` | `pending` | `deposit`
- `lang`
- optional `by`: who and against what

**Rules:**
- **"Recorded" and reconciliation are two separate pills, side by side.** A payment entered by staff is never shown as verified.
- **"Matched" uses the `link` icon, never a tick, and always carries `by`**: who matched it, against what, and when. Nothing implies automatic bank checking. SNS has no bank or card integration.
- **"Provisional" is dashed with `eyeOff`** and sits beside the sentence "Partner ට තවම පේන්නේ නැහැ" (the partner cannot see this yet). "Finalised" is solid navy with `lock`.
- **A deposit is labelled "not income"** everywhere it appears.

Pattern references (Mobbin):
- [Stripe transactions — status tabs with counts; pills pair icon and word](https://mobbin.com/screens/13552fc2-7c1b-4e50-80e6-6166a7403a13)
- [Deel payment history — "Initiated by: Manual · By [name]" column](https://mobbin.com/screens/2af37619-c01a-45c8-b29e-58e54b6e7e9b)
- [Square reconciliation — one-sentence verdict above a short waterfall (SNS does this manually, never automatically)](https://mobbin.com/screens/93f0333b-55c6-4b0f-9a0e-881c5498d490)
- [Fresha earnings — dated adjustment lines and a separate "Paid" panel](https://mobbin.com/screens/be92ef92-e3fa-433a-8281-827c4e76f2c8)


### StatusChip

Source: `design/design-system/components/StatusChip/README.md`

# StatusChip
The vehicle status: colour + icon + word, in Sinhala by default, always in this order: Overdue, Available, Rented, Under repair, Temporarily unavailable.

**Provide:**
- `status`: `overdue` | `available` | `rented` | `repair` | `unavailable` | `retired`
- `lang`: `si` | `en`
- optional `detail`, such as "+3h 05m", "AC fault" or "back 25 Oct"
- optional `size="sm"` for rows

**Rules:**
- **Overdue is the only solid chip** (white on `overdue`). Every other status is a soft fill. Overdue therefore differs from Available by lightness (5.7:1), not by hue alone.
- **Overdue shows hours past the deadline, never a running fee.** Late charges are a staff decision.
- **"Available" claims only the record state.** If the morning check could not find the car, add a warning on the card. Don't change the chip.
- **The word "garage" is never used for Under repair.** It is reserved for the garage-day charge.
- The Sinhala labels are drafts for SNS review.

Pattern references (Mobbin):
- [Square item library — thumbnail rows with text + icon status pills and filter counts](https://mobbin.com/screens/78f2c018-e2c9-440c-8b5c-e631b2539163)
- [Airtable gallery — photo on top, labelled fields, status pill under its label](https://mobbin.com/screens/0e9a986f-01cd-4332-ac89-ba5c36853ae3)
- [Turo host "Your car" — icon + label rows, status card with a word and a one-sentence explanation, labelled bottom tabs](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)
- [Stripe transactions — status tabs with counts; pills pair icon and word](https://mobbin.com/screens/13552fc2-7c1b-4e50-80e6-6166a7403a13)


### VehicleCard

Source: `design/design-system/components/VehicleCard/README.md`

# VehicleCard
The gallery card: model image (or a photo), status chip over the photo corner, a large plate, then model and ownership, any warning, and one "next event" line. Tapping it opens the vehicle.

**Provide:**
- `plate`, `model`, `status`
- optional `statusDetail` and `next` (one line, such as "Return · Fri 23 Oct 8:00")
- `partner` (boolean) and `partnerName`. Show the name to owner and admin only.
- optional `photo` (URL). Without one, the card shows the model's `VehicleImage`
- optional `warning` `{label, icon}`
- `canAddPhoto` (true for admins only; shows "Photo නැහැ · එකතු කරන්න" when there is no photo) and `onClick`

The car's own photo is optional and admin-managed: system design §4.2, Proposed under CR-001.

**Rules:**
- **Overdue cards get a 2px `overdue` border** and sort first.
- **One warning line at most.** It is always a word plus an icon, such as "not found at 7:30 check".
- **No prices, ratings or decorative badges** on the card.
- **Grid: about 6 per row on desktop and 2 on mobile.** Use `VehicleRow` when more than about 12 cars must fit on one screen.

Pattern references (Mobbin):
- [Turo — large photo cards in a grid](https://mobbin.com/screens/137de559-4e47-4738-8cfa-b026f91e108f)
- [GetYourGuide — photo cards with a label chip laid over the photo corner](https://mobbin.com/screens/5fedc64d-a918-40e7-ab60-d98e45425ec7)
- [Airtable gallery — photo on top, labelled fields, status pill under its label](https://mobbin.com/screens/0e9a986f-01cd-4332-ac89-ba5c36853ae3)
- [Setel — vehicle card with the registration as headline, model underneath](https://mobbin.com/screens/bc22fcd8-ab06-41ea-ad15-c9869adf0f16)
- [Lloyds — vehicle page: large photo, renewal tiles (MOT, tax) with icon + label + date, dashed tiles for missing items](https://mobbin.com/screens/9f05b39a-3e76-488d-849d-81273fb6b96d)


### VehicleImage

Source: `design/design-system/components/VehicleImage/README.md`

# VehicleImage
The car's model image from the SNS vehicle PNG pack v2: a soft 3D car seen from the front three-quarter, on a transparent background. Every car on every screen shows it.

**Provide:**
- `model`: the model name as SNS writes it ("Wagon R", "Alto", "Every", "Prius", "Axio", "Spacia"). Anything else shows the generic car.
- `size`: `lg` for heroes wider than 128 CSS px (512px file); leave it out for thumbnails, rows and cards (256px file).
- `label`: only when no visible word next to it names the car. Otherwise the image is decorative (`alt=""`).
- **Give its slot a size.** The image fills its slot (`width: 100%; height: 100%`, `object-fit: contain`), so the slot or its parent needs a height. The whole car is always visible; it is never cropped.

**Rules:**
- **The plate stays the identifier.** The image only helps staff spot the kind of car.
- **Never tint, recolour, flip or crop it,** and never put a status, price, plate or text on it. Those belong beside it.
- **The pack's colour is not the car's colour.** Every car shows the same pearl silver-grey; the system design has no car colour field.
- **Thumbnails at least 56 × 44 px,** on `sunken` or `card`. Tall cars (Wagon R, Spacia, Every) fill the height first.
- **Images for families SNS does not run yet** (Hustler, van, SUVs, pickup, station wagon, premium sedan) exist in the pack for later. Showing them does not add a car type, price or rule.

| Model | Pack image |
| --- | --- |
| Wagon R | `wagon-r` · tall hatchback |
| Alto | `alto` · compact hatchback |
| Spacia | `spacia` · mini MPV |
| Every | `every` · microvan |
| Prius | `prius` · liftback |
| Axio | `axio` · sedan |
| anything else | `generic` |

Source: `E:\sns_fleet_managment_system\brand\vehicles` (v2, 14 images at 1024, 256, 128 and 64 px; prompts and checks in its `manifest.json`). Here, 256px files and 512px copies made from the 1024px export are kept in the Vehicles asset group. In the app, serve the pack's own files and point the bundle's `VIMG` map at them.

Pattern reference (Mobbin):
- [Uber — Choose a ride: one soft 3D car image per ride type, beside the name and price](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea)


### VehicleRow

Source: `design/design-system/components/VehicleRow/README.md`

# VehicleRow
The compact vehicle line: thumbnail, plate, model, next event and status chip. Use it for pickers, long lists and the desktop board when the gallery would scroll too far.

**Provide:** the same data as `VehicleCard`.

- **Keep the thumbnail.** The confirmed preference is photo plus plate together, even in compact lists.
- **Rows are at least 72px tall**, and the whole row is the tap target.

Pattern references (Mobbin):
- [Square item library — thumbnail rows with text + icon status pills and filter counts](https://mobbin.com/screens/78f2c018-e2c9-440c-8b5c-e631b2539163)


### VehicleSilhouette

Source: `design/design-system/components/VehicleSilhouette/README.md`

# VehicleSilhouette
Superseded by `VehicleImage` on 25 Oct 2026. Given a `model`, it now shows that model's image; the old line drawing (`hatch`, `van`, `sedan`) appears only when no model is known at all. New work uses `VehicleImage`.

**Provide:** `model` (preferred) or `body`.

- **The plate remains the identifier.**
- **Never draw a real manufacturer's logo or badge on it.**


## TypeScript contracts (verbatim extraction)

```typescript
import type * as React from 'react';

export type Lang = 'si' | 'en';
export type VehicleStatus = 'overdue' | 'available' | 'rented' | 'repair' | 'unavailable' | 'retired';
export type MoneyState = 'recorded' | 'notChecked' | 'matched' | 'unmatched' | 'resolved' | 'open' | 'provisional' | 'finalised' | 'paid' | 'partPaid' | 'pending' | 'deposit';
export type IconName = 'car' | 'key' | 'check' | 'clockAlert' | 'clock' | 'wrench' | 'pause' | 'link' | 'unlink' | 'lock' | 'eyeOff' | 'hourglass' | 'banknote' | 'drawer' | 'alert' | 'info' | 'question' | 'flag' | 'stamp' | 'plus' | 'camera' | 'phone' | 'search' | 'home' | 'clipboard' | 'users' | 'handshake' | 'wallet' | 'chart' | 'settings' | 'arrowRight' | 'arrowLeft' | 'returnCar' | 'file' | 'x' | 'calendar' | 'calendarPlus' | 'gauge' | 'fuel' | 'pen' | 'idcard' | 'more' | 'swap' | 'receipt' | 'box';

/** Line icon on a 24px grid, drawn in currentColor. Always paired with a visible word. */
export interface IconProps { name: IconName; size?: number; title?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

/** Vehicle status: colour + icon + word. Overdue is the only solid chip. */
export interface StatusChipProps { status: VehicleStatus; lang?: Lang; detail?: string; size?: 'sm' | 'md'; label?: string; icon?: IconName; className?: string }
export declare function StatusChip(props: StatusChipProps): React.ReactElement;

/** Money record state. Recorded and reconciliation are separate pills; Matched always carries `by`. */
export interface StatePillProps { kind: MoneyState; lang?: Lang; by?: string; label?: string; className?: string }
export declare function StatePill(props: StatePillProps): React.ReactElement;

/** Registration number: the primary vehicle identifier. */
export interface PlateBadgeProps { plate: string; size?: 'sm' | 'lg'; lang?: Lang; className?: string }
export declare function PlateBadge(props: PlateBadgeProps): React.ReactElement;

/** The model's image from the SNS vehicle PNG pack v2. Fills its slot; give the slot a size. Unknown models show the generic car. */
export type VehicleFamily = 'wagon-r' | 'alto' | 'spacia' | 'every' | 'prius' | 'axio' | 'hustler' | 'van' | 'mid-suv' | 'suv' | 'pickup' | 'station-wagon' | 'premium-sedan' | 'generic';
export interface VehicleImageProps { model: string; size?: 'sm' | 'lg'; label?: string; className?: string }
export declare function VehicleImage(props: VehicleImageProps): React.ReactElement;
export declare function vehicleKey(model: string): VehicleFamily;

/** Superseded by VehicleImage: with `model` it shows the model's image; the line drawing only when no model is known. */
export interface VehicleSilhouetteProps { model?: string; size?: 'sm' | 'lg'; body?: 'hatch' | 'van' | 'sedan'; label?: string; className?: string }
export declare function VehicleSilhouette(props: VehicleSilhouetteProps): React.ReactElement;

interface VehicleData { plate: string; model: string; status: VehicleStatus; statusDetail?: string; next?: string; partner?: boolean; partnerName?: string; photo?: string; body?: 'hatch' | 'van' | 'sedan'; lang?: Lang; onClick?: () => void; className?: string }
/** Gallery card: photo + status over the corner, large plate, model · ownership, one warning, one next-event line. */
export interface VehicleCardProps extends VehicleData { warning?: { label: string; icon?: IconName }; canAddPhoto?: boolean }
export declare function VehicleCard(props: VehicleCardProps): React.ReactElement;
/** Compact row: thumbnail, plate, model, next event, status chip. */
export interface VehicleRowProps extends VehicleData {}
export declare function VehicleRow(props: VehicleRowProps): React.ReactElement;

/** A verb with an icon, 48px tall. One primary per screen. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; icon?: IconName; full?: boolean }
export declare function Button(props: ButtonProps): React.ReactElement;

/** Sticky labelled counts: Overdue · Open items · Waiting for admin · Today's decisions. */
export interface AttentionItem { label: string; count: number; tone?: 'overdue' | 'warning' | 'info' | 'neutral'; icon?: IconName; href?: string; onClick?: () => void }
export interface AttentionBarProps { items: AttentionItem[]; className?: string }
export declare function AttentionBar(props: AttentionBarProps): React.ReactElement;

/** One kind of money per block, never summed with another block. */
export interface MoneyLine { label: string; amount: number | string; sign?: 'in' | 'out'; total?: boolean }
export interface MoneyBlockProps { label: string; icon?: IconName; figure?: number | null; state?: string; lines?: MoneyLine[]; note?: string; pill?: React.ReactNode; alert?: boolean; children?: React.ReactNode; className?: string }
export declare function MoneyBlock(props: MoneyBlockProps): React.ReactElement;

/** Handover/return gate. `open` = an item whose blocking rule is an undecided owner question. */
export interface ChecklistItem { state: 'done' | 'missing' | 'open'; label: string; meta?: string; tag?: string; icon?: IconName; action?: React.ReactNode }
export interface ChecklistProps { title: string; items: ChecklistItem[]; progressLabel?: string; footer?: React.ReactNode; className?: string }
export declare function Checklist(props: ChecklistProps): React.ReactElement;

/** Four-part explanation beside a disabled or denied action: what, why, who can, next step. */
export interface BlockedPanelProps { what: string; why: string; who: string; next: string; actionLabel?: string; actionIcon?: IconName; onAction?: () => void; icon?: IconName; lang?: Lang; className?: string }
export declare function BlockedPanel(props: BlockedPanelProps): React.ReactElement;

/** Persistent feedback after a money or vehicle action. */
export interface ConfirmationBlockProps { icon?: GameIconName; title: string; sentence?: string; rows?: { label: string; value: React.ReactNode }[]; actions?: React.ReactNode; className?: string }
export declare function ConfirmationBlock(props: ConfirmationBlockProps): React.ReactElement;

/** One event as a sentence: actor · what · record · amount, optional state pill, reason, time. */
export interface HistoryLineProps { actor: string; action: string; target?: string; amount?: number; type?: MoneyState; reason?: string; time: string; lang?: Lang; className?: string }
export declare function HistoryLine(props: HistoryLineProps): React.ReactElement;

/** Inline message: info, warning or danger. */
export interface NoticeProps { tone?: 'info' | 'warning' | 'danger'; title?: string; icon?: IconName; children?: React.ReactNode; className?: string }
export declare function Notice(props: NoticeProps): React.ReactElement;

/** "සිං | EN" switch; each option in its own script. `onLight` for the light top bar. */
export interface LanguageSwitchProps { lang?: Lang; onChange?: (lang: Lang) => void; onLight?: boolean }
export declare function LanguageSwitch(props: LanguageSwitchProps): React.ReactElement;

/** The SNS Rent Car logo (supplied file). `variant="mark"`: the yellow "S" alone, for app icons only. */
export interface BrandMarkProps { size?: 'sm' | 'lg'; variant?: 'full' | 'mark'; className?: string }
export declare function BrandMark(props: BrandMarkProps): React.ReactElement;

/** Light desktop top bar: page title + subtitle, search (a link to the search screen), New rental, language switch, initials (+ name and role at 1,100px and wider). */
export interface AppHeaderProps { title: string; subtitle?: string; search?: string; searchHref?: string; newHref?: string; newLabel?: string; showMark?: boolean; user?: string; role?: string; lang?: Lang; onLang?: (lang: Lang) => void; className?: string }
export declare function AppHeader(props: AppHeaderProps): React.ReactElement;

/** Desktop navigation: 264px labelled sidebar grouped by job; logo on top, Settings at the bottom. Trimmed by permission. New rental lives in AppHeader. */
export interface NavItem { icon: IconName; label: string; active?: boolean; badge?: number | string; badgeTone?: 'overdue' | 'waiting'; badgeHref?: string; group?: 0 | 1 | 2 | 3 | 9; en?: string; href?: string; onClick?: () => void }
export interface NavRailProps { items: NavItem[]; newHref?: string; newLabel?: string; footer?: React.ReactNode; className?: string }
export declare function NavRail(props: NavRailProps): React.ReactElement;

/** Whole fleet as one tick per car, ordered overdue → available → rented → repair → unavailable, with a worded, linked legend. `warn` rings a tick (e.g. not found at the morning check). */
export interface FleetStripProps { cars: { plate: string; status: Exclude<VehicleStatus, 'retired'>; warn?: boolean }[]; hrefs?: Partial<Record<Exclude<VehicleStatus, 'retired'>, string>>; lang?: Lang; label?: string; className?: string }
export declare function FleetStrip(props: FleetStripProps): React.ReactElement;

/** Phone navigation: 4 tabs, icon above a visible label; optional raised centre action (`fab`) for the one most frequent task. */
export interface BottomTabBarProps { tabs: NavItem[]; fab?: { icon?: IconName; label: string; href?: string; active?: boolean; onClick?: () => void }; className?: string }
export declare function BottomTabBar(props: BottomTabBarProps): React.ReactElement;

/** One of the 44 SNS 3D icons. Only on launcher tiles, quick actions, empty states and done screens. */
export type GameIconName = 'activity-log' | 'add-customer' | 'all-cars' | 'approvals' | 'bank-card-check' | 'close-day' | 'count-drawer' | 'customers' | 'done-cashout' | 'done-day' | 'done-drawer' | 'done-handover' | 'done-payment' | 'done-return' | 'done-sign-in' | 'empty-approvals' | 'empty-checks' | 'empty-debts' | 'empty-expenses' | 'empty-overdue' | 'empty-search' | 'expense' | 'extend-rental' | 'flag-customer' | 'handover' | 'maintenance' | 'morning-check' | 'my-payslip' | 'new-rental' | 'offline' | 'partner-cashouts' | 'partner-owners' | 'partner-statement' | 'payroll' | 'print-document' | 'ready-to-start' | 'receive-return' | 'received-by-staff' | 'record-payment' | 'rentals' | 'reports' | 'search' | 'settings' | 'swap-car';
export interface GameIconProps { name: GameIconName; size?: 'tile' | 'lg' | 'hero' | number; label?: string; className?: string }
export declare function GameIcon(props: GameIconProps): React.ReactElement | null;
export interface LauncherTileProps { icon: GameIconName; label: string; href?: string; sub?: string; badge?: number | string; badgeTone?: 'overdue' | 'waiting'; onClick?: () => void; className?: string }
export declare function LauncherTile(props: LauncherTileProps): React.ReactElement;
export interface LauncherGridProps { title?: string; columns?: number; items: LauncherTileProps[]; className?: string }
export declare function LauncherGrid(props: LauncherGridProps): React.ReactElement;
export interface EmptyStateProps { icon?: GameIconName; title: string; body?: string; children?: React.ReactNode; className?: string }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

/** Phone page header: back link, title (Sinhala · English), subtitle, optional action. */
export interface PageHeaderProps { backHref?: string; backLabel?: string; title: string; subtitle?: string; numeric?: boolean; children?: React.ReactNode; className?: string }
export declare function PageHeader(props: PageHeaderProps): React.ReactElement;

declare global {
  interface Window {
    Plate: {
      Icon: typeof Icon; StatusChip: typeof StatusChip; StatePill: typeof StatePill; PlateBadge: typeof PlateBadge; VehicleSilhouette: typeof VehicleSilhouette; VehicleImage: typeof VehicleImage; vehicleKey: typeof vehicleKey;
      VehicleCard: typeof VehicleCard; VehicleRow: typeof VehicleRow; Button: typeof Button; AttentionBar: typeof AttentionBar; MoneyBlock: typeof MoneyBlock;
      Checklist: typeof Checklist; BlockedPanel: typeof BlockedPanel; ConfirmationBlock: typeof ConfirmationBlock; HistoryLine: typeof HistoryLine; Notice: typeof Notice;
      AppHeader: typeof AppHeader; LanguageSwitch: typeof LanguageSwitch; NavRail: typeof NavRail; FleetStrip: typeof FleetStrip; BrandMark: typeof BrandMark; BottomTabBar: typeof BottomTabBar; PageHeader: typeof PageHeader; GameIcon: typeof GameIcon; LauncherTile: typeof LauncherTile; LauncherGrid: typeof LauncherGrid; EmptyState: typeof EmptyState;
      formatLKR: (n: number) => string;
    };
  }
}

```