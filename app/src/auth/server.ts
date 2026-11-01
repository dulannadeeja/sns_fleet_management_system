import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { phoneNumber } from 'better-auth/plugins/phone-number';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';

// Sign-in (TRD › Sign-in and permissions; system design 3.1; DN-03): phone number and password, at least 8 characters;
// 5 wrong tries lock the account for 15 minutes. No SMS, no sign-up: people are added by the owner (#15) or `npm run people:add`.
export const MIN_PASSWORD = 8;
export const MAX_TRIES = 5;
export const LOCK_MINUTES = 15;
const SIGN_IN = '/sign-in/phone-number';

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
    },
  },
  hooks: {
    // A locked account is refused before the password is checked, so the right password does not open it early (AT-60).
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN || typeof ctx.body?.phoneNumber !== 'string') return;
      const { rows } = await db.execute(sql`select locked_until from "user" where phone_number = ${ctx.body.phoneNumber} and locked_until > now()`);
      if (rows.length) {
        throw new APIError('TOO_MANY_REQUESTS', { code: 'ACCOUNT_LOCKED', message: 'Account locked', lockedUntil: rows[0].locked_until });
      }
    }),
    // Count a wrong password; the fifth locks the account for 15 minutes and starts the count again. A success clears it.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN || typeof ctx.body?.phoneNumber !== 'string') return;
      const phone = ctx.body.phoneNumber;
      if (ctx.context.newSession) {
        await db.execute(sql`update "user" set failed_sign_ins = 0, locked_until = null where phone_number = ${phone}`);
        return;
      }
      const returned = ctx.context.returned;
      if (returned instanceof APIError && returned.body?.code === 'INVALID_PHONE_NUMBER_OR_PASSWORD') {
        await db.execute(sql`
          update "user" set
            locked_until = case when failed_sign_ins + 1 >= ${MAX_TRIES} then now() + make_interval(mins => ${LOCK_MINUTES}) else locked_until end,
            failed_sign_ins = case when failed_sign_ins + 1 >= ${MAX_TRIES} then 0 else failed_sign_ins + 1 end
          where phone_number = ${phone}`);
      }
    }),
  },
  plugins: [phoneNumber(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
