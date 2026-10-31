# VehicleRow
The compact car line: thumbnail; the plate and status chip on top; model · owner · next event below; an arrow. Use it in lists (inside a `ListCard` as a `car` row), pickers and the home screens' "cars that need a look".

**Provide:** the same data as `VehicleCard`, plus `href` to make the row a link.

- **Keep the thumbnail.** The confirmed preference is photo plus plate together, even in compact lists.
- **Rows are at least 72px tall**, and the whole row is the tap target.
- The full gallery stays on 04.1 All cars; a list of `VehicleRow`s links to it.

Pattern references (Mobbin):
- [Square item library — thumbnail rows with text + icon status pills and filter counts](https://mobbin.com/screens/78f2c018-e2c9-440c-8b5c-e631b2539163)
