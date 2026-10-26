# SNS Rent Car · screens

The screen designs for the SNS Rent Car management website, master copy. Requirements and business rules live in `SNS_SYSTEM_DESIGN.md`; the screens show sample data and labelled examples, and never add a rule. Brand and visual rules are in `brand/guidebook/`; the components they use are in `design-system/`.

The claude.ai canvas "SNS Rent Car · Screens" (https://claude.ai/artifact/QwHjboTyDUzjNg2U4HY9td) is a viewer. Change the files here first, then refresh the canvas.

## What is here

| Path | What it is |
| --- | --- |
| `previews/html/` | One static HTML page per screen. Open any file in a browser; no tools needed. |
| `previews/png/` | One PNG per screen, for quick review. |
| `previews/preview-report.json` | The render check for each screen: width, height, missing or broken images. |
| `canvas/` | The screen source (`*.dc.html`), the canvas layout (`canvas.json`) and `support.js`, as used by the claude.ai canvas. |
| `canvas/ds/plate/` | A copy of the design-system tokens and bundle that the canvas pages load. It is generated from `design-system/`: never edit it by hand. |
| `blob-map.json` | The canvas uploads: each upload id and the repository image it holds. |

## Names

Every screen has a desktop and a phone version. Screen names follow `NN.n Name · Device`; files follow `NN-Module-Screen-Desktop` and `NN-Module-Screen-Phone`. Links stay on the same device.

Modules: 01 Start, 02 Home, 03 Morning check, 04 Cars, 05 New rental, 06 Rentals, 07 Return, 08 Customers, 09 Money, 10 Approvals, 11 Partners, 12 Maintenance, 13 Payroll, 14 Reports, 15 Settings, 16 Documents, 17 System, 19 Navigation.

## Keeping the canvas copy in step

`canvas/ds/plate/` must match `design-system/` except for the image path prefix: the canvas pages sit two folders down, so their bundle prefixes every image path with `../../` (`../../design-system/assets/…`, `../../brand/vehicles/…`) where the master bundle uses `design-system/assets/…` and `brand/vehicles/…`. After changing `design-system/tokens.json`, `tokens.css`, `components/bundle.js` or `components/bundle.css`, copy them here and apply that prefix.

## Refreshing the claude.ai canvas

The canvas is built from this folder. It shows pictures only as uploads (`/_blob/<id>`), not as files beside the screens, so its copy of the bundle points at uploads:

1. Copy `canvas/canvas.json`, every `canvas/*.dc.html`, and `canvas/ds/plate/` (`tokens.json`, `tokens.css`, `components/bundle.css`, `components/bundle.js`) into a folder as `project/…`.
2. In that copy of `bundle.js`, replace each image path with its upload: `blob-map.json` lists every upload id with the repository file it holds. An image that changed or is new must be uploaded to the canvas first, and `blob-map.json` updated.
3. Publish the folder to the canvas link above, then copy the published `project/canvas.json` back to `canvas/canvas.json`.
