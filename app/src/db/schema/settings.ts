import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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

/** The owner's ticks on the go-live checklist (ST-01.3; #25, Confirmed 5 Nov 2026: insert-only; the newest row
 *  for an item counts. Unticking needs a reason. Items the system checks by itself have no ticks. */
export const goliveTick = pgTable('golive_tick', {
  id: uuid('id').primaryKey().defaultRandom(),
  item: text('item').notNull(),
  done: boolean('done').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [index('golive_tick_newest').on(t.item, t.createdAt.desc())]);
