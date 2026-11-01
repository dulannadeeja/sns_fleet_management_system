import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { nextStep, signedInPerson, type SignedInPerson } from './first-sign-in';

/** For every signed-in page and action: the signed-in person, or a redirect to sign-in or first sign-in (ST-01.1, ST-01.2). */
export async function requireUser(): Promise<SignedInPerson> {
  const person = await signedInPerson(await headers());
  const step = nextStep(person);
  if (step) redirect(step);
  return person!;
}
