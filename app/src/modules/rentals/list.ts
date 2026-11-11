import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { customer, rental, rentalEvent, rentalVehicleSegment, user, vehicle } from '../../db/schema';
import { nextDeadlineAfter } from '../../lib/rental-days';
import { readSettings } from '../settings/settings';
import { handoverChecklist, notCollected, type Missing } from './handover';

// The rentals list (06.1; ST-06.1) and a rental's history (06.2): open rentals grouped by what needs doing
// (system design 7.1; PRD ST-06.1): overdue (out past its return deadline), due back by the next return deadline,
// handover in progress (saved, not handed over; "Not collected" after 2 hours), the rest. Returned today comes with
// return (#63), older and cancelled rentals with #59 and #63. Every employee with Customer access reads it (the page
// checks); no money totals here.

// Only Overdue is a filter: the menu's count and the attention summary open it (AT-28; board 06.1).
export const FILTERS = ['overdue'] as const;
export type Filter = (typeof FILTERS)[number];
export const isFilter = (f: unknown): f is Filter => (FILTERS as readonly string[]).includes(String(f));
export type Group = 'overdue' | 'dueBack' | 'handover' | 'other';

/** How many minutes a rental out is past its return deadline; 0 when it is not (06.3). */
export function minutesLate(r: { status: string; deadlineAt: Date }, now = new Date()): number {
  // Rounded up, so a rental 30 seconds late shows +0h 01m on the list and the details page alike.
  return r.status === 'active' && now.getTime() > r.deadlineAt.getTime() ? Math.ceil((now.getTime() - r.deadlineAt.getTime()) / 60_000) : 0;
}

export interface ListRow {
  id: string; number: number; status: string; customerName: string; registration: string; model: string;
  pickupAt: Date; deadlineAt: Date; createdAt: Date; overdue: boolean; lateMinutes: number; notCollected: boolean;
  /** A saved rental's handover checklist: how many of its items are in, and what blocks (06.1 "4 / 5 · …"). */
  checklist: { done: number; total: number; missing: Missing[] } | null;
}

/** Open rentals in their groups, newest deadline last within a group. With a filter, only the matching rentals. */
export async function listRentals(opts: { filter?: Filter; now?: Date } = {}): Promise<{ filter: Filter | null; dueBy: Date; groups: Record<Group, ListRow[]> }> {
  const now = opts.now ?? new Date();
  const settings = await readSettings();
  const dueBy = nextDeadlineAfter(now, settings.returnDeadline);
  const first = db.selectDistinctOn([rentalVehicleSegment.rentalId], { rentalId: rentalVehicleSegment.rentalId, vehicleId: rentalVehicleSegment.vehicleId })
    .from(rentalVehicleSegment).orderBy(rentalVehicleSegment.rentalId, desc(rentalVehicleSegment.position)).as('seg');
  const rows = await db.select({ id: rental.id, number: rental.number, status: rental.status, customerName: customer.name, registration: vehicle.registration,
    model: vehicle.model, pickupAt: rental.pickupAt, deadlineAt: rental.deadlineAt, createdAt: rental.createdAt })
    .from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).innerJoin(first, eq(first.rentalId, rental.id)).innerJoin(vehicle, eq(vehicle.id, first.vehicleId))
    .where(inArray(rental.status, ['draft', 'active'])).orderBy(asc(rental.deadlineAt), asc(rental.number));
  const groups: Record<Group, ListRow[]> = { overdue: [], dueBack: [], handover: [], other: [] };
  // The checklist only for saved rentals still in time (past their return time they cannot go out: shown as such),
  // all at once rather than one after another.
  // At most the 50 newest: an office has a few saved rentals at a time; the rest show without their progress.
  const inTime = rows.filter((r) => r.status === 'draft' && r.deadlineAt.getTime() > now.getTime()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);
  const checks = new Map((await Promise.all(inTime.map(async (r) => [r.id, await handoverChecklist(r.id)] as const))));
  for (const r of rows) {
    const lateMinutes = minutesLate(r, now);
    const overdue = lateMinutes > 0;
    const c = r.status === 'draft' ? (checks.get(r.id) ?? (r.deadlineAt.getTime() <= now.getTime() ? { missing: ['deadlinePassed'] as Missing[] } : null)) : null;
    // The five items of the 06.4 checklist; car-out and deadline blocks are counted as missing too.
    const checklist = c ? { total: 5, done: 5 - Math.min(5, new Set(c.missing.map((m) => (m === 'agreementOutOfDate' ? 'signedAgreement' : m === 'referencePerson' ? 'referenceCopies' : m))).size), missing: c.missing } : null;
    const row: ListRow = { ...r, overdue, lateMinutes, notCollected: notCollected(r, now), checklist };
    const group: Group = r.status === 'draft' ? 'handover' : overdue ? 'overdue' : r.deadlineAt.getTime() <= dueBy.getTime() ? 'dueBack' : 'other';
    const keep = !opts.filter || opts.filter === group;
    if (keep) groups[group].push(row);
  }
  return { filter: opts.filter ?? null, dueBy, groups };
}

/** How many rentals are out past their return deadline (the "Overdue" count in the menu). */
export async function overdueCount(now = new Date()): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(rental).where(and(eq(rental.status, 'active'), sql`${rental.deadlineAt} < ${now.toISOString()}`));
  return r?.n ?? 0;
}

export interface HistoryEntry { id: string; kind: string; details: Record<string, unknown>; createdAt: Date; byName: string | null }

/** What happened on a rental, newest first (06.2 "What happened"). */
export async function rentalHistory(rentalId: string): Promise<HistoryEntry[]> {
  if (!/^[0-9a-f-]{36}$/i.test(rentalId)) return [];
  const rows = await db.select({ id: rentalEvent.id, kind: rentalEvent.kind, details: rentalEvent.details, createdAt: rentalEvent.createdAt, byName: user.name })
    .from(rentalEvent).leftJoin(user, eq(user.id, rentalEvent.createdBy)).where(eq(rentalEvent.rentalId, rentalId)).orderBy(desc(rentalEvent.createdAt), desc(rentalEvent.id));
  return rows.map((r) => ({ ...r, details: (r.details ?? {}) as Record<string, unknown> }));
}
