# 03 · Typography

- **Yaldevi for every interface word, Sinhala and English.** One family for both scripts keeps a mixed line like "Deposit තියාගෙන · Held, not income" in one voice.
- **Gemunu Libre for plates, money, counts and times** (`plate`, `figure`, and anything marked `rt-num`), with tabular figures so columns line up. Headings use it too: the `display`, `title` and `heading` styles, `h1`, `h2` and the top-bar title. Decided by Dulan on 26 Oct 2026 (audit finding F05).
- **Three weights:** 400 reading, 500 labels, 600 headings, buttons, plates and figures. Never heavier: bold Sinhala loses its vowel signs.
- **Bilingual labels have two voices.** In "සිංහල · English" the Sinhala is the label and the English a quieter echo (`rt-en`).
- **Sizes:** `body` 17px on phones, `body-desktop` 16px on computers, nothing on screen under `caption` 14px. Line height 1.7; let labels wrap.
- **Printed documents** (agreement, receipt, bill, payslip, partner statement) keep body text at 14px or more, but fine print and notes may be 12px (about 9pt on A4). Never below 12px. Decided by Dulan on 25 Oct 2026.
- **No letter-spacing beyond the plate's, no capitals styling, no eyebrow labels.**

**Test before rollout:** Yaldevi text sits a little taller than most screen faces, so screens needed up to about 10% more height. Check it on the staff phones outdoors.

## Font files

The font files and their licences are in `fonts/` (Yaldevi, Gemunu Libre, IBM Plex Mono, all under the SIL Open Font License).

## Type tokens

Values below are copied from `design-system/tokens.json`. If they ever differ, `tokens.json` wins; fix this table in the same commit.

- `sans`: "Yaldevi", "Noto Sans Sinhala", system-ui, sans-serif
- `plate`: "Gemunu Libre", "Yaldevi", "Noto Sans Sinhala", sans-serif

| Style | Family | Size | Line height | Weight |
| --- | --- | --- | --- | --- |
| `display` | plate | 28px | 40px | 600 |
| `title` | plate | 22px | 32px | 600 |
| `heading` | plate | 18px | 28px | 600 |
| `body` | sans | 17px | 29px | 400 |
| `body-desktop` | sans | 16px | 27px | 400 |
| `label` | sans | 15px | 24px | 500 |
| `caption` | sans | 14px | 22px | 400 |
| `plate` | plate | 20px | 26px | 600 |
| `figure` | plate | 26px | 34px | 600 |
