---
name: sns-change-control
description: Use for any change to the SNS Rent Car docs or agent files: decisions, rule wording, visual changes, or fixing two files that disagree. Keeps all docs in sync and sets the steps a developer follows.
---

# SNS Rent Car — change control

This skill keeps the SNS Rent Car docs in sync and sets the steps a developer follows for each change. The source of truth decides; everything else follows it. When this skill and a request conflict, stop and ask.

## 1. Ranks

Higher rank wins. A lower file may restate or implement a higher one, never contradict it.

| Rank | File | Owns | Location |
|---|---|---|---|
| 1 | **System design (source of truth)** | Requirements, business rules, decisions and their status | `SNS_SYSTEM_DESIGN.md` |
| 2 | **PRD** (when it exists) | Product requirements, user stories, acceptance criteria | `PRD.md` |
| 3 | **TRD** (when it exists) | Architecture, data model, integrity rules | `TRD.md` |
| 4 | **Brand guidebook** | Brand and visual rules | `brand/guidebook/` |
| 4 | **Design system** | Tokens, components, previews | `design-system/` |
| 4 | **Screens** | Desktop and phone screens, `NN-Module-Screen-Device` | `screens/` |
| 5 | **Client proposal** | Scope, phases, price, agreement (approved and frozen) | `proposal/` |
| 6 | **Agent instructions** | Pointers only | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` |
| 7 | **Code, tests, data** | Implementation | the repository (when it exists) |

The repository is the master copy of every rank-4 item. The claude.ai viewers (design system "SNS Rent Car · Plate v2", screens canvas "SNS Rent Car · Plate") are never edited directly: change the repository, then refresh the viewer.

History lives in git. Don't add version history inside any doc.

## 2. Classify the task

Name the type in one line before touching any file:

- **A. Question:** answer from the files. Change nothing. If the files disagree, report it as type C.
- **B. Doc change:** a decision, rule change, wording change or visual change.
- **C. Doc sync fix:** two files disagree, or a link or path is broken.

If the type is unclear, ask.

## 3. Steps

1. **Read.** Read the source of truth in full for the affected area, and every file the change touches. Re-read a file before editing it, because another agent may have changed it.
2. **Check status.** Every rule carries one label: Confirmed, Derived control, Proposed, Open or Deferred. Only Confirmed rules may be treated as fact. Open items stay open. Never change a status yourself. Only the owner's agreement, S D De Silva, can move a rule to Confirmed or resolve an Open item. The agreement must be given in words. Dulan records it in the source of truth with the date and who agreed.
3. **List the files.** Before editing, write one line naming every file the change touches, across all ranks.
4. **Stop and ask Dulan, one question at a time,** if any of these is true:
   1. The request conflicts with a Confirmed rule.
   2. It would resolve an Open item.
   3. It deletes, renames or moves files.
   4. The request is ambiguous.
5. **Update the source of truth first.** Edit only the affected sections. Record the status and who agreed, for example "Confirmed 24 Oct 2026, owner S D De Silva (recorded by Dulan)". Add or update AT-ids for changed rules. For type B, show Dulan the exact change before propagating it.
6. **Propagate down in rank order:** PRD, TRD, brand guidebook, design system, screens, agent files, code. Never update a lower file before the higher one says the same thing. After a rank-4 change, refresh the claude.ai viewer and name it in the commit body.
7. **Sync audit (section 4), commit (section 5), report.** The report has four parts:
   - **Changed:** each file and what changed.
   - **Not changed, and why.**
   - **Still open:** questions for Dulan.
   - **Sync audit:** pass, or each mismatch found.

## 4. Sync audit

Run after every change. Report mismatches. Don't silently change the source of truth.

1. **Numbers:** every price, rate, charge, deposit, commission and worked example is the same wherever it appears. Compare against the source of truth. Don't copy figures into this skill, because they go stale.
2. **Rules:** day close, partner earnings, cash-out, deposits (held money, not income), write-offs, permissions and handover requirements match everywhere.
3. **Open items:** none is shown as decided in screens, PRD, TRD or code.
4. **Screens:** every Confirmed user-facing rule has a screen. No screen adds a rule. Sample data is labelled. Names follow `NN.n Name · Device`.
5. **Links and files:** every path and URL in agent files and notes exists. Only the latest design versions are referenced: nothing points to a deleted artifact or an earlier design. Every file in the repository is referenced by a document, or is named in the report as a deliberate exception.
6. **Repeated rules:** `AGENTS.md` §4 says the same as the source of truth. If they differ, the source of truth wins and the copy is corrected in the same commit.

## 5. Git

- Work on the `development` branch. Don't commit to `main` without Dulan's say-so.
- Start every task with a clean tree (`git status`). Don't mix unrelated changes in one commit.
- One commit per change, after the sync audit passes. If the source of truth changed, the same commit holds the downstream updates, or the message lists what is still pending.
- Message format: `type(scope): summary`, where type is one of `decision`, `scope`, `design`, `docs`, `impl`, `fix`, `chore`. The body lists the source-of-truth sections and AT-ids, who decided, the files changed and anything still pending.
- Never commit secrets, passwords, customer documents or real NIC images.
