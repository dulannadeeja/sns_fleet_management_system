import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { createRental } from '../src/modules/rentals/rentals';
import { setRentalTerms } from '../src/modules/rentals/terms';
import { addWording, approveWording, currentWording, getPrint, printAgreement } from '../src/modules/rentals/agreements';
import { ensureBusinessDetails } from './helpers/business';
import { readSettings } from '../src/modules/settings/settings';
import { setPermission } from '../src/modules/people/people';
import { agreementState, openSigned, uploadSigned } from '../src/modules/rentals/agreements';
import { JPEG } from './helpers/customers';
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
      includedKm: 200, extraKmRate: 25, deposit: 10_000, rentPaid: 'return' });
    const st = await readSettings();
    expect(c.business).toEqual({ name: st.businessName, registration: st.businessRegistration, address: st.businessAddress, phones: st.businessPhones });
    expect(c.number).toMatch(/^R-\d{4,}$/);
    const si = await printAgreement(owner, id, 'si');
    if (!('ok' in si)) throw new Error(JSON.stringify(si));
    expect((await getPrint(id, si.id))!.conditions).toBe(`Sample කොන්දේසි ${tag}`);
    await expect(pool.query('update agreement_print set language = $2 where id = $1', [p.id, 'si'])).rejects.toThrow(/insert-only/);
    expect(await getPrint(id, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});

describe('#55 review: older drafts, ids, permissions and the log', () => {
  it('a draft older than the version printed now cannot be approved', async () => {
    const owner = await theOwner();
    const older = await addWording(owner, { textSi: 'Sample old', textEn: 'Sample old' });
    const newer = await addWording(owner, { textSi: 'Sample new', textEn: 'Sample new' });
    if (!('ok' in older) || !('ok' in newer)) throw new Error('wording');
    expect(await approveWording(owner, newer.id)).toEqual({ ok: true });
    expect(await approveWording(owner, older.id)).toEqual({ error: 'olderThanCurrent' });
  });

  it('a printout or signed copy opens only with its own rental; Customer access is needed; opening is logged', async () => {
    const owner = await theOwner();
    if (!(await currentWording())) { const w = await addWording(owner, { textSi: 'Sample', textEn: 'Sample' }); if ('ok' in w) await approveWording(owner, w.id); }
    const a = await readyRental(owner);
    const b = await readyRental(owner);
    expect(await setRentalTerms(owner, a, terms)).toEqual({ ok: true });
    const p = await printAgreement(owner, a, 'en');
    if (!('ok' in p)) throw new Error(JSON.stringify(p));
    expect(await getPrint(b, p.id)).toBeNull();
    expect(await uploadSigned(owner, a, JPEG)).toEqual({ ok: true });
    const signedId = (await agreementState(a))!.signedId!;
    expect(await openSigned(owner, b, signedId)).toEqual({ error: 'notFound' });
    const staff = (await samplePerson()).id;
    expect(await setPermission(owner, staff, 'customerAccess', false)).toMatchObject({ ok: true });
    expect(await printAgreement(staff, a, 'en')).toEqual({ error: 'notAllowed' });
    expect(await uploadSigned(staff, a, JPEG)).toEqual({ error: 'notAllowed' });
    expect(await openSigned(staff, a, signedId)).toEqual({ error: 'notAllowed' });
    expect(await openSigned(owner, a, signedId)).toMatchObject({ ok: true, contentType: 'image/jpeg' });
    const log = await pool.query("select action from audit_event where target_id = $1 and action like 'rental.agreement%' order by created_at", [a]);
    expect(log.rows.map((x) => x.action)).toEqual(['rental.agreementPrint', 'rental.agreementSigned', 'rental.agreementOpened']);
    await expect(pool.query('delete from agreement_signed where rental_id = $1', [a])).rejects.toThrow(/insert-only/);
  });
});
