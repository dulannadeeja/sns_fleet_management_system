# 02 · Colour

The plate yellow (`plate-ground`, `plate-ink`) is the signature and is covered in [01 Identity](01-identity.md). Action blue and the status colours are below.

- **Neutrals do most of the work.** `paper` is the page, `card` every surface you read or tap, `sunken` photo frames and read-only fields. `ink` (on paper 14.7:1) and `ink-muted` (6.9:1) are the text.
- **Action blue (`sapphire`) is for doing things:** the primary button, links and the focus ring. It never marks a status.
- **Status colours outrank both.** Each status is a tint with dark text, plus its icon and word.
    - **Overdue is the only solid chip** (white on `overdue`).
    - **Temporarily unavailable** also takes a dashed border, so it is never confused with Rented.
- **Fleet ticks** use the brighter `*-tick` colours; never without the worded legend.
- **Money signs:** received in `available`, going out in `overdue`, always with + or − and a word.
- **Focus ring:** 3px `focus` with a 2px offset.

## Colour tokens

Values below are copied from `design-system/tokens.json`. If they ever differ, `tokens.json` wins; fix this table in the same commit.

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#eef1f0` | Page ground: a cool mist grey. Not cream; calm in office light and holds up outdoors on phones. |
| `card` | `#ffffff` | Cards, rows, sheets, the nav rail, the top bar and the phone tab bar. |
| `sunken` | `#e4e9e7` | Photo frames, read-only fields, segmented-control track, quiet notices. |
| `line` | `#d6dcd9` | Dividers and card borders (decorative; never the only boundary of a control). |
| `line-strong` | `#78827d` | Input and secondary-button borders (3.97:1 on card). |
| `ink` | `#1b1f1d` | Text and figures on paper and card; also the text on a yellow plate (10.2:1 on plate-ground). |
| `ink-muted` | `#4b5450` | Secondary text and metadata: 6.9:1 on paper, 7.8:1 on card. |
| `sapphire` | `#1756a9` | Action blue: primary buttons, links, focus ring. White on it 7.1:1. Never a status colour. (The token name is kept so components stay compatible.) |
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
