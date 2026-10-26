# VehicleCard
The gallery card: model image (or a photo), status chip over the photo corner, a large plate, then model and ownership, any warning, and one "next event" line. Tapping it opens the vehicle.

**Provide:**
- `plate`, `model`, `status`
- optional `statusDetail` and `next` (one line, such as "Return · Fri 23 Oct 8:00")
- `partner` (boolean) and `partnerName`. Show the name to owner and admin only.
- optional `photo` (URL). Without one, the card shows the model's `VehicleImage`
- optional `warning` `{label, icon}`
- `canAddPhoto` (true for admins only; shows "Photo නැහැ · එකතු කරන්න" when there is no photo) and `onClick`

The car's own photo is optional and admin-managed: system design §4.2, Proposed under CR-001.

**Rules:**
- **Overdue cards get a 2px `overdue` border** and sort first.
- **One warning line at most.** It is always a word plus an icon, such as "not found at 7:30 check".
- **No prices, ratings or decorative badges** on the card.
- **Grid: about 6 per row on desktop and 2 on mobile.** Use `VehicleRow` when more than about 12 cars must fit on one screen.

Pattern references (Mobbin):
- [Turo — large photo cards in a grid](https://mobbin.com/screens/137de559-4e47-4738-8cfa-b026f91e108f)
- [GetYourGuide — photo cards with a label chip laid over the photo corner](https://mobbin.com/screens/5fedc64d-a918-40e7-ab60-d98e45425ec7)
- [Airtable gallery — photo on top, labelled fields, status pill under its label](https://mobbin.com/screens/0e9a986f-01cd-4332-ac89-ba5c36853ae3)
- [Setel — vehicle card with the registration as headline, model underneath](https://mobbin.com/screens/bc22fcd8-ab06-41ea-ad15-c9869adf0f16)
- [Lloyds — vehicle page: large photo, renewal tiles (MOT, tax) with icon + label + date, dashed tiles for missing items](https://mobbin.com/screens/9f05b39a-3e76-488d-849d-81273fb6b96d)
