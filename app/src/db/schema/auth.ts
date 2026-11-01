import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Better Auth's tables (TRD › Data model, Identity), checked against getAuthTables() of better-auth 1.7.10
// with the phone-number plugin and SNS's extra user fields. The JavaScript keys are Better Auth's field names.
const times = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Better Auth needs an email; people without one get `<id>@no-email.invalid`, never sent to (#14 plan; real addresses in #28).
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phoneNumber: text('phone_number').unique(),
  phoneNumberVerified: boolean('phone_number_verified'),
  // SNS fields, never set from what a browser sends.
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  language: text('language').notNull().default('si'),
  failedSignIns: integer('failed_sign_ins').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  // System design 3.1: one primary owner, admins, staff, partners (partner accounts come with ST-11.2).
  role: text('role').notNull().default('staff'),
  // Turned off by the owner, with a reason: sign-in stops; the person and everything they recorded stay (AT-47).
  disabledAt: timestamp('disabled_at', { withTimezone: true }),
  disabledReason: text('disabled_reason'),
  // #28 (system design 3.1 "Email codes and email reset"): owner and admin only. `email` above is the confirmed address
  // (email_verified) or the placeholder; a new one waits here until a code sent to it is typed in.
  pendingEmail: text('pending_email'),
  // Better Auth two-factor: set by SNS (owner or admin with an email to send to), never by the person.
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  // When the last code was emailed: at most one a minute.
  codeSentAt: timestamp('code_sent_at', { withTimezone: true }),
  ...times,
}, (t) => [
  check('user_role', sql`${t.role} in ('owner', 'admin', 'staff', 'partner')`),
  check('user_disabled_has_reason', sql`(${t.disabledAt} is null) = (${t.disabledReason} is null)`),
  uniqueIndex('user_one_owner').on(t.role).where(sql`${t.role} = 'owner'`),
]);

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  ...times,
});

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  ...times,
});

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...times,
});

/** Better Auth two-factor plugin's table (checked against better-auth 1.7.10). SNS uses emailed codes only, so no
 *  authenticator secret is ever stored; the table must exist for the plugin. */
export const twoFactor = pgTable('two_factor', {
  id: uuid('id').primaryKey().defaultRandom(),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  verified: boolean('verified').default(true),
  failedVerificationCount: integer('failed_verification_count').default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
});
