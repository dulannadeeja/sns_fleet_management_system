import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { createRental } from '../src/modules/rentals/rentals';
import { rentalReadiness, setRentalTerms } from '../src/modules/rentals/terms';
import { addReference, addReferenceCopy, getReference, openReferenceCopy } from '../src/modules/customers/references';
import { setPermission } from '../src/modules/people/people';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';
import { JPEG, sampleNic } from './helpers/customers';

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
    // The check of ST-05.4: the reason with who and when (the owner's daily summary reads it in Phase 4).
    const ev = await pool.query("select created_by, created_at from audit_event where target_id = $1 and action = 'rental.terms' order by created_at desc limit 1", [rentalId]);
    expect(ev.rows[0].created_by).toBe(owner);
    expect(Date.now() - new Date(ev.rows[0].created_at).getTime()).toBeLessThan(60_000);
  });

  it('the deposit needs "Set or waive a deposit"; the other choices need Customer access only (8 Nov 2026); bad choices are refused', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const { rentalId } = await sampleRental(owner);
    expect(await setPermission(owner, staff, 'setOrWaiveDeposit', false)).toMatchObject({ ok: true });
    expect(await setRentalTerms(staff, rentalId, { ...base, deposit: 5000 })).toEqual({ error: 'depositNotAllowed' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000 })).toEqual({ ok: true });
    // Keeping the saved deposit, staff without the permission change the rest; changing the deposit is refused.
    expect(await setRentalTerms(staff, rentalId, { ...base, deposit: 5000, rentPaid: 'now' })).toEqual({ ok: true });
    expect(await setRentalTerms(staff, rentalId, { ...base, deposit: 6000 })).toEqual({ error: 'depositNotAllowed' });
    expect(await setRentalTerms(staff, rentalId, { ...base, deposit: null, waiveReason: 'Sample: no' })).toEqual({ error: 'depositNotAllowed' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, rentPaid: 'later' as never })).toEqual({ error: 'rentPaidInvalid' });
    expect(await setRentalTerms(owner, rentalId, { ...base, deposit: 5000, fuel: 'full' as never })).toEqual({ error: 'fuelInvalid' });
    expect(await setRentalTerms(owner, 'nope', { ...base, deposit: 5000 })).toEqual({ error: 'notFound' });
    // The database refuses an amount outside the range too.
    await expect(pool.query('update rental set deposit_amount = 600000 where id = $1', [rentalId])).rejects.toThrow(/rental_deposit/);
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

describe('the fuel option (Derived control: same level needs the owner\'s fuel price)', () => {
  it('refuses "same level" when the rental has no fuel price, and allows it when it has one', async () => {
    const owner = await theOwner();
    const { rentalId } = await sampleRental(owner);
    // Two sample rentals saved straight into the database, one without and one with a saved fuel price.
    const make = async (price: number | null) => {
      const { customerId } = await sampleCarAndCustomer(owner);
      const id = (await pool.query("insert into rental (customer_id, pickup_at, days, deadline_at, created_by) values ($1, now(), 1, now() + interval '1 day', $2) returning id", [customerId, owner])).rows[0].id;
      await pool.query("insert into rental_terms_snapshot (rental_id, pickup_cutoff, return_deadline, fuel_price_per_litre) values ($1, '15:00', '08:00', $2)", [id, price]);
      return id as string;
    };
    expect(await setRentalTerms(owner, await make(null), { ...base, deposit: 5000, fuel: 'sameLevel' })).toEqual({ error: 'fuelPriceNotSet' });
    expect(await setRentalTerms(owner, await make(370), { ...base, deposit: 5000, fuel: 'sameLevel' })).toEqual({ ok: true });
    expect(rentalId).toBeTruthy();
  });
});

describe('a reference person\'s copies open only through the app, each opening logged', () => {
  it('opens for the right customer and reference; any other id is not found; the opening is in the activity log', async () => {
    const owner = await theOwner();
    const { customerId } = await sampleRental(owner);
    const ref = await addReference(owner, customerId, { name: 'Sample Reference', nic: sampleNic(), phone: '0712345678' }, [{ kind: 'licence', bytes: JPEG }]);
    if (!('ok' in ref)) throw new Error(JSON.stringify(ref));
    const doc = (await getReference(ref.id))!.documents[0];
    const opened = await openReferenceCopy(owner, doc.id, ref.id);
    expect(opened).toMatchObject({ ok: true, contentType: 'image/jpeg' });
    const other = await addReference(owner, customerId, { name: 'Other', nic: sampleNic(), phone: '0712345678' });
    if (!('ok' in other)) throw new Error(JSON.stringify(other));
    expect(await openReferenceCopy(owner, doc.id, other.id)).toEqual({ error: 'notFound' });
    const log = await pool.query("select details from audit_event where target_id = $1 and action = 'customer.referenceCopyOpened'", [customerId]);
    expect(log.rows).toHaveLength(1);
    expect(log.rows[0].details).toMatchObject({ kind: 'licence', reference: 'Sample Reference' });
    // A NIC already saved: the person is found again, and a copy can still be added to them.
    expect(await addReferenceCopy(owner, ref.id, 'nicFront', JPEG)).toEqual({ ok: true });
    expect((await getReference(ref.id))!.copiesMissing).toEqual(['nicBack']);
  });
});
