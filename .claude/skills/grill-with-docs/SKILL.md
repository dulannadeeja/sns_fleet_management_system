---
name: grill-with-docs
description: A relentless one-question-at-a-time interview that sharpens a plan, rule or design against the SNS documents, and records each answer in the right document as it is settled (system design, glossary, ADR). Start it yourself with /grill-with-docs.
disable-model-invocation: true
argument-hint: "[what to grill: a plan, a rule, a PRD area, a TRD choice]"
---

Grill: $ARGUMENTS

This needs careful reasoning. If the session is not on a top-tier model, say so in one line and suggest `/model opus` before starting.

1. Call the Skill tool for **grilling** (how to ask) and **domain-modeling** (where answers are written).
2. Business rules and owner decisions are recorded through **sns-change-control**: the system design first, then everything below it.
3. Finish only when the user confirms you have reached a shared understanding, then run `node scripts/audit.mjs` and commit.

Source: adapted from `grill-with-docs` in mattpocock/skills (MIT, see LICENSE.txt).
