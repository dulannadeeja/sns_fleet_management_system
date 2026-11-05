import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { phoneNumber } from 'better-auth/plugins/phone-number';
import { twoFactor } from 'better-auth/plugins/two-factor';
import type { GenericEndpointContext } from 'better-auth';
import { sendMail } from '../mail/send';
import { codeMail, resetMail } from '../mail/messages';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { SRI_LANKA_MOBILE } from './phone';
import { MIN_PASSWORD_LENGTH } from './rules';

// Sign-in (TRD › Sign-in and permissions; system design 3.1; DN-03): phone number and password, at least 8 characters;
// 5 wrong tries lock the account for 15 minutes. No SMS, no sign-up: people are added by the owner (#15) or `npm run people:add`.
export const MIN_PASSWORD = MIN_PASSWORD_LENGTH;
export const MAX_TRIES = 5;
export const LOCK_MINUTES = 15;
const SIGN_IN = '/sign-in/phone-number';
// The only Better Auth paths in use. Everything else (email sign-in, resets, password change, profile changes, OTP) is
// refused, so no path can check a password outside the lock and nobody reaches anything before the first password is
// replaced (ST-01.2). Email codes and email reset come with #28.
const SEND_CODE = '/two-factor/send-otp';
const CHECK_CODE = '/two-factor/verify-otp';
// #28: the emailed sign-in code for the owner and the admin, and their email reset (system design 3.1, DN-03).
const OPEN_PATHS = new Set([SIGN_IN, '/sign-out', '/get-session', SEND_CODE, CHECK_CODE, '/request-password-reset', '/reset-password', '/reset-password/:token']);
export const CODE_MINUTES = 10;
export const CODE_TRIES = 5;
export const DEVICE_DAYS = 30;
export const RESET_MINUTES = 60;

/** The person waiting for an emailed sign-in code, from the plugin's signed cookie; null if none. */
async function personAwaitingCode(ctx: GenericEndpointContext): Promise<string | null> {
  const cookie = ctx.context.createAuthCookie('two_factor');
  const identifier = await ctx.getSignedCookie(cookie.name, ctx.context.secret);
  if (!identifier) return null;
  const found = await ctx.context.internalAdapter.findVerificationValue(identifier);
  return found && found.expiresAt > new Date() ? found.value : null;
}

/** Whether this browser holds the plugin's remembered-device cookie for this person, still valid (signed with the
 *  secret; its record in `verification` holds the person's id). */
async function rememberedDevice(ctx: GenericEndpointContext, personId: string): Promise<boolean> {
  const cookie = ctx.context.createAuthCookie('trust_device');
  const value = await ctx.getSignedCookie(cookie.name, ctx.context.secret);
  const identifier = typeof value === 'string' ? value.split('!')[1] : undefined;
  if (!identifier) return false;
  const found = await ctx.context.internalAdapter.findVerificationValue(identifier);
  return !!found && found.value === personId && found.expiresAt > new Date();
}

/** Forgets every remembered device of a person: after a password reset or turning the account off, a code is needed
 *  again everywhere (#28 review). */
export async function forgetDevices(personId: string, run: (q: ReturnType<typeof sql>) => Promise<unknown> = (q) => db.execute(q)): Promise<void> {
  await run(sql`delete from verification where identifier like 'trust-device-%' and value = ${personId}`);
}

const lockedError = (until: unknown) => new APIError('TOO_MANY_REQUESTS', { code: 'ACCOUNT_LOCKED', message: 'Account locked', lockedUntil: until });

