---
name: sns-screen-update
description: Change, add or retire SNS screen boards (screens/canvas/*.dc.html): edit the source, re-render the HTML and PNG previews, keep canvas.json and the render report in step, check the layout, and refresh the claude.ai canvas viewer. Use for any screen change.
paths:
  - "screens/**"
---

# Update screens

A screen shows a rule; it never adds one. If the change needs a new rule, record it first (**sns-change-control**).

## Steps
1. **Find every board involved**, Desktop and Phone: ask the **consistency-checker** subagent for every place the rule is shown, or the **explorer** subagent for where a component or text appears.
2. **Edit the source** `screens/canvas/<NN-Module-Screen-Device>.dc.html`. Use Plate components (`x-import component-from-global-scope="Plate.X"`) and tokens (`var(--…)`), never new colours or sizes. Text follows the guidebook voice; sample values are labelled as examples; money in whole rupees. Change both devices.
3. **Render** the changed boards: `node screens/tools/render.mjs --changed` (or name the boards). It rewrites `screens/previews/{png,html}`, updates `preview-report.json`, and grows a board's height in `canvas.json` and its `$preview` when the content is taller. It reports page errors, broken images and sideways scrolling: fix them all.
4. **Look** at the PNG of every changed board (Read the image). Check that nothing is clipped, especially fixed-height bottom sheets (800 or 844 px).
5. **Audit:** `node scripts/audit.mjs`. If boards now overlap on the canvas, move the boards below down in `canvas.json` (and the module titles in `notes`), keeping the gap.
6. **New or retired boards:** add or remove the board in `canvas.json` (`boards`, `order`), the `.dc.html` file, both previews and the report entry together; update screen counts ("N screen boards") in `README.md`, `AGENTS.md` and the system design.
7. **Refresh the claude.ai canvas** "SNS Rent Car · Screens" as `screens/README.md` describes (the repository is the master; the canvas is a viewer). Publish only the changed boards plus `canvas.json`, then copy the published `canvas.json` back.
8. **Commit** with **ship**: `design(screens): …`, naming the boards and "Viewer refreshed: <version>".
