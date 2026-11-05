# PageHeader
The phone page header: a back link, the page title (Sinhala · English) and a subtitle such as who and when. Added on 25 Oct 2026; every phone screen with a back arrow uses it (69 screens).

**Provide:** `backHref`, `title`, optional `subtitle`, `backLabel` (default "ආපසු · Back"), `numeric` (sets the title in the figure font, for rental numbers like R‑0218), and optional children for one action at the right.

**Rules:**
- **The back link is a real link** to the screen the person came from in the flow, always on the same device.
- **One line of title.** Long titles wrap rather than truncate; Sinhala first.
- **No tabs on flow screens.** Screens inside a flow (new rental, return, payment) have a back link and no tab bar; top-level screens have the tab bar and no back link.

Pattern references (Mobbin):
- [Turo host "Your car": back arrow, title and labelled content](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)
