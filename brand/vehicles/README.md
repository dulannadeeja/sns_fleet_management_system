# SNS vehicle PNG pack v2

Status: Adopted. Requested by Dulan on 24 October 2026 and adopted on 25 October 2026. The pack is integrated into the Plate design system (component `VehicleImage`, asset group "Vehicles") and into every screen on the Plate canvas: each car shows its model's image, and other models show the generic image.

14 illustrations at 1024, 256, 128 and 64 pixels: 56 transparent RGBA PNG assets. preview.png shows the full pack; preview-additions.png shows the seven additions. The previews have a Plate grey background and are not UI assets.

Original assets: Alto, Wagon R, Spacia, Every, Prius, Axio and generic fallback. Their exported files are copied unchanged from v1.

Added at the user's request: Hustler-style kei crossover, full-size passenger van, mid-size SUV and large SUV. Suggested future-use additions: double-cab pickup, station wagon and premium sedan. These are illustrative visual categories, not confirmed fleet additions or formal rental classes. No availability, seating capacity, price or operating rule is implied. Hustler and other model-inspired illustrations do not claim exact model-year or manufacturer-approved likenesses.

Artwork was generated with built-in image_gen. Exact prompts are retained in manifest.json. All additions use the revised v1 Alto as their style reference. Exports use ordinary bicubic resampling and retain transparent alpha. No manufacturer logos, registration numbers, UI text, rates or status badges are embedded.

Use 128px assets for 64 CSS-pixel thumbnails on a 2x display; use 256px assets for 128 CSS-pixel thumbnails. Maintain square aspect ratio. Vehicle labels, registration plates, prices and status indicators belong in the application. Use Sinhala-first labels. Use empty alt text when the adjacent visible label already conveys the image meaning; otherwise localize the category description. The generic fallback remains available for unrepresented families.

Visual fit: pearl silver-grey bodywork, charcoal windows, front three-quarter angle, soft highlights, minimal wheel detail. Plate ground is #eef1f0. Yellow and action blue retain their established UI uses. Do not infer fuel type or drivetrain from body shape; those need independent factual UI labels.

Impact analysis (visual task D):
| Area | Affected? | Change | Risk |
|---|---|---|---|
| Source of truth sections 1, 4.1, 14 / AT IDs | No | Read for visual authority, existing families and language | Future illustrations must not imply approved requirements |
| PRD | No | No stories or acceptance criteria | None introduced |
| TRD | No | No schema, API or migration | None introduced |
| Design system | Yes (25 Oct 2026) | `VehicleImage` added, `VehicleSilhouette` superseded, imagery rules in the README, "Vehicles" asset group | None outstanding |
| Screens | Yes (25 Oct 2026) | 223 car drawings on 41 screens replaced by model images; small thumbnails 64×48 | Labels stay beside the image, Sinhala first |
| Proposal / commercial terms | No | Frozen proposal untouched | No promise of new vehicles or services |
| Agent files | No | Instructions untouched | None introduced |
| Code / tests / data | No | Only external export utility and asset pack | No historical data touched |

No final money, historical records, permissions, client promises, prices, scope or business decisions change. The additional illustrations are authorized creative assets, not business rules. Existing v1 deliverables are preserved.

Validation: transparent alpha sampled in every source; dimensions and transparent corners checked for all 56 exports; original 28 export hashes matched against v1; PNG count and ZIP contents verified; full and additions previews visually inspected. This is a pack-level check, not a full SNS sync audit.

Integration (25 October 2026): the design system and canvas hold all 14 images at 256px, plus 512px copies of Wagon R, Alto, Spacia, Every, Prius, Axio and generic, resized with bicubic resampling from the 1024px exports for large images. The files in this folder are unchanged. The source of truth (SNS_SYSTEM_DESIGN.md) and the proposal were not changed, because the images add no rule. A git commit is still pending because the SNS folder is not a git repository yet.
