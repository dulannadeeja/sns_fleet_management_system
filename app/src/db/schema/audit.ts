import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/** The activity log. Insert-only: a trigger refuses UPDATE and DELETE (migration 0001; TRD › Integrity rules).
 *  created_by is the person who acted, or null for the system. */
export const auditEvent = pgTable('audit_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  details: jsonb('details'),
}, (t) => [
  // Screen 15.5 reads newest first and by person (#16).
  index('audit_event_newest').on(t.createdAt.desc(), t.id.desc()),
  index('audit_event_by_person').on(t.createdBy),
]);
