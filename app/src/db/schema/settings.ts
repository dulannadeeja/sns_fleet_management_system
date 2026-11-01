import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/** The owner settings (system design 3.2 "Owner settings"; TRD › Data model, Decisions): one row per setting the owner
 *  has changed. A setting with no row has its built-in starting value (src/modules/settings). Each change is in the
 *  activity log with the old and new values; rows are never deleted. */
export const setting = pgTable('setting', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => user.id),
});
