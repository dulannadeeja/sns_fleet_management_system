# screens/: the screen designs (rank 4, master)

193 screen boards in `canvas/` (`*.dc.html`, laid out by `canvas/canvas.json`), rendered to `previews/html/` and `previews/png/` with `previews/preview-report.json`. The claude.ai canvas "SNS Rent Car · Screens" (https://claude.ai/artifact/QwHjboTyDUzjNg2U4HY9td) is a viewer; `README.md` says how to refresh it.

## Rules
- A screen shows a rule from the system design; it never adds one. Sample data is labelled. Money in whole rupees.
- Every screen has a Desktop and a Phone board. Board titles `NN.n Name · Device`; files `NN-Module-Screen-Desktop` / `-Phone`; links stay on the same device.
- Build from Plate components and tokens only (see `design-system/AGENTS.md`).
- Never edit `previews/` or `canvas/ds/` by hand: the guard hook blocks it. Previews come from `tools/render.mjs`; `canvas/ds/` from `scripts/sync-design-copy.mjs`.
- Every change follows the **sns-screen-update** skill, including the viewer refresh.

## Checks
- `node screens/tools/render.mjs --changed`: renders changed boards and reports page errors, broken images and sideways scrolling. First run: `npm install && npx playwright install chromium` in `screens/tools/`.
- `node scripts/audit.mjs`: files, previews, report and `canvas.json` agree; no overlapping boards; screen counts match.
- Look at every changed PNG before committing.
