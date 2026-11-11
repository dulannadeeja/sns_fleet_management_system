import { forbidden } from 'next/navigation';
import { requireUser } from '../../auth/require';
import { mayDo } from '../../auth/access';

/** The Approvals pages are for whoever may decide something there: a price change ("Change agreed rental price or
 *  grant discount") or damage, accessory and garage-day money ("Allocate damage proceeds", #63). */
export async function requireDecider() {
  const person = await requireUser();
  if (!(await mayDo(person, 'changePriceOrDiscount')) && !(await mayDo(person, 'allocateDamageProceeds'))) forbidden();
  return person;
}
