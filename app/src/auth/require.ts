import 'server-only';
import { headers } from 'next/headers';
import { forbidden, redirect } from 'next/navigation';
import { accessFor } from './access';
import { nextStep, signedInPerson, type SignedInPerson } from './first-sign-in';
import type { Permission } from './permissions';

/** For every signed-in page and action: the signed-in person, or a redirect to sign-in or first sign-in (ST-01.1, ST-01.2). */
export async function requireUser(): Promise<SignedInPerson> {
  const person = await signedInPerson(await headers());
  const step = nextStep(person);
  if (step) redirect(step);
  return person!;
}

/** The signed-in person if they may do `permission` (the owner may do everything); otherwise 403, also when the page or
 *  action is called directly (PR-06, AT-24). */
export async function requirePermission(permission: Permission): Promise<SignedInPerson> {
  return settle(await accessFor(await headers(), permission));
}

/** Adding people, changing permissions and turning accounts off or on: the primary owner only (system design 3.2, AT-58). */
export async function requireOwner(): Promise<SignedInPerson> {
  return settle(await accessFor(await headers(), 'owner'));
}

function settle(access: Awaited<ReturnType<typeof accessFor>>): SignedInPerson {
  if (access.kind === 'redirect') redirect(access.to);
  if (access.kind === 'denied') forbidden();
  return access.person;
}
