import { describe, it, expect } from 'vitest';
import { addCustomer, listCustomers } from '../../src/modules/customers/customers';
import { theOwner } from '../helpers/people';
import { sampleCustomer } from '../helpers/customers';

// AT-51 "Staff add a new customer with a NIC already recorded: no second record; the existing customer opens, with
// their debts and flags" (system design 6, Confirmed). Debts and flags fill in with their tickets (#24, Phase 2).
describe('AT-51: one NIC is one customer', () => {
  it('a NIC already recorded opens the existing customer; no second record', async () => {
    const owner = await theOwner();
    const c = sampleCustomer();
    const first = await addCustomer(owner, c);
    if (!('ok' in first)) throw new Error(JSON.stringify(first));
    // Typed with a space: still the same NIC; and the existing customer opens even from a half-filled form (#19 review).
    const nic = `${c.nic.slice(0, 4)} ${c.nic.slice(4)}`;
    expect(await addCustomer(owner, { ...sampleCustomer(), nic })).toEqual({ existing: first.id });
    expect(await addCustomer(owner, { name: '', nic: c.nic, phone: '', licenceNumber: '', licenceExpires: '' })).toEqual({ existing: first.id });
    // An old card number with a small v is the same as with a capital V.
    const old = `${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}V`;
    const oldCard = await addCustomer(owner, { ...sampleCustomer(), nic: old });
    if (!('ok' in oldCard)) throw new Error(JSON.stringify(oldCard));
    expect(await addCustomer(owner, { ...sampleCustomer(), nic: old.toLowerCase() })).toEqual({ existing: oldCard.id });
    expect((await listCustomers(c.nic)).filter((x) => x.nic === c.nic)).toHaveLength(1);
  });
});
