import { bigint, check, date, index, integer, pgTable, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { partnerOwner } from './partners';

/** A car (system design 4.2; TRD › Data model, Cars). One car per registration number. A partner car may be saved before its
 *  partner and is linked to them on Partners (#20). Its status comes with #22. */
export const vehicle = pgTable('vehicle', {
  id: uuid('id').primaryKey().defaultRandom(),
  registration: text('registration').notNull().unique('vehicle_one_per_registration'),
  model: text('model').notNull(),
  ownership: text('ownership').notNull(),
  // A partner car's owner, once linked (ST-11.2); null for SNS cars and for partner cars not linked yet.
  partnerOwnerId: uuid('partner_owner_id').references(() => partnerOwner.id),
  // The starting package the car was added from (#21); its own terms are in vehicle_terms_version.
  startingPackageId: uuid('starting_package_id').references(() => startingPackage.id),
  // Papers and service dates (system design 11; #23, Confirmed 5 Nov 2026: empty until entered; everyone at SNS
  // enters them; old values are in the activity log. Reminders from them come in Phase 3.
  insuranceExpires: date('insurance_expires', { mode: 'string' }),
  licenceExpires: date('licence_expires', { mode: 'string' }),
  nextServiceOn: date('next_service_on', { mode: 'string' }),
  nextServiceKm: integer('next_service_km'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
}, () => [check('vehicle_ownership', sql`ownership in ('sns', 'partner')`)]);

/** A car's package and terms, one row per change (insert-only, migration 0013). The newest row applies to new rentals;
 *  a rental keeps the row that applied when it was agreed (4.3, PR-08, AT-05). Money in whole rupees (bigint, TRD). */
export const vehicleTermsVersion = pgTable('vehicle_terms_version', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
  dailyRate: bigint('daily_rate', { mode: 'number' }).notNull(),
  kmPerDay: integer('km_per_day').notNull(),
  extraKmRate: bigint('extra_km_rate', { mode: 'number' }).notNull(),
  // Partner cars only (null for SNS cars): SNS's commission, whole percent.
  commissionPercent: integer('commission_percent'),
  longRentalExtra: bigint('long_rental_extra', { mode: 'number' }).notNull(),
  longRentalFromDay: integer('long_rental_from_day').notNull(),
  garageDayCharge: bigint('garage_day_charge', { mode: 'number' }).notNull(),
  // Partner cars: the costs the owner pays (service, tyres, repairs, battery); anything else the admin decides.
  ownerPays: text('owner_pays').array().notNull().default([]),
}, (t) => [index('vehicle_terms_newest').on(t.vehicleId, t.effectiveFrom.desc())]);

/** A starting package (system design 4.1; #21, Confirmed 5 Nov 2026: a name and its rates. A new car starts from
 *  one; changing it changes only cars added afterwards. Old values are kept in the activity log. Money in whole rupees. */
export const startingPackage = pgTable('starting_package', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique('starting_package_one_per_name'),
  position: integer('position').notNull(),
  dailyRate: bigint('daily_rate', { mode: 'number' }).notNull(),
  kmPerDay: integer('km_per_day').notNull(),
  extraKmRate: bigint('extra_km_rate', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
});

/** Which models a package is for. A model can be in more than one package (insert-only for the app). */
export const startingPackageModel = pgTable('starting_package_model', {
  packageId: uuid('package_id').notNull().references(() => startingPackage.id),
  model: text('model').notNull(),
  position: integer('position').notNull(),
}, (t) => [primaryKey({ name: 'starting_package_model_pk', columns: [t.packageId, t.model] }), index('starting_package_model_by_model').on(t.model)]);

/** The defaults every new car starts with (system design 4.2): one row. The commission is for partner cars. */
export const packageDefault = pgTable('package_default', {
  id: smallint('id').primaryKey().default(1),
  commissionPercent: integer('commission_percent').notNull(),
  longRentalExtra: bigint('long_rental_extra', { mode: 'number' }).notNull(),
  longRentalFromDay: integer('long_rental_from_day').notNull(),
  garageDayCharge: bigint('garage_day_charge', { mode: 'number' }).notNull(),
}, () => [check('package_default_one_row', sql`id = 1`)]);

/** A car's status changes (system design 11; ST-04.5; #22), insert-only: the newest row is the car's status; none means
 *  Available. Rented and Overdue come from rentals (Phase 2), never from here. */
export const vehicleStatusEvent = pgTable('vehicle_status_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  status: text('status').notNull(),
  reason: text('reason'),
  expectedBack: date('expected_back', { mode: 'string' }),
  retiredOn: date('retired_on', { mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [
  index('vehicle_status_newest').on(t.vehicleId, t.createdAt.desc()),
  check('vehicle_status_kind', sql`status in ('available', 'repair', 'unavailable', 'retired')`),
  check('vehicle_status_retired_on', sql`(status = 'retired') = (retired_on is not null)`),
]);

/** A car's catalogue photo (system design 4.2; CR-001, ADD-003; #23), insert-only: the newest row is the photo, and a
 *  row with no file means it was removed (the model's standard image shows). The file is in private storage. */
export const vehiclePhoto = pgTable('vehicle_photo', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id),
  storageKey: text('storage_key'),
  contentType: text('content_type'),
  size: integer('size'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').references(() => user.id),
}, (t) => [
  index('vehicle_photo_newest').on(t.vehicleId, t.createdAt.desc()),
  check('vehicle_photo_file', sql`(storage_key is null) = (content_type is null) and (storage_key is null) = (size is null)`),
  check('vehicle_photo_kind', sql`content_type is null or content_type in ('image/jpeg', 'image/png', 'image/webp')`),
]);
