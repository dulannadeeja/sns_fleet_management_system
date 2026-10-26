# ConfirmationBlock
Persistent feedback after a money or vehicle action. It names what happened, who did it and when, the money effect and the next step. It stays on screen until dismissed. Toasts are too easy to miss for these actions.

**Provide:** `title`, `sentence`, `rows` `[{label, value}]`, `actions`, and optional `icon`: a 3D done icon (`done-handover`, `done-return`, `done-payment`, `done-drawer`, `done-cashout`, `done-day`, `done-sign-in`) that takes the check mark's place. The facts stay the same; there is no confetti.

- **Every balance that changed appears as its own row.**
- **Bank and card lines repeat their reconciliation state.** For example "not yet checked".
- **The affected card or row also updates, and a `HistoryLine` is added.**

Pattern references (Mobbin):
- [Jobber "Payment Recorded" — check in a soft circle, title, one sentence with the amount, "View receipt" + "Done"](https://mobbin.com/screens/ffc24d22-55cf-4e32-afa6-39c76c713375)
- [State Farm — confirmation as labelled field stacks (number, amount, to, date) plus a processing note](https://mobbin.com/screens/8aa6af94-32bb-4904-b4b6-843523772511)
- [DoorDash Dasher — confirmation toast with a check and a sentence](https://mobbin.com/screens/ef78ad87-a9ea-424c-a5b0-d96f877c5e94)
