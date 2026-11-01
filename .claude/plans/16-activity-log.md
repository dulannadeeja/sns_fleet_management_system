# Plan: #16 Activity log screen (ST-15.4)

## Goal
The owner, and the admin by default, read the activity log on screen 15.5: who did what, to which record, when, with the reason for exceptional decisions; filter by person and by kind. Nobody can change or delete an entry.

## Inherited, not re-decided
- PRD ST-15.4 (Confirmed; "can't be edited or deleted" is a Derived control, system design 17.3); PR-05; DN-01: the admin sees the log by default, staff do not (catalogue key `seeActivityLog`, admin by default, #15).
- TRD §5: audit events are insert-only (trigger and app-role grants, migrations 0001 and 0002, tested in `tests/db/audit-event.test.ts`); §6 permissions checked by the server.
- Board 15.5 Activity log (Desktop, Phone): one card, "can't be edited or deleted" note, chips for person and kind, rows grouped by day: time, icon, "Actor · what · record", reason in quotes below.

## Approach (technical, decided here)
- `src/modules/activity/activity.ts`: read only (no change functions exist): newest first, 50 per page, filter by person (who acted) and kind; actor and target names joined from `user`; "Older" pages by the time of the last row.
- Kinds from the action name: Settings (`person.*`, `permission.*`), Money, Customers, Cars (their prefixes, filled as later tickets add actions); "Decisions with a reason" = entries whose details carry a reason. Today only Settings actions exist.
- Wording per action in `si.json`/`en.json` (one sentence each); an unknown action shows its raw name. The system (no actor) is "System". Passwords are never in the log (#15).
- Page `/settings/activity-log`: `requirePermission('seeActivityLog')` (the owner always). The Settings list shows Permissions and People only to the owner; Activity log to whoever may see it. The home page links to it for them.
- Times in Asia/Colombo; days as headings.

## Out of scope
Exports; the owner's daily summary of exceptional decisions (Phase 4).

## Seams under test
- Module: newest first; filter by person and kind; "decisions with a reason"; paging; names; staff refused (AT-24 pattern via `accessFor`).
- Derived control: the existing database tests (trigger refuses UPDATE, DELETE, TRUNCATE even for the table owner; the app role has no UPDATE or DELETE) plus a module test that the log offers no change.
- Browser: owner and admin see it at 1280 and 390; staff get 403; filters change the rows; no sideways scroll.

## Validation at the end
`validate`; screenshots against board 15.5; `review-changes`; `ship` (closes #16).
