# Button
Actions are verbs, with an icon plus a word, at least 48px tall.

**Provide:**
- `children`: the verb, in Sinhala by default
- optional `icon`
- `variant`: `primary` | `secondary` | `quiet` | `danger`
- `full` for full-width mobile actions
- `disabled` and `onClick`

**Rules:**
- **One primary button per screen.** On mobile it is full-width at the bottom.
- **Labels are verbs that name the result:** "අලුත් කුලියක්" (new rental), "ආපසු ගන්න" (receive return), "ගෙවීම සටහන් කරන්න" (record payment).
- **When the next step is missing, the button names it.** For example "Upload the signed agreement photo", rather than a vague "Continue".
- **Never leave a disabled button unexplained.** Put a `BlockedPanel` or a `Checklist` next to it. Phones have no hover, so tooltips don't count.
- **Sapphire is the only brand colour on buttons; status colours never fill a primary button.**

Pattern references (Mobbin):
- [Jobber create menu — every quick action is an icon plus a word](https://mobbin.com/screens/85be30de-6c55-4b32-a446-5caff51d4595)
- [Meetup — "Record transaction" / "Record expense" labelled buttons, type pills, "paid using cash (confirmation #)"](https://mobbin.com/screens/a93a0849-8e6a-42b1-81b8-4ad48ee00010)
- [Turo "Next steps" — checklist with "Required" tags; the button names the next missing item](https://mobbin.com/screens/735b3b29-a44f-4f3f-87ec-c7b7ccc56b0c)
