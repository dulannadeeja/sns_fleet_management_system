import { changeGroup, readSettings, asText } from '../../src/modules/settings/settings';
import { theOwner } from './people';

const BUSINESS = ['businessName', 'businessRegistration', 'businessAddress', 'businessPhones'] as const;

/** Printing needs SNS's business details. When the test database has none, sample ones are set and left in place
 *  (like approved agreement wording, they stay); filled-in details are never changed. Not real data. */
export async function ensureBusinessDetails(): Promise<void> {
  const s = await readSettings();
  if (s.businessName && s.businessAddress && s.businessPhones) return;
  const was = Object.fromEntries(BUSINESS.map((k) => [k, asText(s[k])]));
  const set = { businessName: 'Sample Rent a Car', businessRegistration: 'Sample 1/2/3', businessAddress: 'Sample road, Elpitiya', businessPhones: '0770000000' };
  const r = await changeGroup(await theOwner(), 'business', set, was);
  if ('error' in r && r.error !== 'stale') throw new Error(JSON.stringify(r));
}
