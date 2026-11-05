import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/** What a person may do beyond the defaults' starting point (system design 3.2; TRD › Data model, Identity).
 *  A row is a grant; removing it takes the permission away. Every grant and removal is in the activity log. */
export const permissionGrant = pgTable('permission_grant', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id),
  permission: text('permission').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [unique('permission_grant_once').on(t.userId, t.permission)]);
