import { bigint, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

/** A car (system design 4.2; TRD › Data model, Cars). One car per registration number. A partner car is saved before its
 *  partner and is linked to them on Partners (#20). Its status comes with #22. */
export const vehicle = pgTable('vehicle', {
  id: uuid('id').primaryKey().defaultRandom(),
  registration: text('registration').notNull().unique('vehicle_one_per_registration'),
  model: text('model').notNull(),
  ownership: text('ownership').notNull(),
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
}, (t) => [index('vehicle_terms_newest').on(t.vehicleId, t.effectiveFrom.desc())]);