/** One try counted before the check; refused if the account is locked (AT-60; wrong codes count too, #28). */
async function countTry(where: ReturnType<typeof sql>): Promise<void> {
  const counted = await db.execute(sql`
    update "user" set
      locked_until = case when failed_sign_ins + 1 >= ${MAX_TRIES} then now() + make_interval(mins => ${LOCK_MINUTES}) else null end,
      failed_sign_ins = case when failed_sign_ins + 1 >= ${MAX_TRIES} then 0 else failed_sign_ins + 1 end
    where ${where} and (locked_until is null or locked_until <= now())
    returning id`);
  if (counted.rows.length) return;
  const { rows } = await db.execute(sql`select locked_until from "user" where ${where} and locked_until > now()`);
  if (rows.length) throw lockedError(rows[0].locked_until);
}

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  advanced: { database: { generateId: 'uuid' } },
  emailAndPassword: {
    enabled: true, disableSignUp: true, minPasswordLength: MIN_PASSWORD,
    // Email reset for the owner and the admin only, to a confirmed email; a link once, for 1 hour; every session ends.
    resetPasswordTokenExpiresIn: RESET_MINUTES * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const u = user as typeof user & { role?: string; language?: string; disabledAt?: Date | null };
      if (!u.emailVerified || (u.role !== 'owner' && u.role !== 'admin') || u.disabledAt) return;
      await sendMail({ to: user.email, ...resetMail(u.language === 'en' ? 'en' : 'si', url) });
    },
    onPasswordReset: async ({ user }) => {
      await db.execute(sql`update "user" set failed_sign_ins = 0, locked_until = null, must_change_password = false where id = ${user.id}`);
      await forgetDevices(user.id);
    },
  },
  user: {
    additionalFields: {
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false, required: true },
      language: { type: 'string', defaultValue: 'si', input: false, required: true },
      failedSignIns: { type: 'number', defaultValue: 0, input: false, required: true },
      lockedUntil: { type: 'date', input: false, required: false },
      role: { type: 'string', defaultValue: 'staff', input: false, required: true },
      disabledAt: { type: 'date', input: false, required: false },
      pendingEmail: { type: 'string', input: false, required: false },
    },
  },
  hooks: {
    // Every try is counted before the password is checked, in one statement that only matches an unlocked account, so
    // many tries at the same moment still get at most 5 checks. The fifth sets the 15-minute lock (and starts the count
    // again); a locked account is refused even with the right password (AT-60). A success clears it (below).
    before: createAuthMiddleware(async (ctx) => {
      if (!OPEN_PATHS.has(ctx.path)) throw new APIError('NOT_FOUND');
      if (ctx.path === SEND_CODE || ctx.path === CHECK_CODE) {
        const personId = await personAwaitingCode(ctx);
        if (!personId) return; // the plugin refuses it
        if (ctx.path === SEND_CODE) {
          // At most one code a minute (#28).
          const sent = await db.execute(sql`update "user" set code_sent_at = now() where id = ${personId}
            and (code_sent_at is null or code_sent_at <= now() - interval '1 minute') returning id`);
          if (!sent.rows.length) throw new APIError('TOO_MANY_REQUESTS', { code: 'CODE_TOO_SOON', message: 'Wait a minute for a new code' });
          return;
        }
        await countTry(sql`id = ${personId}`);
        return;
      }
      if (ctx.path !== SIGN_IN || typeof ctx.body?.phoneNumber !== 'string') return;
      const phone = ctx.body.phoneNumber;
      // A turned-off account answers like a wrong password and is not counted (AT-47; system design 3.1 "Sign-in phone numbers").
      const off = await db.execute(sql`select 1 from "user" where phone_number = ${phone} and disabled_at is not null`);
      if (off.rows.length) throw new APIError('UNAUTHORIZED', { code: 'INVALID_PHONE_NUMBER_OR_PASSWORD', message: 'Invalid phone number or password' });
      await countTry(sql`phone_number = ${phone}`);
    }),
    // A right password with no code to come, or the right code (owner, admin), clears the count and the lock. A right code sent to
    // a first, not yet confirmed email confirms it (#28).
    after: createAuthMiddleware(async (ctx) => {
      const signedIn = ctx.context.newSession;
      if (!signedIn) return;
      // This hook runs before the two-factor plugin's, so after a right password the session is still here even when a
      // code is still to come. Clear the count only when no code is needed: no two-step for this person, or a
      // remembered device (the plugin then keeps the session). Otherwise the right code clears it (CHECK_CODE).
      const needsCode = ctx.path === SIGN_IN && (signedIn.user as { twoFactorEnabled?: boolean }).twoFactorEnabled
        && !(await rememberedDevice(ctx, signedIn.user.id));
      if ((ctx.path === SIGN_IN && !needsCode) || ctx.path === CHECK_CODE) {
        await db.execute(sql`update "user" set failed_sign_ins = 0, locked_until = null where id = ${signedIn.user.id}`);
      } else if (needsCode) {
        // A right password with a code still to come: it was counted before the check; take back just that one try,
        // so it neither counts as wrong nor wipes out earlier wrong tries or a lock.
        await db.execute(sql`update "user" set failed_sign_ins = greatest(failed_sign_ins - 1, 0) where id = ${signedIn.user.id}`);
      }
      if (ctx.path === CHECK_CODE) await confirmFirstEmail(signedIn.user.id);
    }),
  },
  // Only Sri Lankan mobile numbers are accepted, also when called directly (system design 3.1).
  plugins: [twoFactor({
    // Emailed codes only (no SMS, no authenticator app): to the confirmed email, or to the first one until it is confirmed.
    trustDeviceMaxAge: DEVICE_DAYS * 24 * 60 * 60,
    otpOptions: {
      period: CODE_MINUTES, allowedAttempts: CODE_TRIES, storeOTP: 'hashed',
      sendOTP: async ({ user, otp }) => {
        const u = user as typeof user & { pendingEmail?: string | null; language?: string };
        const to = user.emailVerified ? user.email : u.pendingEmail;
        if (!to) throw new APIError('BAD_REQUEST', { code: 'NO_EMAIL', message: 'No email to send the code to' });
        await sendMail({ to, ...codeMail(u.language === 'en' ? 'en' : 'si', otp) });
      },
    },
  }), phoneNumber({
    phoneNumberValidator: (phone) => SRI_LANKA_MOBILE.test(phone),
    // No SMS (system design 3.1); the code paths are closed by OPEN_PATHS anyway.
    sendOTP: () => { throw new APIError('NOT_FOUND'); },
  }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

/** A right code sent to a first email (none confirmed yet) confirms that email (#28). */
async function confirmFirstEmail(personId: string): Promise<void> {
  await db.execute(sql`
    with confirmed as (
      update "user" set email = pending_email, email_verified = true, pending_email = null, updated_at = now()
      where id = ${personId} and email_verified = false and pending_email is not null
        and not exists (select 1 from "user" other where other.email = "user".pending_email and other.id <> "user".id)
      returning id, email
    )
    insert into audit_event (created_by, action, target_type, target_id, details)
    select id, 'person.emailConfirmed', 'person', id::text, jsonb_build_object('email', email) from confirmed`);
}
