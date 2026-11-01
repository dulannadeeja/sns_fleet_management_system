# Plan: #15 Permissions and people

## Goal
`requirePermission` guards every server action and page. The owner sets permissions (15.1), sees people (15.3), adds a person with their role's defaults (15.4), and on one person's page (15.5, new) resets a password and turns the account off or on. Every change writes the activity log in the same transaction.

## Inherited, not re-decided
- System design 3.1 Accounts (sign-in, turning off an account), 3.2 Default permissions (the catalogue), Delegation (owner-only: add people, change permissions, turn accounts off or on), PR-05, PR-06; DN-01, DN-03.
- PRD ST-15.1, ST-15.2; AT-24, AT-46 (owner reset half), AT-47; AT-58 (TRD: only the owner changes permissions, adds people or turns accounts off). Proposed checks: a permission change is logged with who and when; a new staff member starts with the staff defaults and must change the first password.
- TRD §4 (`permission_grant`, `audit_event`), §5 (permissions checked by the server; every server action: `requirePermission`, one transaction, log entry), §6 (turning off revokes sessions at once).
- Screens 15.1 Permissions, 15.3 People, 15.4 Add a person; new 15.5 Person.

## Decided with Dulan, 1 Nov 2026 (recorded as Proposed where a rule)
1. The owner types the first password (8+ characters), on add and on reset; a reset ends open sessions. System design 3.1, PRD ST-15.2: Proposed.
2. New board 15.5 Person (desktop and phone) before the code.
3. #15 adds Staff and Admin only; the Partner choice comes with the partners ticket (ST-11.2). Board 15.4 shows it as "comes with Partners".
4. The admin's email waits for #28.
5. Manage payroll and Export reports: admin by default, not staff. System design 3.2, PRD ST-15.1: Proposed.

## Approach (technical, decided here)
- **Roles** on `user.role`: `owner` | `admin` | `staff` | `partner` (partner unused until ST-11.2). Exactly one owner (partial unique index). The owner is made once with `npm run people:add -- --role owner`; a second owner is refused.
- **Catalogue** `src/auth/permissions.ts`: one key per row of system design 3.2, each with its default holders (`staff` and `admin`, `admin`, or none = "authorised person · not set yet"). The three owner-only actions are not in the catalogue: they can never be granted.
- **Grants** `permission_grant (user_id, permission, created_at, created_by)`, primary key (user, permission). A grant is a row; removing deletes it. Not money, so not insert-only; every grant and removal writes `audit_event` in the same transaction. New people get their role's defaults in the add transaction.
- **`requirePermission(permission)`** (server-only): `requireUser()`, then the owner passes, a turned-off person never does, others need a grant. Denied → Next `forbidden()` (403), so a direct request is refused (AT-24). `requireOwner()` for 15.x actions (AT-58).
- **Turning off**: `user.disabled_at`, `disabled_reason`; one transaction sets them, deletes all the person's sessions and logs. Sign-in refuses a turned-off account with the same "wrong" answer (no new message); `requireUser` refuses too. The owner cannot be turned off. Turning on clears both and logs.
- **Reset**: owner types a new first password → hash into `account`, `must_change_password = true`, lock count cleared, sessions deleted, logged; one transaction.
- **Adding** a person moves from Better Auth's internal adapter to one drizzle transaction (user, account, grants, log), with the same hash function (`ctx.password.hash`). Phone must be a Sri Lankan mobile and unused.
- **Screens** with Plate parts; Settings sub-nav shows only the live pages (Permissions, People) as links, the rest as plain text until built. Words in `si.json`/`en.json`. Sample names are labelled in the boards.

## Out of scope
Activity log screen (ST-15.4); partner accounts (ST-11.2); admin email and codes (#28); the full menu by permission (each feature adds its own item).

## Seams under test
- `tests/at/at-24.test.ts`: a staff person without Export reports / Manage payroll is refused by `requirePermission` called directly; with a grant, allowed; a turned-off person is refused.
- `tests/at/at-46.test.ts` (extend): the owner resets a password → old password fails, the new first one works, the person is sent to first sign-in, old sessions end.
- `tests/at/at-47.test.ts`: turned off → sessions gone, sign-in refused with the usual "wrong" answer, their audit rows still name them; turned on → signs in again.
- `tests/at/at-58.test.ts`: admin and staff calling add / set permission / turn off are refused; the owner is allowed.
- Unit: catalogue defaults per role; staff defaults on a new person; every change writes one log row with who and when.
- Browser: 15.1, 15.3, 15.4, 15.5 at 1280 and 390, owner flow; staff opening `/settings/people` gets 403.

## Tasks (test first)
1. Boards: new 15.5 Person (desktop, phone); 15.4 adds the first-password box, Partner "comes with Partners", fixes the language radio group; sample names labelled. Render, check, refresh the canvas viewer. Dulan checks.
2. Schema and migration: `user.role`, `disabled_at`, `disabled_reason`; one-owner index; `permission_grant`; grants for `sns_app`. VALIDATE: `npm run test -- tests/db`.
3. Catalogue + `requirePermission`/`requireOwner` (AT-24, AT-58).
4. People module `src/modules/people/`: add, reset, turn off/on, set permission, each one transaction with its log row (AT-46, AT-47).
5. Sign-in refuses turned-off accounts; `people:add --role`.
6. Screens 15.1, 15.3, 15.4, 15.5; browser tests.
7. `app/AGENTS.md`. VALIDATE: `validate` skill.

## Validation at the end
`validate`; screenshots against the boards at 1280 and 390; `review-changes`; `ship` (closes #15).
