---
name: domain-modeling
description: Keep the SNS vocabulary and decisions sharp while designing: challenge fuzzy or conflicting terms, test rules with concrete scenarios, and write settled terms to GLOSSARY.md, business rules to the system design and technical decisions to docs/adr/. Use when discussing terminology, editing GLOSSARY.md or recording an ADR.
---

# Domain modeling for SNS Rent Car

## Where each kind of answer goes

| What was settled | Where | How |
| --- | --- | --- |
| A business rule or owner decision | `SNS_SYSTEM_DESIGN.md` | Through **sns-change-control**: recorded as "Confirmed: agreed by the owner, recorded by Dulan", with an AT-nn check, then carried down |
| A word and its meaning (Sinhala and English) | `GLOSSARY.md` | [GLOSSARY-FORMAT.md](GLOSSARY-FORMAT.md); create the file when the first term is settled |
| A technical decision that is hard to reverse | `docs/adr/NNNN-slug.md` and the TRD's decision table | [ADR-FORMAT.md](ADR-FORMAT.md) |
| Wording shown to users | `brand/guidebook/04-language-and-voice.md` | Plain everyday Sinhala; English only for words SNS already uses |

## During the session

- **Challenge against the glossary and the system design.** "The system design calls this a 'cash-out'; you said 'settlement'. Settlements were removed. Which do you mean?"
- **Sharpen fuzzy words.** "By 'account' do you mean the partner's sign-in, or their balance?"
- **Test with scenarios.** Invent concrete cases with real-looking numbers (whole rupees, Asia/Colombo times) that probe the boundary: a rental over the day close, a swap on day 3, a partner with a negative balance.
- **Cross-check the code and screens.** If they disagree with what the user just said, say so and ask which is right.

## Rules

- `GLOSSARY.md` holds words, not rules or implementation detail.
- Offer an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off.

Source: adapted from `domain-modeling` in mattpocock/skills (MIT, see LICENSE.txt).
