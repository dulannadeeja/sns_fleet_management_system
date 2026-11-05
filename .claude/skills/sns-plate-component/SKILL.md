---
name: sns-plate-component
description: Add or change a Plate design-system component and its typed React port in the app, keeping design-system/ (the master), the canvas copy and app/src/ui in step. Use when a screen needs a component that does not exist, or a component's look or props change.
paths:
  - "design-system/**"
  - "app/src/ui/**"
---

# Plate components

`design-system/` is the master (rank 4). The app's `app/src/ui/` is a typed port with the same names and props; it never invents its own look.

## Change or add a component
1. **Design system first.** Update `design-system/components/bundle.js` and `bundle.css`, the props in `components/index.d.ts`, and `components/<Name>/README.md` (when and how to use it). Colours, type and spacing only from `tokens.json`/`tokens.css`. Follow `brand/guidebook/` (language, money on screen, icons).
2. **Canvas copy:** the post-edit hook runs `node scripts/sync-design-copy.mjs`; check it reported the copy updated.
3. **Viewer:** open `design-system/index.html` to see it; refresh the claude.ai design system "SNS Design System · Plate" from the repository.
4. **Screens** that use it: re-render them (**sns-screen-update**).
5. **App port** (`app/src/ui/<Name>/`): a TypeScript React component with the same name and props as `index.d.ts`, its CSS module using the tokens, and a test for its states. A build check fails when the app's tokens differ from `design-system/tokens.json`.

## Never
- A local restyle of a component inside a screen or a page.
- A new colour, font size or spacing value outside `tokens.json`.
