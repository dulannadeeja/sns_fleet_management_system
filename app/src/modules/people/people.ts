import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { account, auditEvent, permissionGrant, session, user, verification } from '../../db/schema';
import { sendMail } from '../../mail/send';
import { confirmMail } from '../../mail/messages';
import { phoneProblem } from '../../auth/phone';
import { defaultPermissions, isPermission, type Role } from '../../auth/permissions';
import { MIN_PASSWORD_LENGTH } from '../../auth/rules';
import { auth, CODE_MINUTES, CODE_TRIES, forgetDevices } from '../../auth/server';

// ST-15.1 Set permissions and ST-15.2 People (system design 3.1, 3.2). Only the primary owner adds people, changes
// permissions, resets passwords and turns accounts off or on (AT-58); each change is one transaction with its
// activity-log entry, naming who did it (PR-05). Passwords are never written to the log.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Language = 'si' | 'en';
export type PeopleError =
  | 'notAllowed' | 'notFound' | 'nameMissing' | 'phoneMissing' | 'phoneInvalid' | 'phoneTaken'
  | 'passwordShort' | 'roleInvalid' | 'reasonMissing' | 'alreadyOff' | 'alreadyOn' | 'isOwner' | 'permissionInvalid'
  | 'emailMissing' | 'emailInvalid' | 'emailTaken' | 'emailNotNeeded' | 'codeTooSoon' | 'codeWrong' | 'codeExpired' | 'codeTooMany' | 'notSent';
export type PeopleResult<T = object> = ({ ok: true } & T) | { error: PeopleError };

/** The acting person must be the primary owner, signed in and not turned off. Checked inside each change too. */
async function isOwner(tx: Tx, actorId: string): Promise<boolean> {
  const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  return actor?.role === 'owner' && !actor.disabledAt;
}

async function log(tx: Tx, actorId: string | null, action: string, targetId: string, details?: Record<string, unknown>) {
  await tx.insert(auditEvent).values({ createdBy: actorId, action, targetType: 'person', targetId, details: details ?? null });
}

async function hash(password: string): Promise<string> {
  return (await auth.$context).password.hash(password);
}
export const hashPassword = hash;

/**
 * A partner's sign-in account, inside the caller's transaction (ST-11.2; system design 3.2 "Partner accounts",
 * Proposed): a first password to change at the first sign-in, no permissions (a partner sees only their own earnings),
 * no email. The caller checks who may add partners and writes the activity log.
 */
export async function createPartnerAccount(tx: Tx, input: { name: string; phone: string; passwordHash: string; language?: Language }): Promise<{ id: string } | { error: 'phoneTaken' }> {
  if ((await tx.select({ id: user.id }).from(user).where(eq(user.phoneNumber, input.phone))).length) return { error: 'phoneTaken' };
  const [created] = await tx.insert(user).values({
    name: input.name, email: `${randomUUID()}@no-email.invalid`, phoneNumber: input.phone, role: 'partner', language: input.language === 'en' ? 'en' : 'si',
  }).returning({ id: user.id });
  await tx.insert(account).values({ userId: created.id, accountId: created.id, providerId: 'credential', password: input.passwordHash });
  return { id: created.id };
}

export interface NewPerson { name: string; phone: string; password: string; role: Role; language?: Language; email?: string }

// #28 (system design 3.1 "Email codes and email reset", Proposed): the owner and the admin each have an email for
// sign-in codes and their own reset; staff and partners have none.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const needsEmail = (role: string) => role === 'owner' || role === 'admin';

/** A typed email, tidied, or what is wrong with it. */
export function readEmail(typed: string | undefined): { email: string } | { error: 'emailMissing' | 'emailInvalid' } {
  const email = (typed ?? '').trim().toLowerCase();
  if (!email) return { error: 'emailMissing' };
  return email.length <= 254 && EMAIL.test(email) ? { email } : { error: 'emailInvalid' };
}

/** Whether someone else already has this email, confirmed or waiting. */
async function emailTaken(tx: Tx, email: string, exceptId?: string): Promise<boolean> {
  const rows = await tx.select({ id: user.id }).from(user)
    .where(sql`(${user.email} = ${email} or ${user.pendingEmail} = ${email})${exceptId ? sql` and ${user.id} <> ${exceptId}` : sql``}`);
  return rows.length > 0;
}

