// Test-only (browser journeys): makes sure the test database has its one owner (codes off for it, test-only: several
// journeys sign in as the owner within a minute; the code step is proved with sample admins in email.spec.ts), signed-in ready with a known test
// password (E2E_OWNER_PASSWORD) and no first password to change, and prints the owner's phone number. Sample data.
import { and, eq, isNull, like, lt, ne } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { account, user } from '../../src/db/schema';
import { auth } from '../../src/auth/server';
import { addPerson } from '../../src/modules/people/people';
import { assertTestDatabase } from '../setup/db';

assertTestDatabase(process.env.DATABASE_URL);

// Sample people from earlier runs stay in the test database (people are never deleted); turning them off keeps the
// screens as small as SNS's real team.
await db.update(user).set({ disabledAt: new Date(), disabledReason: 'Sample from an earlier test run' })
  .where(and(like(user.name, 'Sample%'), isNull(user.disabledAt), ne(user.role, 'owner'), lt(user.createdAt, new Date(Date.now() - 60_000))));

const password = process.env.E2E_OWNER_PASSWORD;
const E2E_OWNER_EMAIL = 'sample-e2e-owner@example.com';
if (!password) throw new Error('E2E_OWNER_PASSWORD is not set');
let [owner] = await db.select({ id: user.id, phone: user.phoneNumber }).from(user).where(eq(user.role, 'owner'));
if (!owner) {
  const phone = `077${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  const added = await addPerson(null, { name: 'Sample owner', phone, password, role: 'owner', email: `sample-owner-${Date.now()}@example.com` });
  if (!('ok' in added)) throw new Error(added.error);
  owner = { id: added.id, phone };
}
const hash = await (await auth.$context).password.hash(password);
await db.update(account).set({ password: hash }).where(and(eq(account.userId, owner.id), eq(account.providerId, 'credential')));
await db.update(user).set({ email: E2E_OWNER_EMAIL, emailVerified: true, pendingEmail: null, twoFactorEnabled: false, codeSentAt: null, mustChangePassword: false, language: 'en', failedSignIns: 0, lockedUntil: null, disabledAt: null, disabledReason: null }).where(eq(user.id, owner.id));
console.log(owner.phone);
process.exit(0);
