import { bigint, boolean, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { customer } from './customers';
import { rental } from './rentals';
import { approvalRequest } from './approvals';

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

/** Settling a rental's deposit after return (8.2, #64): one per rental, in one save; whether the customer agreed that
 *  what is left pays their older bills, and how they agreed. */
export const depositSettlement = pgTable('deposit_settlement', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id).unique('deposit_settlement_one_per_rental'),
  olderAgreed: boolean('older_agreed').notNull(),
  agreementNote: text('agreement_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, () => [
  check('deposit_settlement_note', sql`older_agreed = (agreement_note is not null)`),
]);

/** Deposit money (8.2): `received` from a payment; at settlement (#64) `applied` to a bill (this rental's or an older one
 *  of the customer's, `to_rental_id`) and `refunded` (cash, or bank with its reference). Held money, never income. */
export const depositMovement = pgTable('deposit_movement', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  kind: text('kind').notNull(),
  paymentId: uuid('payment_id').references(() => payment.id),
  settlementId: uuid('settlement_id').references(() => depositSettlement.id),
  // The approved correction an `adjusted` row comes from (#65).
  requestId: uuid('request_id').references(() => approvalRequest.id),
  toRentalId: uuid('to_rental_id').references(() => rental.id),
  method: text('method'),
  reference: text('reference'),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('deposit_movement_by_rental').on(t.rentalId),
  index('deposit_movement_by_to_rental').on(t.toRentalId),
  check('deposit_movement_kind', sql`kind in ('received', 'applied', 'refunded', 'adjusted')`),
  // An approved correction of a deposit payment (#65) adds or takes away the difference: the only kind that may be negative.
  check('deposit_movement_amount', sql`case when kind = 'adjusted' then amount <> 0 else amount > 0 end`),
  check('deposit_movement_received_has_payment', sql`kind not in ('received', 'adjusted') or payment_id is not null`),
  check('deposit_movement_settled', sql`(kind in ('applied', 'refunded')) = (settlement_id is not null)`),
  check('deposit_movement_applied_to', sql`(kind = 'applied') = (to_rental_id is not null)`),
  check('deposit_movement_adjusted_request', sql`(kind = 'adjusted') = (request_id is not null)`),
  check('deposit_movement_refund_method', sql`case when kind = 'refunded' then method in ('cash', 'bank') and (method = 'cash') = (reference is null) else method is null and reference is null end`),
]);

/** Money into or out of the shared drawer, with who (9). A cash payment part adds one (`paymentIn`), a cash deposit refund
 *  one (`refundOut`, #64); the count reads them (Phase 3). */
export const cashMovement = pgTable('cash_movement', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  paymentId: uuid('payment_id').references(() => payment.id),
  // A cash deposit refund (#64): the movement it pays out.
  depositMovementId: uuid('deposit_movement_id').references(() => depositMovement.id),
  // Money above a lowered bill paid back in cash (#65), and an approved payment correction's drawer line (#65).
  refundId: uuid('refund_id').references(() => refund.id),
  requestId: uuid('request_id').references(() => approvalRequest.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('cash_movement_by_time').on(t.createdAt),
  check('cash_movement_kind', sql`kind in ('paymentIn', 'refundOut', 'correctionIn', 'correctionOut')`),
  check('cash_movement_amount', sql`amount > 0`),
  check('cash_movement_payment_in', sql`kind <> 'paymentIn' or payment_id is not null`),
  check('cash_movement_refund_out', sql`kind <> 'refundOut' or (deposit_movement_id is null) <> (refund_id is null)`),
  check('cash_movement_correction', sql`(kind in ('correctionIn', 'correctionOut')) = (request_id is not null)`),
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

/** An approved payment correction's dated line on a bill payment's part on one rental (8.3, #65): + or −, never 0. The
 *  payment and its allocation are never changed; the part is the allocation plus these lines. Moving a payment to
 *  another rental is two lines (− here, + there). */
export const paymentAdjustment = pgTable('payment_adjustment', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => approvalRequest.id),
  paymentId: uuid('payment_id').notNull().references(() => payment.id),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('payment_adjustment_by_rental').on(t.rentalId),
  index('payment_adjustment_by_payment').on(t.paymentId),
  check('payment_adjustment_amount', sql`amount <> 0`),
]);

/** Money above a lowered bill paid back (8.3, #65): cash (a drawer line) or bank with its reference. Cancellation and
 *  no-show refunds come with #59. */
export const refund = pgTable('refund', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  kind: text('kind').notNull(),
  method: text('method').notNull(),
  reference: text('reference'),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('refund_by_rental').on(t.rentalId),
  check('refund_kind', sql`kind in ('overpaid')`),
  check('refund_method', sql`method in ('cash', 'bank') and (method = 'cash') = (reference is null)`),
  check('refund_amount', sql`amount > 0`),
]);

/** A debt written off by the authorised person (8.3, #65): all or part of the customer's debt, with the reason. */
export const writeOff = pgTable('write_off', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('write_off_by_customer').on(t.customerId, t.createdAt.desc()),
  check('write_off_amount', sql`amount > 0`),
  check('write_off_reason', sql`length(reason) > 0`),
]);

/** The part of a write-off on each rental, oldest rentals first. The bill stays; this part can no longer be paid. */
export const writeOffLine = pgTable('write_off_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  writeOffId: uuid('write_off_id').notNull().references(() => writeOff.id),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
}, (t) => [
  index('write_off_line_by_rental').on(t.rentalId),
  check('write_off_line_amount', sql`amount > 0`),
]);
