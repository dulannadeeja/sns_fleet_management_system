import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { user } from '../db/schema';
import { auth } from './server';

// "Forgot password?" (screen 01.5; system design 3.1 "Email codes and email reset", Proposed): the owner or the admin
// types their phone number; if it is theirs and they have a confirmed email, a link (once, 1 hour) is emailed.
// Nothing is returned: the page gives the same answer for any number, so it never shows which numbers have accounts.
export async function requestResetByPhone(phone: string): Promise<void> {
  const [found] = await db.select({ email: user.email }).from(user)
    .where(and(eq(user.phoneNumber, phone), inArray(user.role, ['owner', 'admin']), eq(user.emailVerified, true), isNull(user.disabledAt)));
  if (!found) return;
  await auth.api.requestPasswordReset({ body: { email: found.email, redirectTo: '/reset-password' } });
}
