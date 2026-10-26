# StatusChip
The vehicle status: colour + icon + word, in Sinhala by default, always in this order: Overdue, Available, Rented, Under repair, Temporarily unavailable.

**Provide:**
- `status`: `overdue` | `available` | `rented` | `repair` | `unavailable` | `retired`
- `lang`: `si` | `en`
- optional `detail`, such as "+3h 05m", "AC fault" or "back 25 Oct"
- optional `size="sm"` for rows

**Rules:**
- **Overdue is the only solid chip** (white on `overdue`). Every other status is a soft fill. Overdue therefore differs from Available by lightness (5.7:1), not by hue alone.
- **Overdue shows hours past the deadline, never a running fee.** Late charges are a staff decision.
- **"Available" claims only the record state.** If the morning check could not find the car, add a warning on the card. Don't change the chip.
- **The word "garage" is never used for Under repair.** It is reserved for the garage-day charge.
- The Sinhala labels are drafts for SNS review.

Pattern references (Mobbin):
- [Square item library — thumbnail rows with text + icon status pills and filter counts](https://mobbin.com/screens/78f2c018-e2c9-440c-8b5c-e631b2539163)
- [Airtable gallery — photo on top, labelled fields, status pill under its label](https://mobbin.com/screens/0e9a986f-01cd-4332-ac89-ba5c36853ae3)
- [Turo host "Your car" — icon + label rows, status card with a word and a one-sentence explanation, labelled bottom tabs](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)
- [Stripe transactions — status tabs with counts; pills pair icon and word](https://mobbin.com/screens/13552fc2-7c1b-4e50-80e6-6166a7403a13)
