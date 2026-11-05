# Audits

Dated records of reviews of the project. A record is never edited after it is written; its paths and counts describe the files as they were that day.

| Audit | What it covered | Where it came from |
| --- | --- | --- |
| `2026-10-26/` | The Plate design snapshot, tokens, components, agent files and the system design, with 19 findings (F01 to F19), and the typography fix (`TYPOGRAPHY_FIX.md`) | Made on Dulan's computer in the older folder layout (`design/`, `.agents/`, `CHANGELOG.md`, 171 screens); brought here on 26 Oct 2026 from branch `local-2026-10-26` |

## 2026-10-26: findings checked against `development` on 26 Oct 2026

| Finding | Status now | Note |
| --- | --- | --- |
| F01 missing phone PNG | Fixed | 183 boards, 183 PNGs, checked by `node scripts/audit.mjs` |
| F02 `support.js` absent | Open | Screens still reference it; previews are made by `screens/tools/render.mjs` instead |
| F03 `--rail` token 128px, sidebar 264px / 104px | Open | |
| F04 touch minimum 44px or 48px | Open | `tokens.json` says 48px |
| F05 heading font | Fixed | Headings in Gemunu Libre in `tokens.json`, `tokens.css` and the guidebook, 26 Oct 2026 |
| F06 letter-spacing outside plates | Open | `bundle.css` line 234 |
| F07 money-state blue | Open | |
| F08 catalogue photo shown as approved | Fixed | CR-001 agreed by the owner (ADD-003) |
| F09 fuel contradiction | Fixed | Fuel decided (DN-06) |
| F10 commercial-readiness wording | Open | System design, Readiness and next steps |
| F11 component manifest | Open | |
| F12 vehicle fallback docs | Open | |
| F13 `href="#"` placeholders | Open | 16 boards |
| F14 preview fonts | Partly fixed | Previews load the repository's fonts; `bundle.css` loads them first, Google Fonts only as a fallback for the online viewers |
| F15 Matched without "by" | Open | |
| F16 snapshot provenance | Superseded | The repository is now the master; there is no separate snapshot |
| F17 historical references | Fixed | No "Ratna" or "Concept A" in the guide |
| F18 "Finalised" called navy | Open | `StatePill/README.md` |
| F19 sample labels at point of use | Open | |
