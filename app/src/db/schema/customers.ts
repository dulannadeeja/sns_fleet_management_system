import { bigint, boolean, check, date, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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

/** A customer flag (ST-08.5; system design 6, Confirmed): why (unpaid money, damaged a car, something else) and what
 *  happened. It warns before every future rental until closed with a reason; a closed flag stays, with who closed it and
 *  when. Insert-only apart from closing it once (migration 0020). */
export const customerFlag = pgTable('customer_flag', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  kind: text('kind').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedBy: uuid('closed_by').references(() => user.id),
  closeReason: text('close_reason'),
}, (t) => [
  index('customer_flag_by_customer').on(t.customerId, t.createdAt.desc()),
  check('customer_flag_kind', sql`kind in ('unpaid', 'damage', 'other')`),
  check('customer_flag_closed', sql`(closed_at is null) = (closed_by is null) and (closed_at is null) = (close_reason is null)`),
]);

/** A decision to continue despite warnings (ST-08.4): the open flags and an expired licence shown, the reason, who and
 *  when. Until New rental exists (Phase 2) it is made from the customer's page. Insert-only. */
export const customerGoAhead = pgTable('customer_go_ahead', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  flagIds: uuid('flag_ids').array().notNull().default([]),
  licenceExpired: boolean('licence_expired').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [index('customer_go_ahead_by_customer').on(t.customerId, t.createdAt.desc())]);

/** A reference person, kept with the customer (ST-05.5; system design 6, Confirmed 8 Nov 2026): name, NIC, phone and,
 *  if noted, how they know the customer. One NIC is one reference person for that customer; a later rental can pick
 *  them again. */
export const referencePerson = pgTable('reference_person', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  name: text('name').notNull(),
  nic: text('nic').notNull(),
  phone: text('phone').notNull(),
  relationship: text('relationship'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [
  unique('reference_person_one_per_nic').on(t.customerId, t.nic),
  unique('reference_person_of_customer').on(t.customerId, t.id),
  check('reference_person_relationship', sql`relationship is null or relationship in ('family', 'friend', 'employer', 'other')`),
]);

/** A reference person's copy (NIC front and back, driving licence): a private file, kept as taken; the newest of a kind
 *  counts. Insert-only. */
export const referenceDocument = pgTable('reference_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  referencePersonId: uuid('reference_person_id').notNull().references(() => referencePerson.id),
  kind: text('kind').notNull(),
  storageKey: text('storage_key').notNull().unique('reference_document_one_key'),
  contentType: text('content_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [
  index('reference_document_newest').on(t.referencePersonId, t.kind, t.createdAt.desc()),
  check('reference_document_kind', sql`kind in ('nicFront', 'nicBack', 'licence')`),
]);
