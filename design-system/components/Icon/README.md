# Icon
The SNS line-icon set: 24px grid, 1.75px round stroke, drawn in `currentColor` so it takes the colour of the text beside it.

**Use:** `<Plate.Icon name="car" size={20} />`. Provide `name` (see the preview for every name) and optionally `size` and `title`.

- **Always pair an icon with a visible word.** Navigation, actions and statuses never rely on an icon alone. The client is new to software, and an icon by itself is a guess.
- **Without `title`** the icon is hidden from screen readers (decorative next to its label). Set `title` only when the icon stands alone inside a labelled control.
- **Meanings are fixed.** `clockAlert` = overdue, `check` = available or done, `key` = rented, `wrench` = under repair, `pause` = temporarily unavailable, `link` = matched (never a tick), `unlink` = unmatched, `lock` = finalised or locked, `eyeOff` = provisional (the partner cannot see it), `hourglass` = waiting, `question` = not found at the morning check.
- **`arrowLeft`** is the back arrow (used by `PageHeader`). Don't rotate `arrowRight` for it.
- **Don't** use emoji as status or icons (the proposal's ⏳ is replaced by `hourglass`).

Pattern references (Mobbin):
- [Jobber create menu — every quick action is an icon plus a word](https://mobbin.com/screens/85be30de-6c55-4b32-a446-5caff51d4595)
- [Evernote — labelled bottom tabs and labelled action tiles](https://mobbin.com/screens/994d7f92-f1a5-44f8-9126-4a032d4bf71a)
- [Mercury — icon-only bottom tabs (counter-example: not used)](https://mobbin.com/screens/ddcbfcf1-b1c2-49c3-89e4-f68d768a7bf3)
