import { bigint, boolean, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { rental } from './rentals';

// Approvals (system design 3.2 "Asking for a different price", Confirmed 11 Nov 2026; ST-05.7, ST-10.1 to ST-10.3; #56).
// Whole rupees. Both tables are insert-only: a request is decided once, by a new row; the rental's saved terms never change.

/** A request for a different price on a rental: a new daily rate for the whole rental, or a discount off the bill. */
export const approvalRequest = pgTable('approval_request', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  kind: text('kind').notNull(),
  newDailyRate: bigint('new_daily_rate', { mode: 'number' }),
  discount: bigint('discount', { mode: 'number' }),
  // Garage days proposed at return (#63), and the bill line whose split the admin decides (#63).
  days: integer('days'),
  chargeId: uuid('charge_id'),
  // A payment correction (#65): which payment's part on this rental, what is wrong ('amount', 'method', 'reference',
  // 'rental'), and what it should be. rate_was is 0 and estimate_was is the part's amount when asked.
  paymentId: uuid('payment_id'),
  fix: text('fix'),
  newAmount: bigint('new_amount', { mode: 'number' }),
  newMethod: text('new_method'),
  newReference: text('new_reference'),
  toRentalId: uuid('to_rental_id').references(() => rental.id),
  // The daily rate and the estimate when it was asked, so the effect shown is the effect asked for.
  rateWas: bigint('rate_was', { mode: 'number' }).notNull(),
  estimateWas: bigint('estimate_was', { mode: 'number' }).notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('approval_request_by_rental').on(t.rentalId, t.createdAt.desc()),
  check('approval_request_kind', sql`(kind = 'rate' and new_daily_rate between 1 and 100000 and discount is null) or (kind = 'discount' and discount >= 1 and new_daily_rate is null) or (kind = 'garageDays' and days between 1 and 30) or (kind = 'split' and charge_id is not null) or (kind = 'correction' and payment_id is not null and ((fix = 'amount' and new_amount >= 0) or (fix = 'method' and new_method in ('cash', 'bank', 'card') and (new_method = 'cash') = (new_reference is null)) or (fix = 'reference' and new_reference is not null) or (fix = 'rental' and to_rental_id is not null)))`),
  index('approval_request_by_payment').on(t.paymentId),
]);

/** The decision on a request: approved, rejected, withdrawn (by its sender) or closed (the rental ended first, 11 Nov
 *  2026), once. For a rate above a partner car's
 *  package: the partner's rupees of the extra, and why. The primary owner deciding their own request: self-approved. */
export const approvalDecision = pgTable('approval_decision', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => approvalRequest.id).unique('approval_decision_one_per_request'),
  outcome: text('outcome').notNull(),
  note: text('note'),
  partnerExtra: bigint('partner_extra', { mode: 'number' }),
  splitReason: text('split_reason'),
  selfApproved: boolean('self_approved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, () => [
  check('approval_decision_outcome', sql`outcome in ('approved', 'rejected', 'withdrawn', 'closed')`),
  check('approval_decision_reject_note', sql`outcome <> 'rejected' or (note is not null and length(note) > 0)`),
  check('approval_decision_split', sql`(partner_extra is null) = (split_reason is null) and (partner_extra is null or (outcome = 'approved' and partner_extra >= 0))`),
]);
