import { describe, it, expect } from 'vitest';
import { handOver } from '../../src/modules/rentals/handover';
import { ensureAccessories, readyRental } from '../helpers/handover';
import { addReference as addRef } from '../../src/modules/customers/references';
import { setRentalTerms as setTerms } from '../../src/modules/rentals/terms';
import { createRental } from '../../src/modules/rentals/rentals';
import { rentalReadiness, setRentalTerms } from '../../src/modules/rentals/terms';
import { addReference, addReferenceCopy } from '../../src/modules/customers/references';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';
import { JPEG, sampleNic } from '../helpers/customers';

// AT-07 (the handover block since #57): "Reference person required but their licence copy
// missing: handover blocked" (system design 6, Confirmed). Here: the rental shows the missing copy until it is in.
describe('AT-07 (partial): a required reference person without their licence copy', () => {
  it('shows the licence copy missing until it is added', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const r = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 1 });
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    const ref = await addReference(owner, customerId, { name: 'Sample Reference', nic: sampleNic(), phone: '0712345678' },
      [{ kind: 'nicFront', bytes: JPEG }, { kind: 'nicBack', bytes: JPEG }]);
    if (!('ok' in ref)) throw new Error(JSON.stringify(ref));
    expect(await setRentalTerms(owner, r.id, { deposit: 5000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: true, referencePersonId: ref.id })).toEqual({ ok: true });
    expect((await rentalReadiness(r.id))!.referenceCopiesMissing).toEqual(['licence']);
    expect(await addReferenceCopy(owner, ref.id, 'licence', JPEG)).toEqual({ ok: true });
    expect((await rentalReadiness(r.id))!.referenceCopiesMissing).toEqual([]);
  });
});

const ticks = async (missing: string[] = []) => (await ensureAccessories()).map((item) => ({ item, present: !missing.includes(item) }));

describe('AT-07: handover is blocked while a required reference person\'s copy is missing (#57)', { timeout: 30_000 }, () => {
  it('blocks without the licence copy; goes ahead once it is added', async () => {
    const { rentalId, customerId, owner } = await readyRental();
    const ref = await addRef(owner, customerId, { name: 'Sample Reference', nic: sampleNic(), phone: '0771234567' }, [{ kind: 'nicFront', bytes: JPEG }, { kind: 'nicBack', bytes: JPEG }]);
    if (!('ok' in ref)) throw new Error(JSON.stringify(ref));
    expect(await setTerms(owner, rentalId, { deposit: 10_000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: true, referencePersonId: ref.id })).toEqual({ ok: true });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'blocked', missing: ['referenceCopies'] });
    expect(await addReferenceCopy(owner, ref.id, 'licence', JPEG)).toEqual({ ok: true });
    expect(await handOver(owner, rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ ok: true });
  });
});
