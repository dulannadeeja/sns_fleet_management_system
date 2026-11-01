import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { permissionGrant } from '../db/schema';
import { signedInPerson, nextStep, type SignedInPerson } from './first-sign-in';
import { allows, type Permission } from './permissions';

// TRD › Integrity rules: "Every server action and route calls requirePermission(user, action)" (PR-06, AT-24, AT-58).
// This part takes the request headers, so tests call it directly, as an outside request would.

export type Access =
  | { kind: 'allowed'; person: SignedInPerson }
  | { kind: 'redirect'; to: '/sign-in' | '/first-sign-in' }
  | { kind: 'denied'; person: SignedInPerson };

/** What the server does with a request needing `permission`: let it in, send it to sign in, or refuse it. */
export async function accessFor(headers: Headers, permission: Permission | 'owner'): Promise<Access> {
  const person = await signedInPerson(headers);
  const step = nextStep(person);
  if (step) return { kind: 'redirect', to: step };
  const p = person!;
  if (permission === 'owner') return p.role === 'owner' ? { kind: 'allowed', person: p } : { kind: 'denied', person: p };
  const granted = new Set((await db.select({ permission: permissionGrant.permission }).from(permissionGrant)
    .where(eq(permissionGrant.userId, p.id))).map((g) => g.permission));
  const disabledAt = p.disabledAt ? new Date(p.disabledAt) : null;
  return allows({ role: p.role, disabledAt }, granted, permission) ? { kind: 'allowed', person: p } : { kind: 'denied', person: p };
}
