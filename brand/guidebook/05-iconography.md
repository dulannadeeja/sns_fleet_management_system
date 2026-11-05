# 05 · Iconography

## Line icons

- **The `Icon` set:** 24px grid, **1.75px round stroke**, drawn in `currentColor`. These are original drawings, except `wrench`, which follows the open-licence Lucide shape.
- **Every icon appears with a visible word.** No icon-only navigation.
- **Fixed meanings:**
    - `clockAlert` overdue · `check` available or done · `key` rented · `wrench` under repair · `pause` temporarily unavailable
    - `link` matched · `unlink` unmatched · `lock` finalised · `eyeOff` provisional · `hourglass` waiting · `question` not found at the morning check

## SNS 3D icons

- **SNS 3D icons (`GameIcon`, 44, supplied by SNS on 25 Oct 2026):** soft pearl objects in the vehicle pack's style, each with one accent from its menu group (teal cars and rentals, lavender money, mauve running SNS; none for today, search and empty states). The accents live only inside the images and are not UI colours.
    - **Only on:** launcher tiles and quick actions (`LauncherTile`, 56px), empty states (`EmptyState`, 96px, no accent) and done screens (`ConfirmationBlock icon`, 72–96px).
    - **Never on:** statuses, money states, warnings, navigation or buttons, which keep the line icons. No streaks, points, badges or scores for staff, no confetti.

**Files:** originals in `brand/icons/png-1024/` (see `brand/icons/README.md`); 256px copies in `design-system/assets/icons-256/`.