/**
 * Adds a person with a first password, which they change at their first sign-in, and their role's default permissions.
 * `actorId` is the owner adding them; `null` only for `npm run people:add` (setting up, before anyone can sign in).
 */
export async function addPerson(actorId: string | null, input: NewPerson): Promise<PeopleResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { error: 'nameMissing' };
  const phoneIssue = phoneProblem(input.phone);
  if (phoneIssue) return { error: phoneIssue };
  if (input.password.length < MIN_PASSWORD_LENGTH) return { error: 'passwordShort' };
  // The screen adds staff and admins; the one owner only by setting up; partners come with ST-11.2.
  const allowedRoles: Role[] = actorId ? ['staff', 'admin'] : ['staff', 'admin', 'owner'];
  if (!allowedRoles.includes(input.role)) return { error: 'roleInvalid' };
  let email: string | null = null;
  if (needsEmail(input.role)) {
    const read = readEmail(input.email);
    if ('error' in read) return read;
    email = read.email;
  }
  const passwordHash = await hash(input.password);
  return withUniqueErrors(() => db.transaction(async (tx) => {
    if (actorId && !(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    if ((await tx.select({ id: user.id }).from(user).where(eq(user.phoneNumber, input.phone))).length) return { error: 'phoneTaken' } as const;
    if (input.role === 'owner' && (await tx.select({ id: user.id }).from(user).where(eq(user.role, 'owner'))).length) return { error: 'roleInvalid' } as const;
    if (email && (await emailTaken(tx, email))) return { error: 'emailTaken' } as const;
    // Better Auth needs an email: everyone gets a placeholder, never sent to. The owner's and admin's real one waits as
    // pending until the first code sent to it is typed in (#28).
    const [created] = await tx.insert(user).values({
      name, email: `${randomUUID()}@no-email.invalid`, phoneNumber: input.phone, role: input.role, language: input.language === 'en' ? 'en' : 'si',
      pendingEmail: email, twoFactorEnabled: email !== null,
    }).returning({ id: user.id });
    await tx.insert(account).values({ userId: created.id, accountId: created.id, providerId: 'credential', password: passwordHash });
    const defaults = defaultPermissions(input.role);
    if (defaults.length) await tx.insert(permissionGrant).values(defaults.map((permission) => ({ userId: created.id, permission, createdBy: actorId })));
    await log(tx, actorId, 'person.add', created.id, { name, role: input.role, permissions: defaults, ...(email ? { email } : {}) });
    return { ok: true, id: created.id } as const;
  }));
}

/** Two adds at the same moment both pass the checks above; the database's unique rules stop the second one, and it
 *  gets the same answer as if it had come later. */
async function withUniqueErrors<T>(run: () => Promise<T>): Promise<T | { error: PeopleError }> {
  try {
    return await run();
  } catch (e) {
    const err = (e as { cause?: { code?: string; constraint?: string }; code?: string; constraint?: string });
    const pg = err.cause ?? err;
    if (pg.code === '23505' && pg.constraint === 'user_one_owner') return { error: 'roleInvalid' };
    if (pg.code === '23505' && pg.constraint === 'user_pending_email_once') return { error: 'emailTaken' };
    if (pg.code === '23505' && pg.constraint?.includes('phone_number')) return { error: 'phoneTaken' };
    throw e;
  }
}

/** The owner gives a forgotten password back as a new first password: it must be changed at the next sign-in, the lock
 *  and count are cleared, and every open session ends (AT-46). The owner's own reset is by email (#28). */
export async function resetPassword(actorId: string, personId: string, password: string): Promise<PeopleResult> {
  if (!UUID.test(personId)) return { error: 'notFound' };
  if (password.length < MIN_PASSWORD_LENGTH) return { error: 'passwordShort' };
  const passwordHash = await hash(password);
  return db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    const [target] = await tx.select({ role: user.role }).from(user).where(eq(user.id, personId));
    if (!target) return { error: 'notFound' } as const;
    if (target.role === 'owner') return { error: 'isOwner' } as const;
    await tx.update(account).set({ password: passwordHash, updatedAt: new Date() }).where(and(eq(account.userId, personId), eq(account.providerId, 'credential')));
    await tx.update(user).set({ mustChangePassword: true, failedSignIns: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(user.id, personId));
    await tx.delete(session).where(eq(session.userId, personId));
    await forgetDevices(personId, (q) => tx.execute(q));
    await log(tx, actorId, 'person.resetPassword', personId);
    return { ok: true } as const;
  });
}

