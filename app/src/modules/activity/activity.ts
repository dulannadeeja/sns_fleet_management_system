import { and, desc, eq, sql } from 'drizzle-orm';
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

/** Where "Older" continues: the last entry's exact time (microseconds, as the database keeps it) and id, so entries
 *  with the same time are never skipped (#16 review). */
export type Cursor = string;
const CURSOR = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?[+-]\d{2}(?::\d{2})?)\|([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function readCursor(raw: unknown): { at: string; id: string } | null {
  if (typeof raw !== 'string') return null;
  let text: string;
  try {
    text = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const m = CURSOR.exec(text);
  return m ? { at: m[1], id: m[2] } : null;
}

/** One page of the log, newest first, optionally by the person who acted, by kind, or by the record it is about.
 *  `older` continues the list. */
export async function listActivity(filter: { personId?: string; kind?: Kind; targetId?: string; older?: Cursor; limit?: number }): Promise<{ entries: Entry[]; older: Cursor | null }> {
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const actor = alias(user, 'actor');
  const target = alias(user, 'target');
  const where = [];
  if (filter.personId) where.push(eq(auditEvent.createdBy, filter.personId));
  if (filter.targetId) where.push(eq(auditEvent.targetId, filter.targetId));
  const cursor = filter.older ? readCursor(filter.older) : null;
  if (cursor) where.push(sql`(${auditEvent.createdAt}, ${auditEvent.id}) < (${cursor.at}::timestamptz, ${cursor.id}::uuid)`);
  if (filter.kind === 'decisions') where.push(sql`${auditEvent.details} ? 'reason'`);
  else if (filter.kind) where.push(sql`(${sql.join(PREFIXES[filter.kind].map((p) => sql`${auditEvent.action} like ${p + '%'}`), sql` or `)})`);
  const rows = await db.select({
    id: auditEvent.id, createdAt: auditEvent.createdAt, exactAt: sql<string>`${auditEvent.createdAt}::text`, action: auditEvent.action,
    actorId: auditEvent.createdBy, actorName: actor.name,
    targetType: auditEvent.targetType, targetId: auditEvent.targetId, targetName: target.name, details: auditEvent.details,
  }).from(auditEvent)
    .leftJoin(actor, eq(actor.id, auditEvent.createdBy))
    .leftJoin(target, and(eq(auditEvent.targetType, 'person'), eq(sql`${target.id}::text`, auditEvent.targetId)))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(auditEvent.createdAt), desc(auditEvent.id))
    .limit(limit + 1);
  const shown = rows.slice(0, limit);
  const entries: Entry[] = shown.map((r) => {
    const details = (r.details ?? null) as Record<string, unknown> | null;
    return {
      id: r.id, createdAt: r.createdAt, action: r.action, kind: kindOf(r.action), actorId: r.actorId, actorName: r.actorName,
      targetType: r.targetType, targetId: r.targetId, targetName: r.targetName, details,
      reason: typeof details?.reason === 'string' ? details.reason : null,
    };
  });
  const last = shown.at(-1);
  return { entries, older: rows.length > limit && last ? Buffer.from(`${last.exactAt}|${last.id}`).toString('base64url') : null };
}

/** The people to filter by on screen 15.5: everyone with an SNS account (names only), active first, so the owner can
 *  also look up someone who has left (#16 review). */
export async function peopleForFilter(): Promise<{ id: string; name: string; off: boolean }[]> {
  return db.select({ id: user.id, name: user.name, off: sql<boolean>`${user.disabledAt} is not null` }).from(user)
    .where(sql`${user.role} <> 'partner'`)
    .orderBy(sql`${user.role} = 'owner' desc`, sql`${user.disabledAt} is not null`, user.name);
}
