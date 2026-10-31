# BottomTabBar
The phone navigation: four tabs, each an icon above a visible label inside a pill that fills when active, plus an optional raised centre action for the most frequent job (staff: අලුත්, new rental).

**Provide:** `tabs` `[{icon, label, href, active, badge}]` and optional `fab` `{icon, label, href, active}`. The centre action always has its label under it. With `href` each tab is a real link; `onClick` still works in the app.

Every phone screen with tabs uses this component (39 screens, moved from hand-built bars on 25 Oct 2026).

- **Never icon-only.** Mercury's icon-only bar is the counter-example.
- **The owner gets:** වාහන · අවධානයට · මුදල් · අනුමැති · තවත් (Vehicles, Attention, Money, Approvals, More).
- **An employee gets:** වාහන · කුලී · අලුත් · ලාච්චුව · තවත් (Vehicles, Rentals, New, Drawer, More).
- **`label`**: the bar's name for screen readers (default "ප්‍රධාන මෙනුව · Main menu"); pass it from the app's language files.

Pattern references (Mobbin):
- [Turo host "Your car" — icon + label rows, status card with a word and a one-sentence explanation, labelled bottom tabs](https://mobbin.com/screens/ef84529b-4cb3-43c0-add4-edb30f96cd6a)
- [Evernote — labelled bottom tabs and labelled action tiles](https://mobbin.com/screens/994d7f92-f1a5-44f8-9126-4a032d4bf71a)
- [Mercury — icon-only bottom tabs (counter-example: not used)](https://mobbin.com/screens/ddcbfcf1-b1c2-49c3-89e4-f68d768a7bf3)
- [Qantas — tile labels that wrap to two lines](https://mobbin.com/screens/e172e8f4-d9cf-438d-b3f4-5cae2e7c00f8)
