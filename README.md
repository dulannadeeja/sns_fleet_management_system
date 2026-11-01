# SNS Fleet Management System

The rental and fleet management system for SNS Rent Car (one branch, Elpitiya, Sri Lanka): rentals, cars, customers, money, partner owners, payroll and reports, in Sinhala first, on office computers and phones.

**Start here**

1. `AGENTS.md`: how to work in this folder (every agent and person).
2. `SNS_SYSTEM_DESIGN.md`: the source of truth for requirements and decisions.
3. `PRD.md` and `TRD.md`: the product stories and the technical design, derived from it.
4. `brand/guidebook/README.md`: the brand guidebook.
5. `design-system/README.md`: the Plate design system. Open `design-system/index.html` in a browser to see every component.
6. `screens/README.md`: the screens.
7. `.claude/skills/sns-change-control/SKILL.md`: the order every change follows.

Everything works from this repository alone. The claude.ai artifacts are viewers, refreshed from here.

**AI harness.** `AGENTS.md` (and a nested `AGENTS.md` in each folder) for every agent; for Claude Code also `.claude/` (skills, subagents, hooks) and `.mcp.json`. Run `node scripts/audit.mjs` to check that everything agrees.

| Folder | Contents |
| --- | --- |
| `design-system/` | The Plate design system: tokens, components, previews and the images they use |
| `screens/` | 195 screen designs: source, static HTML and PNG |
| `brand/` | The brand guidebook, the SNS logo, the vehicle image pack and the 44 SNS 3D icons (originals) |
| `proposal/` | The client proposal, approved and frozen |
| `change-requests/`, `addenda/` | Changes to the proposal |
| `reference/` | Material sent by the client |
| `fonts/` | Yaldevi, Gemunu Libre, IBM Plex Mono |
| `scripts/` | Repository checks and sync tools (Node, no install) |
| `audits/` | Dated review records (design audit of 26 Oct 2026) |
| `app/` | The application, built from `TRD.md` (not started yet) |
| `.claude/`, `.github/` | The AI harness, issue and PR templates, CI checks |

Set up on 25 Oct 2026 from the earlier `sns_rent_car_system` folder, carrying over only current files.
