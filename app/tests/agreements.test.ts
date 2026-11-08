import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { createRental } from '../src/modules/rentals/rentals';
import { setRentalTerms } from '../src/modules/rentals/terms';
import { addWording, approveWording, currentWording, getPrint, printAgreement } from '../src/modules/rentals/agreements';
import { ensureBusinessDetails } from './helpers/business';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';

// ST-05.6, ST-16.1 (system design 14, Confirmed 8 Nov 2026; #55). Wording versions and business details are shared by
// the whole test database: this file adds sample wording and, when none are set, sample business details; both stay.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
beforeAll(ensureBusinessDetails);
afterAll(() => pool.end());

async function readyRental(actor: string) {
  const owner = await theOwner();
  const { carId, customerId } = await sampleCarAndCustomer(owner);
  const r = await createRental(actor, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 });
  if (!('ok' in r)) throw new Error(JSON.stringify(r));
  return r.id;
}
const terms = { deposit: 10_000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false } as const;

describe('agreement wording: only the owner adds and approves; an approved version never changes', () => {
  it('a new version is not used until approved; staff may not add one', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    expect(await addWording(staff, { textSi: 'Sample', textEn: 'Sample' })).toEqual({ error: 'notAllowed' });
    expect(await addWording(owner, { textSi: '', textEn: 'Sample' })).toEqual({ error: 'textMissing' });
    const tag = Math.random().toString(36).slice(2, 8);
    const w = await addWording(owner, { textSi: `Sample කොන්දේසි ${tag}`, textEn: `Sample conditions ${tag}` });
    if (!('ok' in w)) throw new Error(JSON.stringify(w));
    expect((await currentWording())?.id).not.toBe(w.id);
    expect(await approveWording(staff, w.id)).toEqual({ error: 'notAllowed' });
    expect(await approveWording(owner, w.id)).toEqual({ ok: true });
    expect(await approveWording(owner, w.id)).toEqual({ error: 'alreadyApproved' });
    expect((await currentWording())).toMatchObject({ id: w.id, textEn: `Sample conditions ${tag}` });
    await expect(pool.query('update agreement_wording set text_en = $2 where id = $1', [w.id, 'changed'])).rejects.toThrow(/insert-only/);
    await expect(pool.query('delete from agreement_wording where id = $1', [w.id])).rejects.toThrow(/insert-only/);
  });
});

describe('printing the agreement (ST-05.6, ST-16.1)', () => {
  it('needs step 4; prints the rental, its terms, the business details and the approved wording, kept as printed', async () => {
    const owner = await theOwner();
    const tag = Math.random().toString(36).slice(2, 8);
    const w = await addWording(owner, { textSi: `Sample කොන්දේසි ${tag}`, textEn: `Sample conditions ${tag}` });
    if (!('ok' in w)) throw new Error(JSON.stringify(w));
    expect(await approveWording(owner, w.id)).toEqual({ ok: true });
    const id = await readyRental(owner);
    expect(await printAgreement(owner, id, 'en')).toEqual({ error: 'termsNotSet' });
    expect(await setRentalTerms(owner, id, terms)).toEqual({ ok: true });
    expect(await printAgreement(owner, id, 'fr')).toEqual({ error: 'languageInvalid' });
    const p = await printAgreement(owner, id, 'en');
    if (!('ok' in p)) throw new Error(JSON.stringify(p));
    const c = (await getPrint(id, p.id))!;
    expect(c).toMatchObject({ language: 'en', wordingVersion: w.version, conditions: `Sample conditions ${tag}`, days: 2, dailyRate: 4500, base: 9000,
      includedKm: 200, extraKmRate: 25, deposit: 10_000, rentPaid: 'return', business: { name: 'Sample Rent a Car', phones: '0770000000' } });
    expect(c.number).toMatch(/^R-\d{4,}$/);
    const si = await printAgreement(owner, id, 'si');
    if (!('ok' in si)) throw new Error(JSON.stringify(si));
    expect((await getPrint(id, si.id))!.conditions).toBe(`Sample කොන්දේසි ${tag}`);
    await expect(pool.query('update agreement_print set language = $2 where id = $1', [p.id, 'si'])).rejects.toThrow(/insert-only/);
    expect(await getPrint(id, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
