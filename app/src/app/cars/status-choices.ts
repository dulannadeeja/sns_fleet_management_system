import 'server-only';
import { mayDo } from '../../auth/access';
import type { SignedInPerson } from '../../auth/first-sign-in';
import type { CarState } from '../../modules/cars/status';

/** The statuses this person may set from the car's status now (system design 3.2 and 11; the module checks again). */
export async function statusChoices(person: SignedInPerson, now: CarState): Promise<CarState[]> {
  if (now === 'retired') return person.role === 'owner' ? ['available'] : [];
  const away = (await mayDo(person, 'markCarUnavailable')) ? (['repair', 'unavailable'] as const) : [];
  const back = now !== 'available' && (await mayDo(person, 'markCarAvailable')) ? (['available'] as const) : [];
  const retire = person.role === 'owner' || person.role === 'admin' ? (['retired'] as const) : [];
  return [...back, ...away, ...retire];
}
