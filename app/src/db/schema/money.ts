import { bigint, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { customer } from './customers';
import { rental } from './rentals';

// Money (system design 8.1, 8.2, 9; TRD › Data model "Charges and money", Integrity rules; ST-09.1, #53). Whole rupees
// (bigint). Every table here is insert-only: a mistake is a correction (8.3), never an edit.

/** One payment, as taken: one method, one amount. A mixed payment is one row per part. Numbered P-0001 on paper. */
export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: integer('number').generatedByDefaultAsIdentity().notNull().unique('payment_one_per_number'),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  method: text('method').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  // The bank transfer's reference or the card machine's receipt number (8.1); none for cash.
  reference: text('reference'),
  // Why it was saved although the same reference is on another payment of the same method (9 Nov 2026).
  sameReferenceReason: text('same_reference_reason'),
  // One form sent twice is recorded once: the form's key and the part's place in it (TRD › Integrity rules).
  idempotencyKey: text('idempotency_key').notNull().unique('payment_one_per_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('payment_by_customer').on(t.customerId, t.createdAt.desc()),
  index('payment_by_reference').on(t.method, sql`lower(${t.reference})`),
  check('payment_method', sql`method in ('cash', 'bank', 'card')`),
  check('payment_amount', sql`amount > 0`),
  check('payment_reference', sql`(method = 'cash') = (reference is null)`),
]);

/** The part of a payment put on a rental's bill. The parts of one payment never add up to more than it (checked in
 *  recordPayment, under the customer's lock). */
export const paymentAllocation = pgTable('payment_allocation', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payment.id),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('payment_allocation_by_rental').on(t.rentalId),
  index('payment_allocation_by_payment').on(t.paymentId),
  check('payment_allocation_amount', sql`amount > 0`),
]);

/** Deposit money: received from a payment now; applied to a bill and refunded with #64. Held money, never income (8.2). */
export const depositMovement = pgTable('deposit_movement', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  kind: text('kind').notNull(),
  paymentId: uuid('payment_id').references(() => payment.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('deposit_movement_by_rental').on(t.rentalId),
  check('deposit_movement_kind', sql`kind in ('received')`),
  check('deposit_movement_amount', sql`amount > 0`),
  check('deposit_movement_received_has_payment', sql`kind <> 'received' or payment_id is not null`),
]);

/** Money into or out of the shared drawer, with who (9). A cash payment part adds one now; the count reads them (Phase 3). */
export const cashMovement = pgTable('cash_movement', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  paymentId: uuid('payment_id').references(() => payment.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('cash_movement_by_time').on(t.createdAt),
  check('cash_movement_kind', sql`kind in ('paymentIn')`),
  check('cash_movement_amount', sql`amount > 0`),
  check('cash_movement_payment_in', sql`kind <> 'paymentIn' or payment_id is not null`),
]);

/** The bank or card check of a payment, kept apart from it being paid (9): the newest row is its state. A bank or card
 *  payment starts waiting; matching and flagging come in Phase 3. */
export const reconciliation = pgTable('reconciliation', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payment.id),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('reconciliation_by_payment').on(t.paymentId, t.createdAt.desc()),
  check('reconciliation_status', sql`status in ('waiting', 'matched', 'flagged')`),
]);
