# brand/: the brand guidebook and source brand files (rank 4)

- `guidebook/` holds the visual and language rules (identity, colour, type, language and voice, icons, vehicle imagery, layout, money on screen, printed documents). Start at `guidebook/README.md`.
- `vehicles/`, `icons/` and the SNS logo are the originals. `design-system/assets/` holds the copies the components use; replace a copy only from these originals.
- A guidebook rule never overrides the system design. When a visual rule changes, update `design-system/` and the affected screens in the same change (skill: sns-change-control).
- User-facing wording follows `guidebook/04-language-and-voice.md`.

## Checks
- `node scripts/audit.mjs` (links and headings in the guidebook).
