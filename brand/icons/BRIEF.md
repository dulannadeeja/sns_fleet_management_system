# SNS launcher icon pack · brief

Status: **Brief only, nothing generated yet.** Requested by Dulan on 25 October 2026. You generate the images, put them in this folder, and I integrate them into the Plate design system and the screens.

## Where the icons go

Only on **launcher tiles**: the phone "More" menus.

- **02.6 Staff · More** (5 tiles, 2 per row)
- **02.5 Owner · More** (15 tiles, 3 per row, under the existing group headings)

These menus become tiles like [Grab](https://mobbin.com/screens/03a1e8f4-90df-4f9e-9469-a35baf68cdfc), [Careem](https://mobbin.com/screens/b1559fe6-7770-40f7-b6a2-cf02f085e9dc) and [Urban Company](https://mobbin.com/screens/63710c41-3195-4a78-8183-132fdeacd8e1).

Each tile holds:

- the icon at 56 CSS px
- the Sinhala label, with the English echo below it

**Not used for:**

- car status, money states, warnings, the desktop sidebar or the phone tab bar, which keep the line `Icon` set
- done screens and empty states (not chosen)
- points, streaks or badges for staff (not chosen; would score people)

## Style (must match the SNS vehicle PNG pack)

- **Look:** soft simplified 3D, like a small digitally sculpted miniature. Smooth broad surfaces, soft rounded bevels and satin finish. Not photographic.
- **Colour:**
  - Base material is pearl light grey (the vehicle pack's body colour), with charcoal `#2c3330` for dark parts.
  - Each icon gets **one accent colour**, set by its menu group (table below).
- **Light and camera:** soft upper-left light, slightly elevated three-quarter view, very subtle contact shadow.
- **Canvas:**
  - Square, genuine transparent background, no floor.
  - The object fills about 72% of the width, centred.
  - It must read clearly at 56 px.
- **Never in the image:**
  - text, letters or numbers (Sinhala or English)
  - currency signs, logos, number-plate characters or faces
  - the plate yellow `#f6c343`, the action blue `#1756a9`, or status red, green or orange

### Accent colours (one per group, matching the sidebar groups)

| Group | Accent | Hex |
| --- | --- | --- |
| Cars and rentals | Soft teal | `#3f9ea6` |
| Money | Soft lavender | `#8b7fd3` |
| Running SNS | Dusty mauve | `#b07a9c` |
| Today and search | No accent (pearl and charcoal only) | — |

## The 18 icons

| id | Used for | Group | Object (what to draw) |
| --- | --- | --- | --- |
| rentals | කුලී · Rentals | Cars and rentals | A clipboard with a small car key resting on it |
| customers | පාරිභෝගිකයෝ · Customers | Cars and rentals | Two stacked contact cards, each with a plain round avatar circle (no face) |
| all-cars | වාහන 30 · All cars | Cars and rentals | A small pearl hatchback miniature on a round teal turntable |
| partner-owners | Partners · Partner owners | Cars and rentals | Two simple rounded mitten hands shaking, a car key ring hanging from one |
| morning-check | උදේ check · Morning check | Today | A clipboard with a large tick, a small sun rising behind it |
| search | හොයන්න · Search | Today | A magnifying glass over a blank number-plate shape (pearl, no characters) |
| expense | වියදමක් / වියදම් · Expenses | Money | A curling paper receipt with one plain coin beside it |
| my-payslip | මගේ පඩිපත · My payslip | Money | One pay envelope, flap open, a folded slip peeking out |
| payroll | පඩි · Payroll | Money | A neat stack of three pay envelopes |
| close-day | දවස වහන්න · Close the day | Money | A closed cash box with a padlock, a small crescent moon above |
| bank-card-check | Bank සහ card · Bank and card check | Money | A plain bank card and a paper statement joined by a chain link |
| received-by-staff | Staff අනුව · Received by staff | Money | A small stack of plain banknotes with a blank name tag on a string |
| partner-cashouts | Partner ගණන් · Partner cash-outs | Money | An open wallet with a car key fob clipped to it, two coins in front |
| maintenance | නඩත්තුව · Maintenance | Running SNS | A crossed wrench and spanner in front of a small tyre |
| reports | වාර්තා · Reports | Running SNS | Three rounded 3D bars rising on a small base |
| settings | සැකසුම් · Settings | Running SNS | A soft gear with a small toggle switch beside it |
| ready-to-start | පටන් ගන්න · Ready to start | Running SNS | A round engine start button on a small dashboard plate |
| activity-log | සිදු වූ දේ · Activity log | Running SNS | An open notebook with a small clock leaning on it |

## Prompt (use for each icon; swap in the object and accent)

> Use the attached SNS vehicle illustration as the STYLE reference only. Create a simplified soft 3D UI category icon, like a small digitally sculpted miniature, NOT a photograph. Object: **[object from the table]**. Materials: pearl light grey satin as the main material, charcoal #2c3330 for dark parts, and one accent colour **[accent hex]** on one or two parts only. Soft rounded bevels, smooth broad surfaces, few seams, controlled matte highlights. Slightly elevated three-quarter view, soft upper-left lighting, very subtle contact shadow. One centred object filling about 72 percent of the SQUARE canvas width with broad transparent margins. Genuine transparent alpha background, no floor or backdrop. No text, letters, numbers, currency signs, logos, faces, plate characters or watermark. No yellow, no bright blue, no red, green or orange. Readable at 56 pixels. Original SNS illustration, calm and functional.

Generate all 18 in one session with the same reference image so they match. Check them side by side before exporting.

## Files to put in this folder

- `1024/sns-icon-<id>.png`, `256/sns-icon-<id>.png` and `128/sns-icon-<id>.png` (transparent RGBA, square, bicubic downscale)
- `preview.png`: all 18 on the Plate grey `#eef1f0`, for checking only
- `manifest.json`: for each icon, its id, label, group, accent and the exact prompt used (same shape as the vehicle pack)

## What happens when they arrive

1. I check every file: transparency, square size, no text, accents within the four groups, and that it reads at 56 px.
2. **Design system first.**
   - Add a `LauncherTile` component (icon, Sinhala label, English echo, `href`, optional count) and a "Launcher icons" asset group.
   - Update the imagery rule in the README: "3D objects only on launcher tiles; line icons everywhere else".
3. **Screens.** 02.5 Owner · More and 02.6 Staff · More switch from list rows to tile grids, then I re-measure and render both.
4. **Records.** One `CHANGELOG.md` line (visual change, no rule). The system design and the proposal don't change.
