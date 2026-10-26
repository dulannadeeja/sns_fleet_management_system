---
name: grilling
description: Stress-test a plan, rule or decision by asking the user one question at a time, each with a recommended answer, until nothing is left assumed. Use when the user wants to be grilled, says "ask me", "don't decide silently", or when a decision has open branches.
---

Interview the user until you reach a shared understanding. Map the work as a **design tree**: every decision branches into the decisions that hang off it. The **frontier** is every decision whose prerequisites are settled.

## How this project asks (Dulan's preference)

- **One question at a time**, with the AskUserQuestion tool when it is available: two to four options, your recommended option first and marked "(Recommended)", each with a one-line consequence.
- Word each question so that choosing the recommendation is the natural answer, and say why you recommend it.
- **Check every option against the documents first**: the system design, PRD, TRD, the approved proposal (price, scope and running costs are frozen) and the screens. If an option conflicts with one of them, say so in the question, and say what it would need (for example, a change request).
- When the user answers with a question ("compare X and Y"), answer it with a short comparison table and a recommendation, then ask again.

## Facts are yours, decisions are theirs

- Never ask the user for a fact you can find. Send the **explorer** subagent (files) or the **researcher** subagent (outside facts, current prices and limits) and keep asking the questions that do not depend on the answer.
- Put every decision to the user. Never answer an Open item yourself.

## Recording

- Record each settled answer immediately (see **domain-modeling** for where), not in a batch at the end.
- The session is done when the frontier is empty and the user confirms. Do not act on the outcome before that.

Source: adapted from `grilling` in mattpocock/skills (MIT, see LICENSE.txt).
