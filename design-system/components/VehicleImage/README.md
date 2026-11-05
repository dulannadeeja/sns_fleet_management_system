# VehicleImage
The car's model image from the SNS vehicle PNG pack v2: a soft 3D car seen from the front three-quarter, on a transparent background. Every car on every screen shows it.

**Provide:**
- `model`: the model name as SNS writes it ("Wagon R", "Alto", "Every", "Prius", "Axio", "Spacia"). Anything else shows the generic car.
- `size`: `lg` for heroes wider than 128 CSS px (512px file); leave it out for thumbnails, rows and cards (256px file).
- `label`: only when no visible word next to it names the car. Otherwise the image is decorative (`alt=""`).
- **Give its slot a size.** The image fills its slot (`width: 100%; height: 100%`, `object-fit: contain`), so the slot or its parent needs a height. The whole car is always visible; it is never cropped.

**Rules:**
- **The plate stays the identifier.** The image only helps staff spot the kind of car.
- **Never tint, recolour, flip or crop it,** and never put a status, price, plate or text on it. Those belong beside it.
- **The pack's colour is not the car's colour.** Every car shows the same pearl silver-grey; the system design has no car colour field.
- **Thumbnails at least 56 × 44 px,** on `sunken` or `card`. Tall cars (Wagon R, Spacia, Every) fill the height first.
- **Images for families SNS does not run yet** (Hustler, van, SUVs, pickup, station wagon, premium sedan) exist in the pack for later. Showing them does not add a car type, price or rule.

| Model | Pack image |
| --- | --- |
| Wagon R | `wagon-r` · tall hatchback |
| Alto | `alto` · compact hatchback |
| Spacia | `spacia` · mini MPV |
| Every | `every` · microvan |
| Prius | `prius` · liftback |
| Axio | `axio` · sedan |
| anything else | `generic` |

Source: `E:\sns_fleet_managment_system\brand\vehicles` (v2, 14 images at 1024, 256, 128 and 64 px; prompts and checks in its `manifest.json`). Here, 256px files and 512px copies made from the 1024px export are kept in the Vehicles asset group. In the app, serve the pack's own files and point the bundle's `VIMG` map at them.

Pattern reference (Mobbin):
- [Uber — Choose a ride: one soft 3D car image per ride type, beside the name and price](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea)
