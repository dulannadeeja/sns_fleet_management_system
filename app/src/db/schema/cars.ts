import { bigint, check, index, integer, pgTable, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
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

/** A starting package (system design 4.1; #21, Proposed: Dulan, 2 Nov 2026): a name and its rates. A new car starts from
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
