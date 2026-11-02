import { bigint, date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/** A customer (ST-08.1 to ST-08.3; system design 6). One NIC is one customer. Saved with name, NIC, phone and licence
 *  number and expiry; the document copies may come later. Never deleted (copies follow the 7-year rule, later). */
export const customer = pgTable('customer', {
  id: uuid('id').primaryKey().defaultRandom(),
  nic: text('nic').notNull().unique('customer_one_per_nic'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  licenceNumber: text('licence_number').notNull(),
  licenceExpires: date('licence_expires').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('customer_by_name').on(t.name)]);

/** A document copy (NIC front and back, licence front and back): a private file, kept as taken. A new copy of the same
 *  kind is a new row; the newest one counts. Insert-only (migration 0015). */
export const customerDocument = pgTable('customer_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  kind: text('kind').notNull(),
  storageKey: text('storage_key').notNull().unique('customer_document_one_key'),
  contentType: text('content_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [index('customer_document_newest').on(t.customerId, t.kind, t.createdAt.desc())]);

/** Who opened which copy, when (AT-59). Insert-only. */
export const documentAccess = pgTable('document_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => customerDocument.id),
  openedBy: uuid('opened_by').notNull().references(() => user.id),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('document_access_by_document').on(t.documentId, t.openedAt.desc())]);
