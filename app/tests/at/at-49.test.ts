import { describe, it, expect } from 'vitest';
import { addCopy, addCustomer, getCustomer } from '../../src/modules/customers/customers';
import { theOwner } from '../helpers/people';
import { JPEG, sampleCustomer } from '../helpers/customers';

// AT-49 (PARTIAL: "handover blocked until it is added" is checked at handover, Phase 2): "Staff save a new customer without
// the licence copy: saved, shows copies missing" (system design 6, Confirmed).
describe('AT-49 (partial): a customer saved without the licence copy shows copies missing', () => {
  it('saves, shows copies missing, and stops showing it once every copy is in', async () => {
    const owner = await theOwner();
    const added = await addCustomer(owner, sampleCustomer(), [{ kind: 'nicFront', bytes: JPEG }, { kind: 'nicBack', bytes: JPEG }]);
    if (!('ok' in added)) throw new Error(JSON.stringify(added));
    let c = (await getCustomer(added.id))!;
    expect(c.copiesMissing).toEqual(['licenceFront', 'licenceBack']);
    expect(await addCopy(owner, added.id, 'licenceFront', JPEG)).toMatchObject({ ok: true });
    expect(await addCopy(owner, added.id, 'licenceBack', JPEG)).toMatchObject({ ok: true });
    c = (await getCustomer(added.id))!;
    expect(c.copiesMissing).toEqual([]);
  });
});
