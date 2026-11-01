# Plan: #18 Cars: list, details, add and edit with package terms (ST-04.1 to ST-04.3)

## Goal
Everyone who works at SNS sees every car with its owner, package and status; the owner and admins add and edit a car and its package and terms; staff see a car without the partner's terms.

## Decided (Dulan, 1 Nov 2026; Proposed in system design 4.1, 4.2)
- Cars before partners (#20 links partner cars, as boards 11.1 and 11.3 show); a partner car shows "not linked yet".
- Models: the six with starting packages (4.1); a new model comes with #21.
- One car per registration number.
- The SNS commission: seen with "See partner earnings and terms", changed with "Add or edit partners"; the rest with "Add or edit cars and packages".
- New board 04.8 Add a car.

## Approach
- `vehicle` (registration unique, model, ownership) and `vehicle_terms_version` (insert-only; newest applies to new rentals; `termsAt` gives what a rental agreed at a time keeps). Migration 0013.
- `src/modules/cars/cars.ts`: `addCar` (starting package + 4.2 defaults), `editCar` (only changed fields, stale check, one log entry per field with old and new), `listCars`, `getCar`, `termsAt`.
- Pages `/cars` (04.1), `/cars/[id]` (04.2/04.3), `/cars/[id]/edit` (04.4), `/cars/new` (04.8). `AppFrame` and a shared menu (`railItems`). PlateBadge and StatusChip ported.
- Status is "Available" for every car until #22; papers, service and photo are #23; who pays which costs is #20.

## Seams under test
- `tests/at/at-05.test.ts` (car half, partial): a change adds a version; the old one applies before, the new one after; old versions cannot be changed.
- `tests/cars.test.ts`: starting packages and defaults, plates, models, bounds, permissions (commission), stale forms, the list.
- `tests/e2e/cars.spec.ts`: the owner adds and edits a car; staff see it without terms and get 403 on add and edit.
