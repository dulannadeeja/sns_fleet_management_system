# SNS Rent Car system: instructions for every agent

The rental and fleet management system for SNS Rent Car (one branch, Elpitiya, Sri Lanka). Sinhala first, office computers and phones. These instructions apply to every agent and person (Claude, Codex, Gemini, Copilot and others). Each folder has its own `AGENTS.md` with its rules and checks; read it when you work there.

## Rank order (higher wins)

1. `SNS_SYSTEM_DESIGN.md`: the source of truth for every rule and decision. Read the part you work on first.
2. `PRD.md`: stories ST-nn.n, each tied to acceptance scenarios AT-nn.
3. `TRD.md`: architecture, data model, integrity rules, jobs, deployment, tests.
4. `brand/guidebook/`, `design-system/`, `screens/`: the repository is the master; the claude.ai viewers are refreshed from it, never edited.
5. `proposal/`: approved and frozen. Changes only through `change-requests/` and `addenda/`.
6. Agent files, then code in `app/`.

Every change follows the **sns-change-control** skill: change the highest document first, then each one below it in order, then run the audit and commit.

## Talking to Dulan

- Dulan is Sinhalese and reads English as a second language. Write to him in simple English: short sentences, common words, one idea per sentence.
- No jargon. If a technical word is needed, explain it in a few plain words the first time.
- Lists and short tables are better than long paragraphs.

## Rules that always apply

- Use the status labels exactly: Confirmed, Derived control, Proposed, Open, Deferred. Only the owner, S D De Silva, confirms a rule or settles an Open item; Dulan records it. Never decide an Open item yourself; ask Dulan, one question at a time, with a recommended answer.
- Never invent data. Label sample, example and placeholder values.
- Money is whole rupees. Deposits are held money, not income. "Profit" only for the agreed figure, labelled "before depreciation". Imported records and opening balances are never earnings.
- No GPS, payment integration, automatic bank verification, fraud guarantees, customer trust scores or ratings. Staff see full NIC and phone numbers.
- Plain everyday Sinhala; English only for words SNS already uses.
- Don't create `PRODUCT.md`. Don't bring back files from the old folder.

## Where things are

| Path | What |
| --- | --- |
| `brand/`, `design-system/`, `screens/` | Brand guidebook, Plate design system, 183 screen boards (each has an `AGENTS.md`) |
| `app/` | The application (Next.js, PostgreSQL); `app/AGENTS.md` has its commands |
| `change-requests/`, `addenda/`, `proposal/`, `reference/` | Changes to the frozen proposal, the proposal itself, client material |
| `audits/` | Dated review records; `audits/README.md` says which findings are still open |
| `scripts/` | Repository checks and sync tools (Node, no install) |
| `.claude/skills/`, `.claude/agents/`, `.claude/hooks/` | The harness: skills (index in `.claude/skills/README.md`), subagents, hooks. Other agents can read and follow them too |

## Work loop

- **Docs and designs:** grill (`/grill-with-docs`) → sns-change-control → sns-screen-update or sns-plate-component → validate → ship.
- **Code, one GitHub issue per ticket:** slice-tickets → prime → plan-ticket → implement-ticket (tdd-workflow) → validate → review-changes → ship (PR into `development`; a human merges).
- Before saying anything is done, fixed or passing: verification-before-completion. For any bug or failing test: systematic-debugging.

## Models and subagents

- Explore with the **explorer** subagent (Haiku); run checks with **validator** (Haiku). Keep the main context for decisions and edits.
- Research with **researcher**; review code with **code-reviewer** and **consistency-checker** (all Sonnet).
- Spec and money review: **spec-reviewer** (Opus). The agent that wrote a change never reviews it.
- Planning, architecture, money rules, security and owner decisions need a top-tier model. If the session is not on one, say so in one line and suggest `/model opus` before starting. Ask the same before generating any image or icon.

## Checks

- Every change: `node scripts/audit.mjs` (links, screens, counts, AT coverage, design copy, agent files, skills). The Stop hook runs it and blocks on hard failures.
- Each folder's `AGENTS.md` lists its own checks; `app/AGENTS.md` has the test and lint commands.

## Git

- Work on `development`, or a feature branch for a ticket. Never commit or push to `main`; never force-push.
- One commit per change: `type(scope): summary`, with the system design sections, AT-ids and who decided in the body. History lives in git, not in documents.
- Never commit secrets, `.env` files, customer documents or real NIC images.
