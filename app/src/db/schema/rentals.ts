import { bigint, check, customType, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { customer } from './customers';
import { vehicle, vehicleTermsVersion } from './cars';

// Rentals (system design 4.3, 5, 7; TRD › Data model "Rentals", Integrity rules; #50). Money in whole rupees (bigint).
// Reservations come with #52 and hold cars the same way (vehicle_hold).

/** A Postgres tstzrange, written as '[from,to)'. */
const tstzrange = customType<{ data: string }>({ dataType: () => 'tstzrange' });

/** A rental: one customer, from pickup to the return deadline. Its terms are its own copy (rental_terms_snapshot and
 *  each segment), never the car's live package (PR-08, AT-05). */
export const rental = pgTable('rental', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  status: text('status').notNull().default('draft'),
  pickupAt: timestamp('pickup_at', { withTimezone: true }).notNull(),
  days: integer('days').notNull(),
  deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
}, (t) => [
  index('rental_by_customer').on(t.customerId, t.createdAt.desc()),
  check('rental_status', sql`status in ('draft')`),
  check('rental_days', sql`days >= 1 AND days <= 90`),
  check('rental_deadline_after_pickup', sql`deadline_at > pickup_at`),
]);

/** The business-wide terms a rental keeps (4.3): cutoff, deadline and the fuel price per litre when it was agreed.
 *  One per rental; insert-only. */
export const rentalTermsSnapshot = pgTable('rental_terms_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id).unique('rental_terms_one_per_rental'),
  pickupCutoff: text('pickup_cutoff').notNull(),
  returnDeadline: text('return_deadline').notNull(),
  fuelPricePerLitre: bigint('fuel_price_per_litre', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
});

/** One car's part of a rental, with that car's terms copied when it joined (4.3 derived control). A swap adds a
 *  segment (#62); readings are added at handover and return. */
export const rentalVehicleSegment = pgTable('rental_vehicle_segment', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  position: integer('position').notNull(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  termsVersionId: uuid('terms_version_id').notNull().references(() => vehicleTermsVersion.id),
  dailyRate: bigint('daily_rate', { mode: 'number' }).notNull(),
  kmPerDay: integer('km_per_day').notNull(),
  extraKmRate: bigint('extra_km_rate', { mode: 'number' }).notNull(),
  commissionPercent: integer('commission_percent'),
  longRentalExtra: bigint('long_rental_extra', { mode: 'number' }).notNull(),
  longRentalFromDay: integer('long_rental_from_day').notNull(),
  garageDayCharge: bigint('garage_day_charge', { mode: 'number' }).notNull(),
  ownerPays: text('owner_pays').array().notNull().default([]),
  outKm: integer('out_km'),
  inKm: integer('in_km'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [index('rental_segment_by_rental').on(t.rentalId, t.position)]);

/** Which car is held for which time (TRD › Integrity rules: one rental or reservation per car at any time). The
 *  exclusion constraint is in the migration; a hold is removed or shortened when its rental ends or is cancelled. */
export const vehicleHold = pgTable('vehicle_hold', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  held: tstzrange('held').notNull(),
  rentalId: uuid('rental_id').references(() => rental.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
}, () => [check('vehicle_hold_for_something', sql`rental_id is not null`)]);

/** What happened to a rental, with who and when (created, extended, swapped, returned …). Insert-only. */
export const rentalEvent = pgTable('rental_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  kind: text('kind').notNull(),
  details: jsonb('details').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [index('rental_event_by_rental').on(t.rentalId, t.createdAt)]);
