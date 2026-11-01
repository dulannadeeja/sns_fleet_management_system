# Plan: #28 Email one-time codes and email reset for owner and admin

## Goal
The owner and the admin each have a confirmed email. Signing in on a new device asks for a 6-digit code emailed to it (AT-61). They can reset their own forgotten password by an emailed link. The owner sets and changes these emails; a new email counts only once a code sent to it is typed in.

## Inherited, not re-decided
- System design 3.1 "Sign-in safety" (Confirmed, DN-03: email codes on a new device, email reset for owner and admin, no SMS); PRD ST-01.1, ST-15.2; AT-61; TRD T3, T8, §6, §13.
- #14: phone + password, lockout (counted before the check), `OPEN_PATHS` allowlist. #15: roles, owner-only people changes with their log entry.

## Decided with Dulan, 1 Nov 2026 (system design 3.1 "Email codes and email reset", Proposed)
1. A device is one browser; remembered 30 days after a code; each sign-in there starts the 30 days again (Better Auth's trusted-device cookie works this way; a fixed limit would need extra code: told to Dulan).
2. Code: 6 digits, once, 10 minutes, 5 wrong tries then a new one; at most one a minute; wrong codes count toward the 15-minute lock.
3. Owner's email at setup (`people:add --role owner --email`); admin's on 15.4 (required for Admin); the owner changes either on 15.6. A new email is confirmed by a code typed in; until then codes go to the last confirmed email (or the new one if none).
4. "Forgot password?": phone number → if owner/admin with a confirmed email, a link (1 hour, once) → set a new password (8+, twice) → all sessions end. Same answer whatever the number.

## Approach (technical)
- Better Auth `twoFactor` plugin with OTP only: `otpOptions { sendOTP, period: 10, allowedAttempts: 5, storeOTP: 'hashed' }`, `trustDeviceMaxAge` 30 days. `user.twoFactorEnabled` is set by SNS, not by the person: true for owner/admin with an email to send to. Two-factor table (TOTP secret) required by the plugin schema; unused.
- `OPEN_PATHS` adds `/two-factor/send-otp`, `/two-factor/verify-otp`, `/request-password-reset`, `/reset-password`, `/reset-password/:token`. Better Auth's rate limit turned on for `send-otp` (1 a minute) and reset requests.
- Wrong codes: an after-hook on `verify-otp` counts a failure on the account (same update as sign-in), so the lock applies.
- Email columns: `user.email` stays the confirmed address (or the placeholder), `email_verified` true once confirmed; `pending_email` holds a new one. `sendOTP` sends to the confirmed address, or to the pending one if none; a correct code sent to the pending address confirms it.
- Changing a confirmed email: 15.6 saves it as pending (logged). At the person's next sign-in, `/confirm-email` (01.7) sends a code to the pending address; typing it confirms (logged). "Later" keeps the old address.
- Reset: our server action takes the phone number, finds an owner/admin with a confirmed email and calls `auth.api.requestPasswordReset`; `sendResetPassword` emails the link; `resetPasswordTokenExpiresIn` 3600; `revokeSessionsOnPasswordReset`. After a reset the lock and count are cleared and `must_change_password` false.
- Mail: `src/mail/send.ts`. Resend HTTPS API when `RESEND_API_KEY` is set; otherwise, outside production, append to `MAIL_OUTBOX_FILE` (tests read it) and, in development, print the email to the dev server's console so a developer can sign in. Production without the key refuses to send. Sinhala and English text by the person's language.
- Screens (boards first): 01.4 Sign-in code, 01.5 Forgot password, 01.6 New password, 01.7 Confirm your email; 01.1 gets "Forgot password?"; 15.4 email box for Admin; 15.6 email row and change form (also on the owner's own page).

## Out of scope
SMS (never); partner emails; the go-live checklist item "owner and admin emails confirmed" (ST-01.3, its own ticket).

## Seams under test
- `tests/at/at-61.test.ts`: an admin with a confirmed email signs in on a new device: no session yet, a code is in the outbox; a wrong code fails; the right code finishes sign-in and trusts the device; a second sign-in with the trusted cookie needs no code.
- Codes: expired after 10 minutes (clock moved), 5 wrong then refused, wrong codes count toward the lock; staff never get a code.
- Email confirm: a pending email is confirmed only by its code; the old one keeps receiving codes until then; changes logged; owner-only.
- Reset: unknown number, staff number and owner number all get the same answer; only owner/admin get mail; link works once, within 1 hour; sessions end.
- Browser: code step, forgot password, new password, confirm email at desktop and phone; email on 15.4/15.6.

## Tasks (test first)
1. Boards 01.4–01.7, 01.1 link, 15.4 and 15.6 email; render; viewer; Dulan checks.
2. Mail module with test outbox. VALIDATE: unit test.
3. Schema: `pending_email`, two-factor table; Better Auth twoFactor; OPEN_PATHS; `twoFactorEnabled` from role and email. AT-61.
4. Wrong-code counting; send limit.
5. Email set/change/confirm in the people module and `people:add --email`.
6. Reset request and new password.
7. Screens and browser tests; `app/AGENTS.md`.

## Validation at the end
`validate`; screenshots against the boards; `review-changes`; `ship` (closes #28).
