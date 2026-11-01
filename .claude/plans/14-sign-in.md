# Plan: #14 Sign in and first password

## Goal
Everyone signs in with their phone number and password (Better Auth). Passwords have at least 8 characters; 5 wrong tries lock the account for 15 minutes. A person with a first (or reset) password reaches nothing else until they set their own, and picks their language there.

## Inherited, not re-decided
- System design §3.1 Accounts (sign-in, sign-in safety), PR-01 (Sinhala default), PR-06; DN-03 (8+ characters, 5 tries → 15 minutes, no SMS).
- PRD ST-01.1, ST-01.2; AT-46 (sign-in half), AT-60. Proposed check (not Confirmed): first password blocks everything else.
- TRD T3, §6 (Better Auth, phone-number plugin, password hashed by the library, sessions in the database in secure http-only cookies, lockout by a hook), §13.
- Dulan, 1 Nov 2026: email one-time codes and email reset go to #28; the sign-in page does not offer email reset until then.
- Screens 01.1 Sign in, 01.2 First sign-in · set password.

## Approach (technical, decided here)
- **Better Auth 1.7.10** (newest release at least two weeks old), Drizzle adapter, UUID ids, `phoneNumber()` plugin with no OTP, `nextCookies()` last. Checked in the package source: `auth.api.signInPhoneNumber` (`/sign-in/phone-number`), `sendOTP` optional.
- No Better Auth admin plugin: its roles would duplicate SNS's own `permission_grant` table (TRD §6, #15).
- **Extra user fields** (`additionalFields`, never set from client input): `mustChangePassword` (default true), `language` ('si' default), `failedSignIns`, `lockedUntil`.
- **Lockout** (AT-60): `hooks.before` on `/sign-in/phone-number` refuses while `lockedUntil` is in the future, even with the right password; `hooks.after` counts a failure, locks at 5 for 15 minutes and resets the count; a success resets it. Per account, not per IP.
- **First password gate**: one server helper `requireUser()` used by every signed-in page and, later, every server action: no session → `/sign-in`; `mustChangePassword` → `/first-sign-in`. The first sign-in action changes the password through Better Auth, clears the flag, saves the language.
- **Language**: the user's saved language drives next-intl (`src/i18n/request.ts`); Sinhala when signed out.
- **People exist before #15** through `npm run people:add` (dev and go-live setup; prints nothing secret back), and through a test helper.
- **Placeholder email**: Better Auth's user table needs an email; people without one get `<id>@no-email.invalid` (never sent to; #28 adds real addresses for owner and admin).
- **Design system first**: a `TextField` component (label, hint, required mark, error) matching boards 01.1 and 01.2; then ported with `Button`.

## Out of scope
Email codes and reset (#28); permissions, people screens, owner reset of a password (#15); partner pages.

## Seams under test
- `tests/at/at-60.test.ts`: 5 wrong passwords → the 6th try, even correct, is refused; after 15 minutes (clock moved in the database) the right password works.
- `tests/at/at-46.test.ts`: a person with a first password signs in, is sent to first sign-in, cannot open another page, sets a new password (8+), then reaches the app; the old password no longer works.
- Unit: `requireUser` redirects; password rules (7 characters refused; the two entries must match); language saved.
- Browser: sign in on desktop and phone sizes; first sign-in flow; a locked account's message.

## Tasks (test first)
1. Design system: `TextField` (index.d.ts, bundle.js, bundle.css, README, preview); sync; port `TextField` and `Button` with tests.
2. Better Auth: schema (generate with the auth CLI, check UUIDs, add the extra fields), migration, `src/auth/server.ts`, route `app/api/auth/[...all]/route.ts`. Test: a person added by the helper signs in.
3. AT-60 test → lockout hooks.
4. AT-46 test → `requireUser`, `/first-sign-in` page and action, language saving.
5. `/sign-in` page and action (screens 01.1), messages from `si.json`/`en.json` (wrong password, locked, too short, not the same).
6. `npm run people:add`; `app/AGENTS.md`; browser tests.

## Validation at the end
`validate`; screenshots against boards 01.1 and 01.2 at 1280 and 390; `review-changes`; `ship` (closes #14).
