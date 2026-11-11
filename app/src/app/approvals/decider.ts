import { forbidden } from 'next/navigation';
import { requireUser } from '../../auth/require';
import { mayDo } from '../../auth/access';

/** The Approvals pages are for whoever may decide something there: a price change ("Change agreed rental price or
 *  grant discount"), damage, accessory and garage-day money ("Allocate damage proceeds", #63) or a payment correction
 *  ("Correct a recorded payment", #65). */
export async function requireDecider() {
  const person = await requireUser();
  if (!(await mayDo(person, 'changePriceOrDiscount')) && !(await mayDo(person, 'allocateDamageProceeds')) && !(await mayDo(person, 'correctPayment'))) forbidden();
  return person;
}
