import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db/client';
import { auditEvent, user } from '../../db/schema';

// ST-15.4 Activity log (screen 15.5): read only. Entries are insert-only in the database (trigger and app-role grants,
// migrations 0001 and 0002); nothing here changes or deletes one (Derived control, system design 17.3).

/** The kinds on screen 15.5, from the action's name; "decisions" are entries with a reason. */
export const KINDS = ['decisions', 'money', 'customers', 'cars', 'settings'] as const;
export type Kind = (typeof KINDS)[number];

const PREFIXES: Record<Exclude<Kind, 'decisions'>, string[]> = {
  money: ['payment.', 'refund.', 'expense.', 'cash.', 'payout.', 'deposit.', 'charge.'],
  customers: ['customer.'],
  cars: ['car.', 'vehicle.', 'package.'],
  settings: ['person.', 'permission.', 'setting.'],
};

export function kindOf(action: string): Exclude<Kind, 'decisions'> | null {
  for (const [kind, prefixes] of Object.entries(PREFIXES)) if (prefixes.some((p) => action.startsWith(p))) return kind as Exclude<Kind, 'decisions'>;
  return null;
}

export interface Entry {
  id: string; createdAt: Date; action: string; kind: Exclude<Kind, 'decisions'> | null;
  actorId: string | null; actorName: string | null; targetType: string | null; targetId: string | null; targetName: string | null;
  reason: string | null; details: Record<string, unknown> | null;
}

/** One page of the log, newest first, optionally by the person who acted and by kind. `older` continues the list. */
export async function listActivity(filter: { personId?: string; kind?: Kind; before?: Date; limit?: number }): Promise<{ entries: Entry[]; older: Date | null }> {
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const actor = alias(user, 'actor');
  const target = alias(user, 'target');
  const where = [];
  if (filter.personId) where.push(eq(auditEvent.createdBy, filter.personId));
  if (filter.before) where.push(lt(auditEvent.createdAt, filter.before));
  if (filter.kind === 'decisions') where.push(sql`${auditEvent.details} ? 'reason'`);
  else if (filter.kind) where.push(sql`(${sql.join(PREFIXES[filter.kind].map((p) => sql`${auditEvent.action} like ${p + '%'}`), sql` or `)})`);
  const rows = await db.select({
    id: auditEvent.id, createdAt: auditEvent.createdAt, action: auditEvent.action, actorId: auditEvent.createdBy, actorName: actor.name,
    targetType: auditEvent.targetType, targetId: auditEvent.targetId, targetName: target.name, details: auditEvent.details,
  }).from(auditEvent)
    .leftJoin(actor, eq(actor.id, auditEvent.createdBy))
    .leftJoin(target, and(eq(auditEvent.targetType, 'person'), eq(sql`${target.id}::text`, auditEvent.targetId)))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(auditEvent.createdAt), desc(auditEvent.id))
    .limit(limit + 1);
  const entries = rows.slice(0, limit).map((r) => {
    const details = (r.details ?? null) as Record<string, unknown> | null;
    return { ...r, details, kind: kindOf(r.action), reason: typeof details?.reason === 'string' ? details.reason : null };
  });
  return { entries, older: rows.length > limit ? entries.at(-1)!.createdAt : null };
}

/** The people to filter by on screen 15.5: active SNS accounts (names only), plus the one already chosen. */
export async function peopleForFilter(chosen?: string): Promise<{ id: string; name: string }[]> {
  return db.select({ id: user.id, name: user.name }).from(user)
    .where(sql`${user.role} <> 'partner' and (${user.disabledAt} is null${chosen ? sql` or ${user.id} = ${chosen}` : sql``})`)
    .orderBy(sql`${user.role} = 'owner' desc`, user.name);
}
