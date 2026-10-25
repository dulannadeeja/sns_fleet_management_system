---
name: sns-change-control
description: Use for ANY change, decision, design, document or code work on the SNS Rent Car system. Enforces source-of-truth-first order, impact checks and cross-file sync.
---

# SNS Rent Car — change control

This skill is mandatory for every task that could change what the SNS Rent Car system is, does, looks like, costs or promises. It decides the ORDER of work. Follow it strictly. When this skill and a request conflict, stop and ask; don't improvise.

## 1. The files and their rank

Higher rank is the authority. A lower file may only restate, detail or implement a higher one, never contradict it.

| Rank | File | Owns | Location |
|---|---|---|---|
| 1 | **System design (source of truth)** | Requirements, business rules, decisions and their status | `SNS_SYSTEM_DESIGN.md` (repository root) |
| 2 | **PRD** (when it exists) | Product requirements, user stories, acceptance criteria, phase mapping | `PRD.md` (repository root) |
| 3 | **TRD** (when it exists) | Architecture, data model, APIs, integrity rules, migrations | `TRD.md` (repository root) |
| 4 | **Design system** "SNS Rent Car · Plate" | Tokens, components, visual rules | https://claude.ai/artifact/E1pWnYhfHjpZ9C18ipGBWv |
| 4 | **Screens** canvas "SNS Rent Car · Plate" | 170 desktop and phone screens, `NN-Module-Screen-Device` | https://claude.ai/artifact/XPpVE6ZafYtyG4gRZukHYz |
| 4 | **Offline design snapshot** | Read-only copy of the two rank-4 artifacts, for agents without claude.ai access | `design/` (see `design/README.md`) |
| 5 | **Client proposal** | Scope as promised to the client, phases, price, payment, agreement | `proposal/SNS_Rent_a_Car_Proposal_SI.pdf`, `proposal/SNS Rent a Car Proposal.html` (https://claude.ai/artifact/DCDGDwQJRuL7K8AUNN4nQ5) |
| 6 | **Agent instructions and notes** | Pointers only | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, project notes |
| 7 | **Code, tests, data** | Implementation | the repository (when it exists) |

The proposal is a special case: it is the **commercial agreement with the client**, and **the client has approved it**. It is frozen: never edit it in place. Changes to scope, phases, price or timeline go through a change request and an addendum (see §6). Change requests and addenda are not ranks of their own: an approved addendum sits at rank 5 with the proposal it amends.

**History lives in git.** The repository is a git repository; every change is a commit. There is no version history inside the source of truth, and none should be added.

## 2. Classify the task first

Before touching any file, name the task type in one line:

- **A. Question** — answer from the files; change nothing.
- **B. Decision or rule change** — a stakeholder decides or changes how the business works.
- **C. New or removed feature / scope change.**
- **D. Wording, layout or visual change** that changes no rule.
- **E. Implementation** (PRD, TRD, code, tests) of something already in rank 1.
- **F. Bug or inconsistency** found between files.
- **G. Housekeeping** (rename, delete, move, link fixes).

Then follow the matching path in §3. If the type is unclear, ask.

## 3. The order of work (never skip, never reorder)

### Step 1 — Read
Read the source of truth in full for the affected areas, plus every lower-rank file the task will touch. Never work from memory, an earlier chat, or a summary. Re-read any file before editing it; another agent may have changed it.

### Step 2 — Check the status label
Every rule in the source of truth carries one of: **Confirmed, Derived control, Proposed, Open, Deferred.**
- Only **Confirmed** rules may be implemented as fact.
- **Open** items must stay open everywhere: screens show them as "decide", code makes them configurable or blocks them, the proposal doesn't promise an answer.
- Never upgrade a status yourself. Only the stakeholder (Dulan, for the owner S D De Silva) can make something Confirmed, in words, in this conversation.

### Step 3 — Impact analysis (write it down before editing)
List every place the change lands, using this table. Search all ranks, not just the obvious one.

| Area | Affected? | What changes | Risk |
|---|---|---|---|
| Source of truth sections (§ numbers, AT-ids) | | | |
| PRD stories / acceptance criteria | | | |
| TRD data model / API / migration | | | |
| Design system tokens / components | | | |
| Screens (list file names) | | | |
| Proposal: scope, feature list, phases, price, timeline, agreement | | | |
| Agent files / notes / links | | | |
| Code / tests / existing data | | | |

Also answer: Does it change money already final? Does it change historical records? Does it change permissions? Does it change what the client was promised or the price?

### Step 4 — Stop conditions (ask the stakeholder, one question at a time)
Stop and ask before editing if ANY of these is true:
1. The request conflicts with a Confirmed rule.
2. It would resolve an Open item.
3. It changes scope, phases, price, timeline or the agreement (commercial impact).
4. It changes money that is already final, or historical terms.
5. It changes permissions or who can see personal data (NIC, phone, documents).
6. Two files disagree and the right answer is not obvious from rank.
7. It deletes, renames or moves files or artifacts, or migrates data.
8. The request is ambiguous.

### Step 5 — Update the source of truth FIRST
- Edit only the affected sections. Keep the status label honest and record who decided and when on the changed item (for example: "Confirmed 24 Oct 2026 by Dulan").
- Add or update acceptance scenarios (AT-ids) for every changed rule.
- Don't add version history inside the source of truth; git keeps it (§10).
- Show the stakeholder the exact change before propagating if the type is B or C.

### Step 6 — Propagate down, in rank order
PRD → TRD → design system → screens → proposal (only via §6) → agent files → code and tests. Never update a lower file before the higher one says the same thing.

### Step 7 — Sync audit (§5), commit, then report
Run the sync audit. Then commit (§10). Report in this shape:
- **Changed:** each file and what changed.
- **Not changed and why.**
- **Still open:** questions for the stakeholder.
- **Sync audit:** pass, or each mismatch found.

## 4. Path by task type

- **A. Question:** Steps 1–2 only. Quote the section. If the files disagree, report it as type F.
- **B. Decision:** Steps 1–7 in full. Never infer a decision from a passing remark; confirm in words.
- **C. Scope change:** Steps 1–7, plus §6 for the proposal. New things are priced before they are built (agreement section 5).
- **D. Visual or wording:** Steps 1, 2, 3, 6, 7. Step 2 applies because a visual can show a "decide" item as settled. If it turns out to change a rule, it becomes type B.
- **E. Implementation:** Steps 1–3, then build only what is Confirmed. Missing or unclear requirements go back to the stakeholder through Step 5; never fill gaps in code.
- **F. Inconsistency:** Find the higher-rank file. If it is clear, fix the lower file. If the source of truth itself is unclear or wrong, stop and ask.
- **G. Housekeeping:** Step 4 rule 7 always applies. After renames or deletes, fix every link in ranks 4–6.

## 5. Sync audit (run after every change, and at the start of each new phase)

Check each line; report mismatches, don't silently fix rank-1 content.

1. **Numbers match everywhere:** every price, rate, charge, deposit, commission and payroll figure, and every worked example, is the same in each file that shows it. Compare against the source of truth (§4.1, §4.2, §5.3, §19 today), never against figures copied into this skill, which go stale when a price changes.
2. **Rules match:** day close and partner earnings, cash-out, deposits are not income, write-offs, permissions, approvals, handover requirements.
3. **Open items are open everywhere:** none shown as decided in screens, PRD, TRD, code or proposal.
4. **Scope matches:** proposal feature list and not-included list = source of truth scope and §16 (optional and excluded scope). Every phase item exists in both.
5. **Phases match:** the same feature is in the same phase in the proposal, PRD and plan.
6. **Screens:** every Confirmed user-facing rule has a screen; no screen adds a rule; examples and sample data are labelled; links stay on the same device; names follow `NN.n Name · Device`.
7. **Words:** the same terms in every file; Sinhala and English versions say the same thing. If a glossary exists, check against it; until one does, check against the wording in the source of truth.
8. **Links and files:** every path and URL in agent files and notes exists. No references to retired items (Ratna, Concept A/B/C, dashboard briefs). Every file in the repository is referenced by a document, or is named in the report as a deliberate exception.
9. **Traceability:** every PRD story and TRD item cites its source-of-truth section or AT-id; every AT-id has at least one story or test.
10. **Repeated rules:** the rules copied into `AGENTS.md` §4 and §8 of this skill say the same as the source of truth. Where they differ, the source of truth wins and the copies are corrected in the same commit.

## 6. Proposal rules (the proposal is approved and frozen)

- Never edit `proposal/SNS_Rent_a_Car_Proposal_SI.pdf`, `proposal/SNS Rent a Car Proposal.html` or the proposal artifact in place.
- If a change affects scope, features promised, phases, price, payments, timeline or the agreement, write a **change request** for the stakeholder: what changes, why, effect on price, phase and timeline, and what the client must agree to. Save it as `change-requests/CR-NNN-short-name.md`.
- Only after the owner agrees in words: record the decision in the source of truth (Step 5), then issue an **addendum** (`addenda/ADD-NNN-short-name.md`, plus a PDF in the proposal style and fonts if the client needs a printed copy) that references the CR.
- Changes with no client-visible effect (internal design, code structure) need no CR, but must still not contradict what the proposal promised.
- Never promise anything that is Proposed, Open or Deferred in the source of truth.

## 7. PRD and TRD

- They are derived documents. Create them only from Confirmed content, and give every item a source reference (`SoT §10`, `AT-26`). Cite the section number and, where one exists, the AT-id; the source of truth has no subsections under §10.
- **PRD:** one section per module, matching the canvas modules 01–17; user stories per role (owner, admin, staff, partner); acceptance criteria copied from AT-ids; phase per story matching the proposal.
- **TRD:** data model (rentals, payments, deposits, ledger, partner earnings, cash-outs, payroll, audit log), integrity rules from source-of-truth "Derived controls", permissions matrix, migrations.
- Open items become explicit "decision needed" entries, never assumptions.
- When the source of truth changes, update PRD then TRD in the same task.

## 8. Rules that never bend

These repeat the source of truth and `AGENTS.md` §4. If they ever differ, stop and fix the copies (sync audit item 10).

- Money that is final never changes; corrections are new dated lines.
- Historical terms (prices, commission, rates) stay attached to past rentals.
- Never invent data; label sample and example values.
- Never call anything "profit"; deposits are held money, not income.
- No GPS, automatic bank verification, payment integration or fraud guarantees; no customer trust scores.
- Staff see full NIC and phone numbers; no masking.
- Sinhala first; plain everyday Sinhala; English only for words SNS already uses.
- Don't create `PRODUCT.md`. Ask before generating any AI image whether to switch to a higher model.
- Read before write; never overwrite a file another person or agent changed since you read it.

## 9. Common change scenarios

| Scenario | What usually breaks downstream | Extra care |
|---|---|---|
| Owner decides an Open item (e.g. day-close time) | Screens marked "decide", PRD gaps, code defaults, partner earnings timing | Update every "decide" marker; add AT-ids |
| Price or rate change | Proposal price tables, packages screen, examples, past rentals | Keep historical terms; examples get recalculated |
| New feature | Proposal scope and price, phases, payment milestones | Change request and addendum first; price before build |
| Feature removed or deferred | Proposal promises, screens, PRD stories | Move to §16 Deferred; update not-included list |
| Permission change | Settings screens, TRD permissions, audit log | Confirm in words; security review |
| Partner payout rule change | Ledger, statements, partner app, cash-out screens | Final amounts untouched; migration plan |
| Phase moved | Proposal phase table and payments | Change request and addendum; owner approval |
| Visual change | Design system, every screen | Change the system first, then screens; re-run Impeccable; then refresh the `design/` snapshot |
| Screen rename or delete | Links in screens, agent files, PRD | Fix all links; G-type stop rule |
| Bug found in implementation | Code vs PRD vs SoT | Fix the lowest wrong file; if SoT is wrong, stop and ask |

## 10. Git (history and safety)

- Work on the `development` branch. Don't commit to `main` without the stakeholder's say-so.
- Start every task with a clean tree (`git status`). Don't mix unrelated changes in one commit.
- One commit per change, after the sync audit passes. If the change touched the source of truth, the same commit contains the downstream updates, or the commit message lists what is still pending.
- Message format: `type(scope): summary` with types `decision`, `scope`, `design`, `docs`, `impl`, `fix`, `chore`; the body lists the source-of-truth sections and AT-ids, who decided, the files changed and anything still pending. Example: `decision(day-close): business day closes at 21:00` — body: `SoT §9, §10; AT-26; decided by Dulan 24 Oct 2026; updated PRD §09, screens 09-Money-CloseDay-*`.
- Tag milestones: `proposal-approved`, `prd-v1`, `trd-v1`, and each phase release.
- Never commit secrets, passwords, customer documents or real NIC images. Keep fonts and images that are needed; large exports belong in releases, not commits.
- Online artifacts (canvas, design system, proposal artifact) are not in git: list in the commit body which artifact was republished and its version.
