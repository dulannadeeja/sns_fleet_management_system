# FleetStrip
The whole fleet in one line: one rounded tick per car, in the fixed status order, with a worded legend and counts that filter the gallery.

**Provide:** `cars` `[{plate, status, warn}]`, `lang`, and `hrefs` `{overdue, available, rented, repair, unavailable}`: the list each legend entry opens. A status without an href shows as plain text, never as a dead link.

- **It is data, not decoration.** Thirty ticks are thirty cars, so the owner sees the shape of the day before reading a number.
- **Ticks never stand alone.** The legend below always names each status with icon, word and count.
- **A tick with a warning** (not found at the morning check) carries an amber inner ring.

Pattern references (Mobbin):
- [Polestar: one bold data graphic carrying the screen](https://mobbin.com/screens/2a951757-674c-4479-95a8-5fa820009c05)
- [Jobber home: workflow counts](https://mobbin.com/screens/850e0dd4-ef8e-45a8-846d-c6545868509c)
