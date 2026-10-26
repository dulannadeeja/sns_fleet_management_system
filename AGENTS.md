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

The repository is the master copy. Everything below works from git alone; no claude.ai account is needed.

| What | Master (in this repository) | Viewer on claude.ai | Notes |
| --- | --- | --- | --- |
| Brand guidebook | `brand/guidebook/` | — | Identity, colour, type, language, icons, vehicle imagery, layout, money on screen, printed documents. Start from `brand/guidebook/README.md`. |
| Design system | `design-system/` | "SNS Design System · Plate": https://claude.ai/artifact/3iqJRN9jkgBAGqvGSx7RK4 | Tokens, components (global `window.Plate`) and previews. Open `design-system/index.html` in a browser to see every component. |
| Screen designs | `screens/` | Canvas "SNS Rent Car · Screens": https://claude.ai/artifact/QwHjboTyDUzjNg2U4HY9td | 170 screens. Every screen has a desktop and a phone version, grouped in numbered modules. Names follow `NN.n Name · Device`; files follow `NN-Module-Screen-Desktop` / `-Phone`. Links stay on the same device. |

**Plate in one line:** cool grey ground `#eef1f0`; the Sri Lankan number plate is the signature (yellow plate face `#f6c343` with ink `#1b1f1d`, only on plates, the SNS mark and the active nav pill); action blue `#1756a9`; Yaldevi for text, Gemunu Libre for plates, money and headings; status colours keep their meaning and are never shown by colour alone.

**Viewers are never edited directly.** Change the repository first, then refresh the viewer. If a viewer and the repository disagree, the repository wins.

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
| `PRD.md` | Product requirements (rank 2), derived from the source of truth. In progress. |
| `change-requests/`, `addenda/` | Change requests to the frozen proposal, and addenda once the owner agrees. |
| `proposal/` | The approved, frozen client proposal (PDF and HTML). Never edit. |
| `design-system/` | The Plate design system (master): tokens, components, previews and the image copies they use (`design-system/assets/`). |
| `screens/` | The screens (master): source (`screens/canvas/`), static HTML and PNG (`screens/previews/`). |
| `brand/` | The brand guidebook (`brand/guidebook/`) and the source brand files: the SNS logo, the vehicle PNG pack (`brand/vehicles/`) and the 44 SNS 3D icons (`brand/icons/`). |
| `fonts/` | Gemunu Libre, Yaldevi and IBM Plex Mono (the proposal's fonts). |
| `reference/client-agreement/` | The two photos of SNS's current agreement, sent by the client. Reference only; see system design §14 before using any wording. |
| `.agents/skills/` | `sns-change-control` (mandatory) and `impeccable` (third-party design skill; don't edit). |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | Agent instructions (this file is the full version). |

Earlier exploration files, stock images and tooling from the old folder were left out on purpose. Don't bring them back.
