---
name: sns-change-request
description: Change anything the approved, frozen client proposal fixes (scope, phases, price, running costs, the printouts it promises) through a change request and, once the owner agrees, an addendum. Use whenever a decision would add, remove or change something the proposal states.
---

# Change request and addendum

The proposal in `proposal/` is approved and frozen: never edit it (the guard hook blocks it).

## When it applies
A decision adds scope, removes something the proposal promises, changes a phase, the price or the running-cost estimate. Check the proposal text first (`proposal/`); if unsure, ask the **explorer** subagent to find the relevant passage.

## Steps
1. **Raise** `change-requests/CR-NNN-short-name.md` (next number), following an existing one: a table (Raised, Status "Waiting for the owner's agreement", Proposal affected, Price effect, Phase and timeline effect, System design sections), then **What**, **Why**, **Not changed**, and an **Owner's decision** checklist.
2. **Record it as Proposed** in the system design, naming the CR. It is not built until agreed.
3. **When the owner agrees** (in words, recorded by Dulan): tick the CR's decision, set its Status to agreed with the date, write `addenda/ADD-NNN-short-name.md` (agreed by, price, phase, timeline, "everything else stands"), add it to the table in `addenda/README.md`, and move the system design item to Confirmed. Then carry it down with **sns-change-control**.
4. **If it is not wanted:** mark the CR not wanted and remove it from the system design and the screens.
5. Commit: `scope(cr-NNN): …`.
