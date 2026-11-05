# 06 · Vehicle imagery

- **Every car shows its model's image (`VehicleImage`)** from the SNS vehicle PNG pack v2: soft 3D, front three-quarter, transparent, pearl silver-grey, made for the `paper` ground. Wagon R, Alto, Spacia, Every, Prius and Axio each have their own; any other model shows the generic car. Adopted by Dulan on 25 Oct 2026; it replaces the hatch, van and sedan line drawings.
- **The image never carries data.** No plate, status, price or text on it, no tint and no crop; the whole car is always visible. It shows the kind of car, not this car: its colour is not the car's colour.
- **Sizes:** heroes use the 512px file (`size="lg"`); rows, cards and pickers the 256px file, in a slot at least 56 × 44 px.
- **A car's own photo** (optional, one per car, added by an admin on 04.4 Edit car) takes the model image's place in `VehicleCard` and `VehicleRow` (`photo`). Until it is added, the model image shows. System design, Per-vehicle settings; Confirmed under change request CR-001 and addendum ADD-003 (no charge).
- **No other decorative illustrations, gradients, glass effects or stock people.**

**Files:** the vehicle pack is in `brand/vehicles/` (see `brand/vehicles/README.md`); 512px copies in `design-system/assets/vehicles-512/`.
