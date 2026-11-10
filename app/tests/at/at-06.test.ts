import { describe, it, expect, beforeAll } from 'vitest';
import { handOver, handoverChecklist } from '../../src/modules/rentals/handover';
import { ensureAccessories, readyRental as readyForHandover } from '../helpers/handover';
import { createRental } from '../../src/modules/rentals/rentals';
import { addCopy } from '../../src/modules/customers/customers';
import { setRentalTerms } from '../../src/modules/rentals/terms';
import { addWording, agreementState, approveWording, currentWording, printAgreement, uploadSigned } from '../../src/modules/rentals/agreements';
import { ensureBusinessDetails } from '../helpers/business';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';
import { JPEG, NOT_A_PHOTO } from '../helpers/customers';

// AT-06 (the handover block since #57): "Missing signed agreement or customer ID/licence copy:
// handover blocked" (system design 6, 14; Confirmed 8 Nov 2026). Here: the signed copy, uploaded after printing, and
// out of date after a change of terms. Sample business details are set when none are (tests/helpers/business.ts).
beforeAll(ensureBusinessDetails);

async function readyRental(actor: string) {
  const { carId, customerId } = await sampleCarAndCustomer(await theOwner());
  const r = await createRental(actor, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 });
  if (!('ok' in r)) throw new Error(JSON.stringify(r));
  return r.id;
}
const terms = { deposit: 10_000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false } as const;

describe('AT-06 (partial: the handover block is #57): the signed agreement', () => {
  it('is uploaded after printing; a later change of terms makes it out of date until signed again', async () => {
    const owner = await theOwner();
    const id = await readyRental(owner);
    expect(await setRentalTerms(owner, id, terms)).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ printed: false, signedId: null });
    expect(await uploadSigned(owner, id, JPEG)).toEqual({ error: 'notPrinted' });
    if (!(await currentWording())) {
      const w = await addWording(owner, { textSi: 'Sample', textEn: 'Sample' });
      if ('ok' in w) await approveWording(owner, w.id);
    }
    expect(await printAgreement(owner, id, 'si')).toMatchObject({ ok: true });
    expect(await uploadSigned(owner, id, NOT_A_PHOTO)).toEqual({ error: 'fileType' });
    expect(await uploadSigned(owner, id, JPEG)).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ printed: true, outOfDate: false });
    // Choosing a reference person does not change the printout: the signed copy stays current.
    expect(await setRentalTerms(owner, id, { ...terms, referenceRequired: true })).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ outOfDate: false });
    // A change of what is printed makes it out of date; the old scan cannot be uploaded again without a new printout.
    expect(await setRentalTerms(owner, id, { ...terms, deposit: 12_000 })).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ outOfDate: true, printCurrent: false });
    expect(await uploadSigned(owner, id, JPEG)).toEqual({ error: 'reprintFirst' });
    expect(await printAgreement(owner, id, 'si')).toMatchObject({ ok: true });
    expect(await agreementState(id)).toMatchObject({ outOfDate: true, printCurrent: true });
    expect(await uploadSigned(owner, id, JPEG)).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ outOfDate: false });
  });
});

const ticks = async (missing: string[] = []) => (await ensureAccessories()).map((item) => ({ item, present: !missing.includes(item) }));

describe('AT-06: handover is blocked without the signed agreement or the customer\'s copies (#57)', { timeout: 30_000 }, () => {
  it('blocks a missing or out-of-date signed agreement, and missing ID or licence copies', async () => {
    const unsigned = await readyForHandover({ signed: false });
    expect(await handOver(unsigned.owner, unsigned.rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'blocked', missing: ['signedAgreement'] });
    const noCopies = await readyForHandover({ copies: false });
    expect(await handOver(noCopies.owner, noCopies.rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'blocked', missing: ['customerCopies'] });
    // Only the licence copy missing (front and back present for the NIC): still blocked.
    const licenceOnly = await readyForHandover({ copies: false });
    for (const kind of ['nicFront', 'nicBack', 'licenceFront']) expect(await addCopy(licenceOnly.owner, licenceOnly.customerId, kind, JPEG)).toMatchObject({ ok: true });
    expect((await handoverChecklist(licenceOnly.rentalId))!.customerCopiesMissing).toEqual(['licenceBack']);
    expect(await handOver(licenceOnly.owner, licenceOnly.rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toEqual({ error: 'blocked', missing: ['customerCopies'] });
    const changed = await readyForHandover();
    expect(await setRentalTerms(changed.owner, changed.rentalId, { ...terms, deposit: 12_000 })).toEqual({ ok: true });
    expect((await handoverChecklist(changed.rentalId))!.missing).toEqual(['agreementOutOfDate']);
    expect(await handOver(changed.owner, changed.rentalId, { outKm: 10, fuel: 'full', accessories: await ticks(), checked: true })).toMatchObject({ error: 'blocked' });
  });
});
