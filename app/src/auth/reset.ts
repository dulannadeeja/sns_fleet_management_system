import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { auth } from './server';

// "Forgot password?" (screen 01.5; system design 3.1 "Email codes and email reset", Proposed): the owner or the admin
// types their phone number; if it is theirs and they have a confirmed email, a link (once, 1 hour) is emailed.
// Nothing is returned: the page gives the same answer for any number, so it never shows which numbers have accounts.
export async function requestResetByPhone(phone: string): Promise<void> {
  // At most one reset email a minute per person, so nobody can flood the owner's or admin's inbox (#28 review).
  const found = await db.execute(sql`update "user" set reset_sent_at = now()
    where phone_number = ${phone} and role in ('owner', 'admin') and email_verified = true and disabled_at is null
      and (reset_sent_at is null or reset_sent_at <= now() - interval '1 minute')
    returning email`);
  const email = found.rows[0]?.email;
  if (typeof email !== 'string') return;
  await auth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } });
}
