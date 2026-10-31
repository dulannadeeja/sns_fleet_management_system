import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** The activity log. Insert-only: a trigger refuses UPDATE and DELETE (migration 0001; TRD › Integrity rules).
 *  created_by is the person who acted, or null for the system; its link to `user` comes with sign-in (#14). */
export const auditEvent = pgTable('audit_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  details: jsonb('details'),
});
