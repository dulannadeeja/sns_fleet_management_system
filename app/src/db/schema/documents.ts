import { bigint, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import { rental } from './rentals';

// The rental agreement (ST-05.6, ST-16.1; system design 14, Confirmed 8 Nov 2026; #55).

/** A version of SNS's agreement conditions, in Sinhala and English. Only the owner adds and approves one; an approved
 *  version never changes (a change is a new version). The newest approved version is printed. */
export const agreementWording = pgTable('agreement_wording', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull().unique('agreement_wording_one_per_version'),
  textSi: text('text_si').notNull(),
  textEn: text('text_en').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => user.id),
});

/** One printed agreement: what was printed, kept as it was (business details, rental, terms, the wording in the chosen
 *  language and its version), so a reprint of it shows the same. Insert-only. */
export const agreementPrint = pgTable('agreement_print', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  wordingId: uuid('wording_id').notNull().references(() => agreementWording.id),
  language: text('language').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [index('agreement_print_by_rental').on(t.rentalId, t.createdAt.desc())]);

/** A photo or scan of the signed agreement: a private file, kept as taken; the newest counts. Insert-only. */
export const agreementSigned = pgTable('agreement_signed', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentalId: uuid('rental_id').notNull().references(() => rental.id),
  // The printout this copy signs (#55 review): a copy is current only while its printout is the newest one and newer
  // than the rental's terms.
  printId: uuid('print_id').references(() => agreementPrint.id),
  storageKey: text('storage_key').notNull().unique('agreement_signed_one_key'),
  contentType: text('content_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  createdBy: uuid('created_by').notNull().references(() => user.id),
}, (t) => [index('agreement_signed_by_rental').on(t.rentalId, t.createdAt.desc())]);