/** Turns an account off with a reason: sign-in stops at once and every session ends; the person and everything they
 *  recorded stay, with their name (AT-47). The owner's own account cannot be turned off. */
export async function turnOff(actorId: string, personId: string, reason: string): Promise<PeopleResult> {
  if (!UUID.test(personId)) return { error: 'notFound' };
  const why = reason.trim();
  if (!why) return { error: 'reasonMissing' };
  return db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    const [target] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, personId)).for('update');
    if (!target) return { error: 'notFound' } as const;
    if (target.role === 'owner') return { error: 'isOwner' } as const;
    if (target.disabledAt) return { error: 'alreadyOff' } as const;
    await tx.update(user).set({ disabledAt: new Date(), disabledReason: why, updatedAt: new Date() }).where(eq(user.id, personId));
    await tx.delete(session).where(eq(session.userId, personId));
    await forgetDevices(personId, (q) => tx.execute(q));
    await log(tx, actorId, 'person.turnOff', personId, { reason: why });
    return { ok: true } as const;
  });
}

/** Turns an account back on; they sign in with the password they had. */
export async function turnOn(actorId: string, personId: string): Promise<PeopleResult> {
  if (!UUID.test(personId)) return { error: 'notFound' };
  return db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    const [target] = await tx.select({ disabledAt: user.disabledAt, reason: user.disabledReason }).from(user).where(eq(user.id, personId)).for('update');
    if (!target) return { error: 'notFound' } as const;
    if (!target.disabledAt) return { error: 'alreadyOn' } as const;
    await tx.update(user).set({ disabledAt: null, disabledReason: null, updatedAt: new Date() }).where(eq(user.id, personId));
    // A sign-in that raced the turning off could have left a session; it must not come back to life.
    await tx.delete(session).where(eq(session.userId, personId));
    await log(tx, actorId, 'person.turnOn', personId, { previousReason: target.reason });
    return { ok: true } as const;
  });
}

/** Gives or takes away one permission (ST-15.1). Only the owner; only for admins and staff. Logged only when it changes. */
export async function setPermission(actorId: string, personId: string, permission: string, allowed: boolean): Promise<PeopleResult<{ changed: boolean }>> {
  if (!UUID.test(personId)) return { error: 'notFound' };
  if (!isPermission(permission)) return { error: 'permissionInvalid' };
  return db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    const [target] = await tx.select({ role: user.role }).from(user).where(eq(user.id, personId));
    if (!target) return { error: 'notFound' } as const;
    if (target.role !== 'admin' && target.role !== 'staff') return { error: 'roleInvalid' } as const;
    const changed = allowed
      ? (await tx.insert(permissionGrant).values({ userId: personId, permission, createdBy: actorId }).onConflictDoNothing().returning()).length > 0
      : (await tx.delete(permissionGrant).where(and(eq(permissionGrant.userId, personId), eq(permissionGrant.permission, permission))).returning()).length > 0;
    if (changed) await log(tx, actorId, allowed ? 'permission.grant' : 'permission.remove', personId, { permission });
    return { ok: true, changed } as const;
  });
}

export interface PersonRow { id: string; name: string; phone: string | null; role: string; disabledAt: Date | null; disabledReason: string | null; permissions: string[]; email: string | null; pendingEmail: string | null }

// Callers are owner-only pages (requireOwner): these return phone numbers and permissions.
function peopleQuery() {
  return db.select({
    id: user.id, name: user.name, phone: user.phoneNumber, role: user.role, disabledAt: user.disabledAt, disabledReason: user.disabledReason,
    // The confirmed email only (never the placeholder), and one waiting to be confirmed.
    email: sql<string | null>`case when ${user.emailVerified} then ${user.email} end`, pendingEmail: user.pendingEmail,
    permissions: sql<string[]>`coalesce(array_agg(${permissionGrant.permission}) filter (where ${permissionGrant.permission} is not null), '{}')`,
  }).from(user).leftJoin(permissionGrant, eq(permissionGrant.userId, user.id));
}

/** Everyone with an SNS account (not partners: they are listed under Partners), owner first, then by name. */
export async function listPeople(): Promise<PersonRow[]> {
  return peopleQuery().where(sql`${user.role} <> 'partner'`).groupBy(user.id).orderBy(sql`${user.role} = 'owner' desc`, asc(user.name));
}

