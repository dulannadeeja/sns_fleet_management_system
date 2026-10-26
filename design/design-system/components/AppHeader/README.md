# AppHeader
The light desktop top bar. Left to right:

1. The page title and subtitle.
2. Search.
3. A "New rental" button.
4. The සිං / EN switch.
5. The signed-in person: an initials avatar, with name and role.

Decided by Dulan on 25 Oct 2026, together with the labelled sidebar (`NavRail`).

**Provide:**
- `title`, optional `subtitle`
- `searchHref` (link to the search screen) and optional `search` (the placeholder words). Without `searchHref`, `search` renders a plain input as before.
- `newHref`: the "New rental" link, optional `newLabel`
- `user`, `role`, `lang`, `onLang`, `showMark`

**Rules:**
- **"New rental" only for people who can start a rental,** and never inside the new-rental flow. Partners get neither search nor "New rental".
- **Search is on every owner and staff screen.** It opens the search screen (plate, name, NIC, phone or rental number), so it is never a decorative box.
- **When the bar is narrower than 1,100px** (a 1280 screen with the sidebar), the person shows as the initials avatar only. Name and role stay in its tooltip and for screen readers. At 1,100px and wider, name and role show beside it.
- **One primary button in the bar.** "New rental" is the only filled button; the page's own main action stays in the page.

Pattern references (Mobbin):
- [Shopify admin: search in the top bar, account at the right](https://mobbin.com/screens/a2704a6b-d772-46e4-b7e6-26653af6d44f)
- [Jobber: Create button kept in reach on every screen](https://mobbin.com/screens/9d13e7c9-3793-49e8-b1b8-016d669aec25)
