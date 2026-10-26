# SNS Rent Car · screens

The screen designs for the SNS Rent Car management website, master copy. Requirements and business rules live in `SNS_SYSTEM_DESIGN.md`; the screens show sample data and labelled examples, and never add a rule. Brand and visual rules are in `brand/guidebook/`; the components they use are in `design-system/`.

The claude.ai canvas "SNS Rent Car · Plate" (https://claude.ai/artifact/XPpVE6ZafYtyG4gRZukHYz) is a viewer. Change the files here first, then refresh the canvas.

## What is here

| Path | What it is |
| --- | --- |
| `previews/html/` | One static HTML page per screen. Open any file in a browser; no tools needed. |
| `previews/png/` | One PNG per screen, for quick review. |
| `previews/preview-report.json` | The render check for each screen: width, height, missing or broken images. |
| `canvas/` | The screen source (`*.dc.html`), the canvas layout (`canvas.json`) and `support.js`, as used by the claude.ai canvas. |
| `canvas/ds/plate/` | A copy of the design-system tokens and bundle that the canvas pages load. It is generated from `design-system/`: never edit it by hand. |
| `blob-map.json` | Maps claude.ai upload ids to the image files in this repository. |

## Names

Every screen has a desktop and a phone version. Screen names follow `NN.n Name · Device`; files follow `NN-Module-Screen-Desktop` and `NN-Module-Screen-Phone`. Links stay on the same device.

Modules: 01 Start, 02 Home, 03 Morning check, 04 Cars, 05 New rental, 06 Rentals, 07 Return, 08 Customers, 09 Money, 10 Approvals, 11 Partners, 12 Maintenance, 13 Payroll, 14 Reports, 15 Settings, 16 Documents, 17 System, 19 Navigation.

## Keeping the canvas copy in step

`canvas/ds/plate/` must match `design-system/` except for the image path prefix: the canvas pages sit two folders down, so their bundle prefixes every image path with `../../` (`../../design-system/assets/…`, `../../brand/vehicles/…`) where the master bundle uses `design-system/assets/…` and `brand/vehicles/…`. After changing `design-system/tokens.json`, `tokens.css`, `components/bundle.js` or `components/bundle.css`, copy them here and apply that prefix.
