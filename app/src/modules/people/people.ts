import { randomUUID } from 'node:crypto';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { account, auditEvent, permissionGrant, session, user } from '../../db/schema';
import { phoneProblem } from '../../auth/phone';
import { defaultPermissions, isPermission, type Role } from '../../auth/permissions';
import { MIN_PASSWORD_LENGTH } from '../../auth/rules';
import { auth } from '../../auth/server';

// ST-15.1 Set permissions and ST-15.2 People (system design 3.1, 3.2). Only the primary owner adds people, changes
// permissions, resets passwords and turns accounts off or on (AT-58); each change is one transaction with its
// activity-log entry, naming who did it (PR-05). Passwords are never written to the log.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Language = 'si' | 'en';
export type PeopleError =
  | 'notAllowed' | 'notFound' | 'nameMissing' | 'phoneMissing' | 'phoneInvalid' | 'phoneTaken'
  | 'passwordShort' | 'roleInvalid' | 'reasonMissing' | 'alreadyOff' | 'alreadyOn' | 'isOwner' | 'permissionInvalid';
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

export interface NewPerson { name: string; phone: string; password: string; role: Role; language?: Language }

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
  const passwordHash = await hash(input.password);
  return db.transaction(async (tx) => {
    if (actorId && !(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    if ((await tx.select({ id: user.id }).from(user).where(eq(user.phoneNumber, input.phone))).length) return { error: 'phoneTaken' } as const;
    if (input.role === 'owner' && (await tx.select({ id: user.id }).from(user).where(eq(user.role, 'owner'))).length) return { error: 'roleInvalid' } as const;
    // Better Auth needs an email; this placeholder is never sent to (owner and admin addresses come with #28).
    const [created] = await tx.insert(user).values({
      name, email: `${randomUUID()}@no-email.invalid`, phoneNumber: input.phone, role: input.role, language: input.language === 'en' ? 'en' : 'si',
    }).returning({ id: user.id });
    await tx.insert(account).values({ userId: created.id, accountId: created.id, providerId: 'credential', password: passwordHash });
    const defaults = defaultPermissions(input.role);
    if (defaults.length) await tx.insert(permissionGrant).values(defaults.map((permission) => ({ userId: created.id, permission, createdBy: actorId })));
    await log(tx, actorId, 'person.add', created.id, { name, role: input.role, permissions: defaults });
    return { ok: true, id: created.id } as const;
  });
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

export interface PersonRow { id: string; name: string; phone: string | null; role: string; disabledAt: Date | null; disabledReason: string | null; permissions: string[] }

/** Everyone with an SNS account (not partners: they are listed under Partners), owner first, then by name. */
export async function listPeople(): Promise<PersonRow[]> {
  const rows = await db.select({
    id: user.id, name: user.name, phone: user.phoneNumber, role: user.role, disabledAt: user.disabledAt, disabledReason: user.disabledReason,
    permissions: sql<string[]>`coalesce(array_agg(${permissionGrant.permission}) filter (where ${permissionGrant.permission} is not null), '{}')`,
  }).from(user).leftJoin(permissionGrant, eq(permissionGrant.userId, user.id))
    .where(sql`${user.role} <> 'partner'`)
    .groupBy(user.id)
    .orderBy(sql`${user.role} = 'owner' desc`, asc(user.name));
  return rows;
}

export async function getPerson(id: string): Promise<PersonRow | null> {
  if (!UUID.test(id)) return null;
  return (await listPeople()).find((p) => p.id === id) ?? null;
}
