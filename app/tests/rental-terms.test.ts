import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { createRental } from '../src/modules/rentals/rentals';
import { rentalReadiness, setRentalTerms } from '../src/modules/rentals/terms';
import { addReference } from '../src/modules/customers/references';
import { setPermission } from '../src/modules/people/people';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';
import { sampleNic } from './helpers/customers';

// ST-05.4 and ST-05.5, step 4 of New rental (system design 8.1, 8.2, 6; Confirmed 8 Nov 2026). Each test adds its own
// sample car, customer and rental.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

async function sampleRental(actor: string) {
  const owner = await theOwner();
  const { carId, customerId } = await sampleCarAndCustomer(owner);
  const r = await createRental(actor, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 });
  if (!('ok' in r)) throw new Error(JSON.stringify(r));
  return { rentalId: r.id, customerId };
}
const base = { rentPaid: 'return', fuel: 'notCounted', referenceRequired: false } as const;

describe('ST-05.4: the deposit, when the rent is paid and the fuel option', () => {
  it('sets a deposit of LKR 1 to 500,000; refuses others; a waiver needs a reason; each change is recorded', async () => {
    const owner = await theOwner();
    const { rentalId } = await sampleRental(owner);
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 0 })).toEqual({ error: 'depositInvalid' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 500_001 })).toEqual({ error: 'depositInvalid' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: null, waiveReason: '  ' })).toEqual({ error: 'reasonMissing' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 10_000 })).toEqual({ ok: true });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: null, waiveReason: 'Sample: regular customer, known for years', rentPaid: 'now' })).toEqual({ ok: true });
    const r = await pool.query('select deposit_amount, deposit_waived_reason, rent_paid, fuel, reference_required from rental where id = $1', [rentalId]);
    expect(r.rows[0]).toMatchObject({ deposit_amount: null, deposit_waived_reason: 'Sample: regular customer, known for years', rent_paid: 'now', fuel: 'notCounted', reference_required: false });
    const log = await pool.query("select details from audit_event where target_id = $1 and action = 'rental.terms' order by created_at", [rentalId]);
    expect(log.rows).toHaveLength(2);
    expect(log.rows[1].details).toMatchObject({ waivedReason: 'Sample: regular customer, known for years' });
  });

  it('needs "Set or waive a deposit"; bad choices are refused', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const { rentalId } = await sampleRental(owner);
    expect(await setRentalTerms(staff, rentalId, { ...base, deposit: 5000 })).toEqual({ ok: true });
    expect(await setPermission(owner, staff, 'setOrWaiveDeposit', false)).toMatchObject({ ok: true });
    expect(await setRentalTerms(staff, rentalId, { ...base, deposit: 5000 })).toEqual({ error: 'notAllowed' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, rentPaid: 'later' as never })).toEqual({ error: 'rentPaidInvalid' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, fuel: 'full' as never })).toEqual({ error: 'fuelInvalid' });
    expect(await setRentalTerms(owner, 'nope', { ...base, deposit: 5000 })).toEqual({ error: 'notFound' });
  });
});

describe('ST-05.5: the reference person, kept with the customer', () => {
  it('one NIC is one reference person per customer; a rental picks one; copies may come later', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental(owner);
    const nic = sampleNic();
    const ref = await addReference(owner, customerId, { name: 'Sample Reference', nic, phone: '0712345678', relationship: 'friend' });
    if (!('ok' in ref)) throw new Error(JSON.stringify(ref));
    expect(await addReference(owner, customerId, { name: 'Other name', nic, phone: '0712345678' })).toEqual({ existing: ref.id });
    expect(await addReference(owner, customerId, { name: '', nic: sampleNic(), phone: '0712345678' })).toEqual({ error: 'nameMissing' });
    expect(await addReference(owner, customerId, { name: 'Sample', nic: '123', phone: '0712345678' })).toEqual({ error: 'nicInvalid' });

    // Another customer's reference cannot be picked.
    const other = await sampleRental(owner);
    expect(await setRentalTerms(owner, other.rentalId, { ...base, deposit: 5000, referenceRequired: true, referencePersonId: ref.id })).toEqual({ error: 'referenceNotFound' });

    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, referenceRequired: true, referencePersonId: ref.id })).toEqual({ ok: true });
    expect(await rentalReadiness(rentalId)).toMatchObject({ termsSet: true, referenceMissing: false, referenceCopiesMissing: ['nicFront', 'nicBack', 'licence'] });
  });

  it('a reference marked needed but not yet chosen shows as missing', async () => {
    const owner = await theOwner();
    const { rentalId } = await sampleRental(owner);
    expect(await rentalReadiness(rentalId)).toMatchObject({ termsSet: false });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, referenceRequired: true })).toEqual({ ok: true });
    expect(await rentalReadiness(rentalId)).toMatchObject({ termsSet: true, referenceMissing: true, referenceCopiesMissing: [] });
  });
});

describe('the fuel option', () => {
  it('"same level" needs the owner\'s fuel price saved with the rental', async () => {
    const owner = await theOwner();
    const { rentalId } = await sampleRental(owner);
    const price = (await pool.query('select fuel_price_per_litre from rental_terms_snapshot where rental_id = $1', [rentalId])).rows[0].fuel_price_per_litre;
    const result = await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, fuel: 'sameLevel' });
    expect(result).toEqual(price === null ? { error: 'fuelPriceNotSet' } : { ok: true });
  });
});
