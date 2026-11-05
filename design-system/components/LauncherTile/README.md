# LauncherTile and LauncherGrid
A tile that starts a job or opens a section: 3D icon (56px) over the Sinhala label, the English echo under it, an optional short note and count. `LauncherGrid` puts tiles under a group heading.

**Provide:** `LauncherGrid` `title`, `columns` (2, 3 or 4–5 on desktop), `items` `[{icon, label: 'සිංහල · English', href, sub, badge, badgeTone}]`.

**Used on:** 02.5 Owner · More (3 columns), 02.6 Staff · More (2 columns, with notes), staff home quick actions (2 columns on phones, 5 on desktop).

**Rules:**
- **Always a word under the icon.** Sinhala first, English below in the quieter voice.
- **Three or more columns** set labels at 14px (the minimum) so long Sinhala words fit whole.
- **A count** uses the same rule as the sidebar: red only for overdue.

Pattern references (Mobbin):
- [Grab home: 3D object per service tile](https://mobbin.com/screens/03a1e8f4-90df-4f9e-9469-a35baf68cdfc)
- [Careem services grid](https://mobbin.com/screens/b1559fe6-7770-40f7-b6a2-cf02f085e9dc)
- [Urban Company: object tiles with a label under each](https://mobbin.com/screens/63710c41-3195-4a78-8183-132fdeacd8e1)
