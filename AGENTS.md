# SNS Rent Car System — instructions for AI agents

Read this before doing any work in this folder. It applies to every agent and tool (Claude, Codex, Gemini, Antigravity, Copilot and others).

## 0. Change control (mandatory)

Every task follows **`.agents/skills/sns-change-control/SKILL.md`**. Read it before your first change, and follow its steps in order.

## 1. One source of truth

**`SNS_SYSTEM_DESIGN.md`** (repository root) is the single source of truth for requirements, business rules and decisions.

- Read it first, every session. Use its status labels exactly: Confirmed, Derived control, Proposed, Open, Deferred.
- If anything else (a screen, the proposal, a note, your memory, an earlier chat) disagrees with it, the design doc wins. Report the conflict; don't silently follow the other source.
- New decisions go into the design doc first. Only then update screens, the proposal or code.
- **Open** items stay open. Don't pick an answer in code or design; ask the stakeholder, one question at a time.

## 2. Latest design (use only these)

| What | Where | Notes |
| --- | --- | --- |
| Screen designs | Design canvas "SNS Rent Car · Plate": https://claude.ai/artifact/XPpVE6ZafYtyG4gRZukHYz | 170 screens. Every screen has a desktop and a phone version, grouped in 17 modules. Names follow `NN.n Name · Device`; files follow `NN-Module-Screen-Desktop` / `-Phone`. Links stay on the same device. |
| Design system | "SNS Rent Car · Plate": https://claude.ai/artifact/E1pWnYhfHjpZ9C18ipGBWv | Tokens, components (global `window.Plate`), brand book. Start from its `project/README.md` (offline copy: `design/design-system/README.md`). |
| Offline copy | `design/` in this folder | Read-only snapshot of both, for agents that cannot open claude.ai (Codex and others): screen source, static HTML and PNG previews, the design system files and every image. Start from `design/README.md`. |

**Plate in one line:** cool grey ground `#eef1f0`; the Sri Lankan number plate is the signature (yellow plate face `#f6c343` with ink `#1b1f1d`, only on plates, the SNS mark and the active nav pill); action blue `#1756a9`; Yaldevi for text, Gemunu Libre for plates, money and headings; status colours keep their meaning and are never shown by colour alone.

**Retired, don't use:** the Ratna design system, Concept A/B/C screens, the Dashboard Design Briefs, navigation options 19.2 (day panel) and 19.3 (top bar), and any older canvas or older project folder.

**If you cannot open claude.ai:** use `design/`. It is a snapshot; check `design/README.md` for the versions it was taken from. Never edit it to change the design: design changes go to the online canvas and design system first, and the snapshot is refreshed after. If the snapshot and the online version disagree, the online version wins.

Screens show sample data and labelled examples. They illustrate the requirements; they don't add requirements.

## 3. Client proposal (approved, frozen)

- `proposal/SNS_Rent_a_Car_Proposal_SI.pdf` (print version) and `proposal/SNS Rent a Car Proposal.html`; online: https://claude.ai/artifact/DCDGDwQJRuL7K8AUNN4nQ5
- The client has approved it. **Never edit it.** Scope, phase, price, payment, timeline or agreement changes go through a change request in `change-requests/` and, after the owner agrees, an addendum in `addenda/`.
- The proposal holds the phases, price and agreement terms. Requirements live in the design doc.

## 3a. History

- This folder is a git repository. Work on the `development` branch. One commit per change, after the sync audit; message `type(scope): summary` with the source-of-truth sections, AT-ids and who decided. No version history inside the design doc.
- Future PRD (`PRD.md`) and TRD (`TRD.md`) are derived from the design doc; every item cites its section or AT-id.

## 4. Rules that always apply

- Never invent data. Label sample, example and placeholder values as such.
- Never call anything "profit". What counts as SNS earnings is an open owner decision.
- Deposits are held money, not income.
- No GPS, automatic bank verification, payment integration or fraud guarantees.
- No customer trust scores or ratings.
- Staff see full NIC and phone numbers; no masking.
- Partners cash out on any day; one account covers all of a partner's cars; earnings become final when the business day closes.
- Sinhala first; English is the second language. Plain everyday Sinhala; English only for words SNS already uses.
- Don't create `PRODUCT.md`.
- Before generating any AI image, icon or illustration, ask the stakeholder whether to switch to a higher model.

## 5. What is in this folder

| Path | What it is |
| --- | --- |
| `SNS_SYSTEM_DESIGN.md` | The source of truth (rank 1). |
| `change-requests/`, `addenda/` | Change requests to the frozen proposal, and addenda once the owner agrees. |
| `proposal/` | The approved, frozen client proposal (PDF and HTML). Never edit. |
| `design/` | Offline snapshot of the canvas and the design system (read-only). |
| `brand/` | Source brand files: the SNS logo, the vehicle PNG pack (`brand/vehicles/`) and the 44 SNS 3D icons (`brand/icons/`). |
| `fonts/` | Gemunu Libre, Yaldevi and IBM Plex Mono (the proposal's fonts). |
| `reference/client-agreement/` | The two photos of SNS's current agreement, sent by the client. Reference only; see system design §14 before using any wording. |
| `.agents/skills/` | `sns-change-control` (mandatory) and `impeccable` (third-party design skill; don't edit). |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | Agent instructions (this file is the full version). |

Earlier exploration files, stock images and tooling from the old folder were left out on purpose. Don't bring them back.
