import { bigint, boolean, check, customType, foreignKey, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { customer, customerGoAhead, referencePerson } from './customers';
import { vehicle, vehicleTermsVersion } from './cars';

// Rentals (system design 4.3, 5, 7; TRD › Data model "Rentals", Integrity rules; #50). Money in whole rupees (bigint).
// Reservations come with #52 and hold cars the same way (vehicle_hold).

/** A Postgres tstzrange, written as '[from,to)'. */
const tstzrange = customType<{ data: string }>({ dataType: () => 'tstzrange' });

/** A rental: one customer, from pickup to the return deadline. Its terms are its own copy (rental_terms_snapshot and
 *  each segment), never the car's live package (PR-08, AT-05). */
export const rental = pgTable('rental', {
  id: uuid('id').primaryKey().defaultRandom(),
  // The rental's number on paper (R-0001, R-0002 …; system design 14, 8 Nov 2026).
  number: integer('number').generatedByDefaultAsIdentity().notNull().unique('rental_one_per_number'),
  customerId: uuid('customer_id').notNull().references(() => customer.id),
  status: text('status').notNull().default('draft'),
  pickupAt: timestamp('pickup_at', { withTimezone: true }).notNull(),
  days: integer('days').notNull(),
  deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
  // The decision to continue despite the customer's warnings, when there were any (7.1, Confirmed 8 Nov 2026): one
  // decision starts one rental.
  goAheadId: uuid('go_ahead_id').references(() => customerGoAhead.id).unique('rental_one_per_go_ahead'),
  // Step 4 (05.4; system design 8.1, 8.2, 6; Confirmed 8 Nov 2026), null until set; changeable until handover, each
  // change in rental_event and the activity log. A waived deposit has no amount and a reason.
  depositAmount: bigint('deposit_amount', { mode: 'number' }),
  depositWaivedReason: text('deposit_waived_reason'),
  rentPaid: text('rent_paid'),
  fuel: text('fuel'),
  referenceRequired: boolean('reference_required'),
  referencePersonId: uuid('reference_person_id').references(() => referencePerson.id),
  termsSetAt: timestamp('terms_set_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
}, (t) => [
  index('rental_by_customer').on(t.customerId, t.createdAt.desc()),
  check('rental_status', sql`status in ('draft', 'active', 'notCollected')`),
  check('rental_days', sql`days >= 1 AND days <= 90`),
  check('rental_deadline_after_pickup', sql`deadline_at > pickup_at`),
  check('rental_deposit', sql`(deposit_amount is null or deposit_amount between 1 and 500000) and not (deposit_amount is not null and deposit_waived_reason is not null)`),
  check('rental_rent_paid', sql`rent_paid is null or rent_paid in ('now', 'return')`),
  check('rental_fuel', sql`fuel is null or fuel in ('notCounted', 'sameLevel')`),
  check('rental_reference_only_if_required', sql`reference_person_id is null or reference_required = true`),
  // The reference person is the rental's own customer's (#54 review).
  foreignKey({ name: 'rental_reference_of_customer', columns: [t.customerId, t.referencePersonId], foreignColumns: [referencePerson.customerId, referencePerson.id] }),
  check('rental_terms_complete', sql`terms_set_at is null or ((deposit_amount is not null or deposit_waived_reason is not null) and rent_paid is not null and fuel is not null and reference_required is not null)`),
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

/** The handover (06.4; ST-06.4; system design 6, Confirmed 10 Nov 2026): one per rental, kept as recorded. The
 *  odometer, the fuel level (five steps), the accessories list as it was ticked (each item, there or missing) and,
 *  for a car whose papers were past or missing, who decided and why. Insert-only. */
export const rentalHandover = pgTable('rental_handover', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id).unique('rental_handover_one_per_rental'),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  outKm: integer('out_km').notNull(),
  fuel: text('fuel').notNull(),
  accessories: jsonb('accessories').notNull(),
  papersReason: text('papers_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [
  index('rental_handover_by_vehicle').on(t.vehicleId, t.createdAt.desc()),
  check('rental_handover_km', sql`out_km between 0 and 999999`),
  check('rental_handover_fuel', sql`fuel in ('empty', 'quarter', 'half', 'threeQuarters', 'full')`),
]);

/** An optional photo of the car's condition at handover, private like ID copies, kept with the rental (up to 10;
 *  10 Nov 2026). Insert-only. */
export const handoverPhoto = pgTable('handover_photo', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  storageKey: text('storage_key').notNull().unique('handover_photo_one_key'),
  contentType: text('content_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [index('handover_photo_by_rental').on(t.rentalId, t.createdAt)]);
