import { describe, it, expect, beforeAll } from 'vitest';
import { createRental } from '../../src/modules/rentals/rentals';
import { setRentalTerms } from '../../src/modules/rentals/terms';
import { addWording, agreementState, approveWording, currentWording, printAgreement, uploadSigned } from '../../src/modules/rentals/agreements';
import { ensureBusinessDetails } from '../helpers/business';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';
import { JPEG, NOT_A_PHOTO } from '../helpers/customers';

// AT-06 (PARTIAL: the handover block itself comes with #57): "Missing signed agreement or customer ID/licence copy:
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
    expect(await setRentalTerms(owner, id, { ...terms, deposit: 12_000 })).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ outOfDate: true });
    expect(await uploadSigned(owner, id, JPEG)).toEqual({ ok: true });
    expect(await agreementState(id)).toMatchObject({ outOfDate: false });
  });
});
