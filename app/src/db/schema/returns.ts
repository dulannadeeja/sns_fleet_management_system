import { bigint, check, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { rental } from './rentals';
import { vehicle } from './cars';

// Receiving the car and the bill (07.1, 07.2; ST-07.1, ST-07.2; system design 7.4 "Receiving the car", 8.4; Confirmed
// 11 Nov 2026; #63). Whole rupees. Both tables are insert-only: a correction is a new dated line.

/** The return: one per rental, kept as recorded. */
export const rentalReturn = pgTable('rental_return', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id).unique('rental_return_one_per_rental'),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  inKm: integer('in_km').notNull(),
  fuel: text('fuel').notNull(),
  accessories: jsonb('accessories').notNull(),
  fuelTakenOut: integer('fuel_taken_out'),
  lateMinutes: integer('late_minutes').notNull(),
  nextState: text('next_state').notNull(),
  nextReason: text('next_reason'),
  payLaterNote: text('pay_later_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('rental_return_by_vehicle').on(t.vehicleId, t.createdAt.desc()),
  check('rental_return_km', sql`in_km between 0 and 999999`),
  check('rental_return_fuel', sql`fuel in ('empty', 'quarter', 'half', 'threeQuarters', 'full')`),
  check('rental_return_next', sql`next_state in ('available', 'repair', 'unavailable') and (next_state = 'available' or next_reason is not null)`),
]);

/** One line of a rental's bill. `allocation` says who gets it: by the car's commission (partner_share worked out with
 *  splitShare), all SNS's, or waiting for the admin's split (an approval of kind 'split'). A waived late charge or fuel
 *  is a line of 0 with its reason, so the decision is on the bill. */
export const charge = pgTable('charge', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  kind: text('kind').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  details: jsonb('details').notNull().default({}),
  reason: text('reason'),
  allocation: text('allocation').notNull(),
  partnerShare: bigint('partner_share', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('charge_by_rental').on(t.rentalId, t.createdAt),
  check('charge_kind', sql`kind in ('rent', 'rentExtra', 'longRental', 'discount', 'extraKm', 'late', 'fuel', 'accessory', 'damage', 'garageDays')`),
  check('charge_allocation', sql`allocation in ('commission', 'split', 'sns', 'admin')`),
  check('charge_share', sql`(allocation in ('commission', 'split')) = (partner_share is not null)`),
]);
