# MoneyBlock
One kind of money per block, with a fixed label, a figure or a time-of-day state, optional lines, and a note saying what it includes and excludes.

**Provide:**
- `label` and `icon`
- `figure` (a number, in LKR) or a `state` sentence
- optional `lines` `[{label, amount, sign: 'in'|'out', total}]` and `pill` (a `StatePill`)
- `note`
- `alert` for an open difference

**The blocks, never added together:**
- Money received today
- Drawer
- Reconciliation
- Deposits held (not income)
- Customer debt
- Partner payable (finalised)
- Partner share (provisional, the partner cannot see it)
- SNS earnings ("definition pending owner decision")

**Rules:**
- **During the day, show "so far · not yet counted / not yet checked"**, not close-of-day-looking totals.
- **Never use the word "profit" (ලාභය).** Its definition is an open owner decision.
- **Refunds and expenses are separate lines.** A refund returns customer money; an expense is a cost.
- **Signs carry words:** "+ Cash in", "− Refunds". Colour is never the only cue.

Pattern references (Mobbin):
- [Upwork overview — money states (in progress, pending, available) side by side, each labelled, never summed](https://mobbin.com/screens/87c3379b-2f64-40fd-b0d6-bbf30afd8985)
- [Fresha daily sales — "payments collected" and "refunds paid" in separate columns, cash movement apart from sales](https://mobbin.com/screens/47e06b3c-bba2-49f8-b11c-e8d3be3d6084)
- [Square reconciliation — one-sentence verdict above a short waterfall (SNS does this manually, never automatically)](https://mobbin.com/screens/93f0333b-55c6-4b0f-9a0e-881c5498d490)
- [Meetup — "Record transaction" / "Record expense" labelled buttons, type pills, "paid using cash (confirmation #)"](https://mobbin.com/screens/a93a0849-8e6a-42b1-81b8-4ad48ee00010)
