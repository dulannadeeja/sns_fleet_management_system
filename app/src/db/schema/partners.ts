import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/** A partner owner (ST-11.1 to ST-11.3; system design 3.2 "Partner accounts", Proposed): one sign-in account for all
 *  their cars (`user` with role partner), their NIC (one partner per NIC), an optional bank account for cash-outs, and
 *  the date the paper agreement was signed. Never deleted; the owner turns the account off. */
export const partnerOwner = pgTable('partner_owner', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique('partner_owner_one_account').references(() => user.id),
  nic: text('nic').notNull().unique('partner_owner_one_per_nic'),
  bankAccount: text('bank_account'),
  agreementSignedOn: date('agreement_signed_on'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => user.id),
});
