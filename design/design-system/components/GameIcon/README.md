# GameIcon
One of the 44 SNS 3D icons: soft pearl miniatures with one accent per menu group (teal for cars and rentals, lavender for money, mauve for running SNS, none for today, search and empty states). Supplied by SNS on 25 Oct 2026 (`brand/icons/png-1024` in the project folder); the system uses 256px copies.

**Provide:** `name` (see the preview), `size` (`tile` 56px, default · `lg` 72px · `hero` 96px · or a number), optional `label` (alt text, only when no visible word sits next to it).

**Where they go, and only there:**
- **Launcher tiles and quick actions** (`LauncherTile`, `LauncherGrid`).
- **Empty states** (`EmptyState`): the calm, no-accent icons.
- **Done screens:** above or inside the `ConfirmationBlock` (its `icon` prop), never instead of the facts (who, when, amount).

**Never:** car status, money states, warnings, the sidebar, the phone tab bar or buttons. Those keep the line `Icon` set, whose meanings are fixed. No streaks, points, badges or scores for staff. No confetti. The accent colours live only inside the images; they are not UI colours.
