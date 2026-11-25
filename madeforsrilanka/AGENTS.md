# madeforsrilanka/: MadeForSriLanka website design

A separate project (Dulan's tour website), kept here for safe keeping. The SNS Rent Car rules and documents do not apply to it, and it must not change anything outside this folder.

## Rules
- `website/DESIGN.md` is the source of truth for the design. Its "Navigation — LOCKED" section changes only when Dulan asks.
- Record every new decision in `decisions.md` with the date and who decided.
- The live copies on claude.ai are refreshed from these files, never edited by hand.
- Never invent data; label sample prices, names and reviews.
- Never name or attack a competitor. No "without limits" claims.

## Checks
- Open pages through a local server (see `README.md`); check a phone width (390 px) and a computer width for sideways scrolling and errors.
- `node scripts/audit.mjs` from the repository root must pass.