/** One person, or null for an unknown or malformed id. A partner opens too (15.6, from 11.2): the owner resets their
 *  password and turns their account off or on (system design 3.1; #20 review). */
export async function getPerson(id: string): Promise<PersonRow | null> {
  if (!UUID.test(id)) return null;
  return (await peopleQuery().where(eq(user.id, id)).groupBy(user.id))[0] ?? null;
}

/**
 * The owner sets or changes the owner's or an admin's email (#28). It waits as pending: with no confirmed email yet,
 * the next sign-in code goes to it and confirms it; with one, codes keep going to the old one until the person types
 * the code sent to the new one (confirmPendingEmail). Logged.
 */
export async function setEmail(actorId: string, personId: string, typed: string): Promise<PeopleResult> {
  if (!UUID.test(personId)) return { error: 'notFound' };
  const read = readEmail(typed);
  if ('error' in read) return read;
  return withUniqueErrors(() => db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    const [target] = await tx.select({ role: user.role }).from(user).where(eq(user.id, personId)).for('update');
    if (!target) return { error: 'notFound' } as const;
    if (!needsEmail(target.role)) return { error: 'emailNotNeeded' } as const;
    if (await emailTaken(tx, read.email, personId)) return { error: 'emailTaken' } as const;
    await tx.update(user).set({ pendingEmail: read.email, twoFactorEnabled: true, updatedAt: new Date() }).where(eq(user.id, personId));
    await log(tx, actorId, 'person.emailChange', personId, { email: read.email });
    return { ok: true } as const;
  }));
}

const CONFIRM = (personId: string) => `confirm-email:${personId}`;
// Keyed with the server secret, so a copy of the database alone does not give the code (#28 review).
const codeHash = (personId: string, code: string) => createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '').update(`${personId}:${code}`).digest('hex');
const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Emails a code to the person's new (pending) email; at most one a minute (#28). */
export async function sendEmailConfirmCode(personId: string): Promise<PeopleResult> {
  const [person] = await db.select({ pending: user.pendingEmail, language: user.language }).from(user).where(eq(user.id, personId));
  if (!person?.pending) return { error: 'notFound' };
  const sent = await db.execute(sql`update "user" set code_sent_at = now() where id = ${personId}
    and (code_sent_at is null or code_sent_at <= now() - interval '1 minute') returning id`);
  if (!sent.rows.length) return { error: 'codeTooSoon' };
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.transaction(async (tx) => {
    await tx.delete(verification).where(eq(verification.identifier, CONFIRM(personId)));
    await tx.insert(verification).values({
      identifier: CONFIRM(personId), value: `${codeHash(personId, code)}:0:${person.pending}`, expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000),
    });
  });
  try {
    await sendMail({ to: person.pending, ...confirmMail(person.language === 'en' ? 'en' : 'si', code) });
  } catch {
    // Not sent: give the minute back so they can try again at once.
    await db.update(user).set({ codeSentAt: null }).where(eq(user.id, personId));
    return { error: 'notSent' };
  }
  return { ok: true };
}

/** The person types the code sent to their new email: it becomes their email (logged). 5 wrong codes stop the code. */
export async function confirmPendingEmail(personId: string, code: string): Promise<PeopleResult> {
  return db.transaction(async (tx) => {
    const [stored] = await tx.select().from(verification).where(eq(verification.identifier, CONFIRM(personId))).for('update');
    if (!stored || stored.expiresAt <= new Date()) return { error: 'codeExpired' } as const;
    const [hash, tries, email] = stored.value.split(':');
    if (Number(tries) >= CODE_TRIES) return { error: 'codeTooMany' } as const;
    if (!sameHash(codeHash(personId, code.trim()), hash)) {
      await tx.update(verification).set({ value: `${hash}:${Number(tries) + 1}:${email}` }).where(eq(verification.id, stored.id));
      return { error: 'codeWrong' } as const;
    }
    const [person] = await tx.select({ pending: user.pendingEmail }).from(user).where(eq(user.id, personId)).for('update');
    if (person?.pending !== email) return { error: 'codeExpired' } as const;
    if (await emailTaken(tx, email, personId)) return { error: 'emailTaken' } as const;
    await tx.update(user).set({ email, emailVerified: true, pendingEmail: null, updatedAt: new Date() }).where(eq(user.id, personId));
    await tx.delete(verification).where(eq(verification.id, stored.id));
    await log(tx, personId, 'person.emailConfirmed', personId, { email });
    return { ok: true } as const;
  });
}
