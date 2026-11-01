import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { phoneNumber } from 'better-auth/plugins/phone-number';
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
const OPEN_PATHS = new Set([SIGN_IN, '/sign-out', '/get-session']);

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  advanced: { database: { generateId: 'uuid' } },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: MIN_PASSWORD },
  user: {
    additionalFields: {
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false, required: true },
      language: { type: 'string', defaultValue: 'si', input: false, required: true },
      failedSignIns: { type: 'number', defaultValue: 0, input: false, required: true },
      lockedUntil: { type: 'date', input: false, required: false },
      role: { type: 'string', defaultValue: 'staff', input: false, required: true },
      disabledAt: { type: 'date', input: false, required: false },
    },
  },
  hooks: {
    // Every try is counted before the password is checked, in one statement that only matches an unlocked account, so
    // many tries at the same moment still get at most 5 checks. The fifth sets the 15-minute lock (and starts the count
    // again); a locked account is refused even with the right password (AT-60). A success clears it (below).
    before: createAuthMiddleware(async (ctx) => {
      if (!OPEN_PATHS.has(ctx.path)) throw new APIError('NOT_FOUND');
      if (ctx.path !== SIGN_IN || typeof ctx.body?.phoneNumber !== 'string') return;
      const phone = ctx.body.phoneNumber;
      // A turned-off account answers like a wrong password and is not counted (AT-47; system design 3.1 "Sign-in phone numbers").
      const off = await db.execute(sql`select 1 from "user" where phone_number = ${phone} and disabled_at is not null`);
      if (off.rows.length) throw new APIError('UNAUTHORIZED', { code: 'INVALID_PHONE_NUMBER_OR_PASSWORD', message: 'Invalid phone number or password' });
      const counted = await db.execute(sql`
        update "user" set
          locked_until = case when failed_sign_ins + 1 >= ${MAX_TRIES} then now() + make_interval(mins => ${LOCK_MINUTES}) else null end,
          failed_sign_ins = case when failed_sign_ins + 1 >= ${MAX_TRIES} then 0 else failed_sign_ins + 1 end
        where phone_number = ${phone} and (locked_until is null or locked_until <= now())
        returning id`);
      if (counted.rows.length) return;
      const { rows } = await db.execute(sql`select locked_until from "user" where phone_number = ${phone} and locked_until > now()`);
      if (rows.length) {
        throw new APIError('TOO_MANY_REQUESTS', { code: 'ACCOUNT_LOCKED', message: 'Account locked', lockedUntil: rows[0].locked_until });
      }
    }),
    // The right password clears the count and the lock.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN || typeof ctx.body?.phoneNumber !== 'string' || !ctx.context.newSession) return;
      await db.execute(sql`update "user" set failed_sign_ins = 0, locked_until = null where phone_number = ${ctx.body.phoneNumber}`);
    }),
  },
  // Only Sri Lankan mobile numbers are accepted, also when called directly (system design 3.1).
  plugins: [phoneNumber({
    phoneNumberValidator: (phone) => SRI_LANKA_MOBILE.test(phone),
    // No SMS (system design 3.1); the code paths are closed by OPEN_PATHS anyway.
    sendOTP: () => { throw new APIError('NOT_FOUND'); },
  }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
