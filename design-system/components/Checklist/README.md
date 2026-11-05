# Checklist
The handover or return gate: each required item shows done (who · when) or missing ("Required"), and the main button names the next missing item.

**Provide:**
- `title` and `progressLabel`
- `items`, each with:
    - `state`: `done` | `missing` | `open`
    - `label`
    - `meta`: who and when, or the value
    - `tag`
    - `icon`
- `footer`: usually the primary `Button`

**Rules:**
- **The confirmed blocking items:** ID copy, licence copy, signed agreement photo, outgoing odometer, and reference-person documents when required.
- **An `open` item has no blocking rule decided yet.** For example accessories ("Blocks handover? — owner decision pending"). Never silently block or allow it.
- **One item per row, at least 64px tall.** Tapping a missing item opens the camera or upload.

Pattern references (Mobbin):
- [Turo "Next steps" — checklist with "Required" tags; the button names the next missing item](https://mobbin.com/screens/735b3b29-a44f-4f3f-87ec-c7b7ccc56b0c)
- [Grab Driver — one large labelled photo slot per document](https://mobbin.com/screens/d8cc7171-fe81-4e90-b8d2-e25fca401981)
- [Starling — what you have (ticks) vs what will be asked (arrows), as two labelled lists](https://mobbin.com/screens/353728f1-c56a-4096-9f8b-7312006f6efb)
