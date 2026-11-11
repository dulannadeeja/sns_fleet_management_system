import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { receiveCar } from '../../src/modules/rentals/returns';
import { goAhead, goAheadsOf, warningsFor } from '../../src/modules/customers/flags';
import { createRental } from '../../src/modules/rentals/rentals';
import { recordPayment } from '../../src/modules/money/payments';
import { setPermission } from '../../src/modules/people/people';
import { addCar } from '../../src/modules/cars/cars';
import { samplePerson } from '../helpers/people';
import { samplePlate } from '../helpers/cars';
import { samplePickup } from '../helpers/rentals';
import { outRental } from '../helpers/handover';

// AT-55: "A customer with an unpaid bill and no flag starts a new rental: a debt warning shows; staff continue only with a
// reason, which is recorded" (system design 6, 7.4; #77; the owner's daily summary is Phase 4). The debt is the part of
// returned rentals' bills not covered by payments and the deposit held.
describe('AT-55: an unpaid bill warns before the next rental', { timeout: 60_000 }, () => {
  it('shows the debt; a new rental needs a decision for exactly that amount; paying it off ends the warning', async () => {
    const r = await outRental({ days: 1 });
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1150, fuel: 'full', accessories: r.accessories, checked: true, nextState: 'available', payLaterNote: 'Sample: pays Friday' })).toEqual({ ok: true });
    const w = (await warningsFor(r.customerId))!;
    expect(w.openFlags).toEqual([]);
    expect(w.debt).toMatchObject({ total: 5750, rentals: [{ rentalId: r.rentalId, unpaid: 5750 }] });
    const car = await addCar(r.owner, { registration: samplePlate(), model: 'Wagon R', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(JSON.stringify(car));
    const rent = () => createRental(r.owner, { customerId: r.customerId, vehicleId: car.id, pickupAt: samplePickup(), days: 1 });
    expect(await rent()).toEqual({ error: 'warningsNotCleared' });
    // A decision needs the reason, the amount shown, and "Proceed despite a customer flag".
    const staff = (await samplePerson()).id;
    expect(await setPermission(r.owner, staff, 'proceedDespiteFlag', false)).toMatchObject({ ok: true });
    const shown = { shownFlagIds: [], shownLicenceExpired: false, shownDebt: 5750 };
    expect(await goAhead(staff, r.customerId, { reason: 'Sample', ...shown })).toEqual({ error: 'notAllowed' });
    expect(await goAhead(r.owner, r.customerId, { reason: 'Sample', ...shown, shownDebt: 5000 })).toEqual({ error: 'stale' });
    expect(await goAhead(r.owner, r.customerId, { reason: ' ', ...shown })).toEqual({ error: 'reasonMissing' });
    // Staff with the default permissions may continue ("Proceed despite a customer flag" starts with staff and admin).
    const other = (await samplePerson()).id;
    const g = await goAhead(other, r.customerId, { reason: 'Sample: pays on Friday, regular', ...shown });
    if (!('ok' in g)) throw new Error(JSON.stringify(g));
    // The decision is recorded with its reason and the debt it covers.
    expect((await goAheadsOf(r.customerId)).find((d) => d.id === g.id)).toMatchObject({ reason: 'Sample: pays on Friday, regular', debt: 5750 });
    // Paying part of it changes the debt: the decision no longer covers it.
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 750 }], parts: [{ method: 'cash', amount: 750 }] })).toMatchObject({ ok: true });
    expect(await createRental(r.owner, { customerId: r.customerId, vehicleId: car.id, pickupAt: samplePickup(), days: 1, goAheadId: g.id })).toEqual({ error: 'warningsNotCleared' });
    const g2 = await goAhead(r.owner, r.customerId, { reason: 'Sample: paid part', ...shown, shownDebt: 5000 });
    if (!('ok' in g2)) throw new Error(JSON.stringify(g2));
    expect(await createRental(r.owner, { customerId: r.customerId, vehicleId: car.id, pickupAt: samplePickup(), days: 1, goAheadId: g2.id })).toMatchObject({ ok: true });
    // Paid in full: no debt, no warning.
    expect(await recordPayment(r.owner, { key: randomUUID(), customerId: r.customerId, for: 'bill', rentals: [{ rentalId: r.rentalId, amount: 5000 }], parts: [{ method: 'cash', amount: 5000 }] })).toMatchObject({ ok: true });
    expect((await warningsFor(r.customerId))!.debt.total).toBe(0);
  });
});
