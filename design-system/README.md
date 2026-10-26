# SNS Rent Car · Plate design system

The tokens and components for the SNS Rent Car management website, master copy. Requirements and business rules live in `SNS_SYSTEM_DESIGN.md` and win over anything here. Brand and visual rules (colour use, type, language, icons, vehicle images, layout, money on screen, printed documents) live in `brand/guidebook/`; this folder is how those rules are built.

The claude.ai design system "SNS Design System · Plate" (https://claude.ai/artifact/3iqJRN9jkgBAGqvGSx7RK4) is a viewer. Change the files here first, then refresh the viewer.

## See every component

Open `index.html` in a browser (double-click it). It draws every component with sample data. Everything it loads is in this repository, so it works offline and needs no install.

## What is here

| Path | What it is |
| --- | --- |
| `tokens.json` | Every token: colour, type, spacing, radius, size, shadow. The one place token values are set. |
| `tokens.css` | The same tokens as CSS custom properties. Generated from `tokens.json`; when a token changes, update both in the same commit. |
| `fonts.css` | `@font-face` rules for Yaldevi and Gemunu Libre, loading the files in `../fonts/`. |
| `components/bundle.js` | All components as one classic script. It assigns `window.Plate` and needs React 18 and ReactDOM 18 loaded first. |
| `components/bundle.css` | Component styles. Its first line also imports the fonts from Google Fonts; offline, `fonts.css` supplies them. |
| `components/index.d.ts` | Props for every component, as TypeScript types. |
| `components/<Name>/README.md` | When and how to use each component. |
| `assets/` | Image copies the components use: `brand/` (logo), `icons-256/` (SNS 3D icons), `vehicles-512/` (vehicle images). The originals are in `../brand/`. |
| `vendor/` | React 18.3.1 and ReactDOM 18.3.1 production builds, with their MIT licence. |
| `index.html` | The component viewer. |
| `design-system.json` | The index the claude.ai viewer reads. Not used by the repository. |

## Use it in a page

Image paths inside the bundle are written from the repository root (`design-system/assets/…`, `brand/vehicles/…`). A page outside the root either sets `<base href>` to the root, as `index.html` does, or uses a bundle copy with its paths prefixed, as `screens/canvas/ds/plate/` does.

```html
<base href="../">  <!-- the repository root, relative to this page -->
<link rel="stylesheet" href="design-system/fonts.css">
<link rel="stylesheet" href="design-system/tokens.css">
<link rel="stylesheet" href="design-system/components/bundle.css">
<script src="design-system/vendor/react-18.3.1.production.min.js"></script>
<script src="design-system/vendor/react-dom-18.3.1.production.min.js"></script>
<script src="design-system/components/bundle.js"></script>
<script>
  const { PlateBadge, StatusChip } = window.Plate;
  // React.createElement(PlateBadge, { plate: 'CBH-4521' })
</script>
```

## Components

AppHeader, AttentionBar, BlockedPanel, BottomTabBar, BrandMark, Button, Checklist, ConfirmationBlock, EmptyState, FleetStrip, GameIcon, HistoryLine, Icon, LanguageSwitch, LauncherTile and LauncherGrid, MoneyBlock, NavRail, Notice, PageHeader, PlateBadge, StatePill, StatusChip, VehicleCard, VehicleImage, VehicleRow, VehicleSilhouette (superseded by VehicleImage). Also `Plate.formatLKR(n)` and `Plate.vehicleKey(model)`.

## When you change something here

1. Change the files here (the brand rule first, in `brand/guidebook/`, if the change is a rule).
2. Open `index.html` and check the component still draws.
3. Copy `tokens.json`, `tokens.css`, `components/bundle.js` and `components/bundle.css` to `screens/canvas/ds/plate/`, with the image path prefix described in `screens/README.md`.
4. Refresh the claude.ai viewer, and name it in the commit body.
