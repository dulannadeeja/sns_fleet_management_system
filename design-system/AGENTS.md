# design-system/: the Plate design system (rank 4, master)

Tokens, components and previews. The claude.ai design system "SNS Design System · Plate" (https://claude.ai/artifact/3iqJRN9jkgBAGqvGSx7RK4) is a viewer: change the files here, then refresh it.

**Plate in one line:** cool grey ground `#eef1f0`; the Sri Lankan number plate is the signature (yellow plate face `#f6c343` with ink `#1b1f1d`, only on plates, the SNS mark and the active nav pill); action blue `#1756a9`; Yaldevi for text, Gemunu Libre for plates, money and headings; status colours keep their meaning and never stand alone.

## Rules
- Visual rules come from `brand/guidebook/`; business rules from the system design. A component never adds a rule.
- `tokens.json` is where token values are set; `tokens.css` says the same thing. Change both in one commit.
- Changing `tokens.*` or `components/bundle.*` regenerates `screens/canvas/ds/plate/` (the post-edit hook runs `node scripts/sync-design-copy.mjs`). Never edit that copy.
- Each component keeps `components/<Name>/README.md` (when and how to use it) and its props in `components/index.d.ts`. The app ports these exactly (skill: sns-plate-component).
- `vendor/` holds React 18.3.1 for the offline viewer; don't upgrade it casually.

## Checks
- `node scripts/sync-design-copy.mjs --check` and `node scripts/audit.mjs` from the repository root.
- Open `index.html` in a browser and look at every component you changed.
- Re-render the screens that use a changed component: `node screens/tools/render.mjs --all` when unsure.
