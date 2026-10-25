# StatePill
States of money records: recorded, reconciliation, settlement, payout, pending decision and deposit. Each pill is an icon plus a word.

**Provide:**
- `kind`: `recorded` | `notChecked` | `matched` | `unmatched` | `resolved` | `open` | `provisional` | `finalised` | `paid` | `partPaid` | `pending` | `deposit`
- `lang`
- optional `by`: who and against what

**Rules:**
- **"Recorded" and reconciliation are two separate pills, side by side.** A payment entered by staff is never shown as verified.
- **"Matched" uses the `link` icon, never a tick, and always carries `by`**: who matched it, against what, and when. Nothing implies automatic bank checking. SNS has no bank or card integration.
- **"Provisional" is dashed with `eyeOff`** and sits beside the sentence "Partner ට තවම පේන්නේ නැහැ" (the partner cannot see this yet). "Finalised" is solid navy with `lock`.
- **A deposit is labelled "not income"** everywhere it appears.

Pattern references (Mobbin):
- [Stripe transactions — status tabs with counts; pills pair icon and word](https://mobbin.com/screens/13552fc2-7c1b-4e50-80e6-6166a7403a13)
- [Deel payment history — "Initiated by: Manual · By [name]" column](https://mobbin.com/screens/2af37619-c01a-45c8-b29e-58e54b6e7e9b)
- [Square reconciliation — one-sentence verdict above a short waterfall (SNS does this manually, never automatically)](https://mobbin.com/screens/93f0333b-55c6-4b0f-9a0e-881c5498d490)
- [Fresha earnings — dated adjustment lines and a separate "Paid" panel](https://mobbin.com/screens/be92ef92-e3fa-433a-8281-827c4e76f2c8)
