import { describe, it, expect } from 'vitest';
import { addCar } from '../../src/modules/cars/cars';
import { changePapers } from '../../src/modules/cars/papers';
import { readChecklist } from '../../src/modules/golive/golive';
import { theOwner } from '../helpers/people';
import { samplePlate } from '../helpers/cars';

// AT-43: "One car still has no insurance date on go-live day: go-live is blocked until it is entered." System design,
// starting data (Confirmed). Going live itself is Phase 4; here the checklist that holds it back. The test database is
// shared, so the test follows its own sample car rather than expecting the whole list to be ready.
describe('AT-43: a car with no insurance date keeps go-live blocked until the date is entered', () => {
  it('names the car, blocks go-live; once its dates are entered it is no longer named', async () => {
    const owner = await theOwner();
    const plate = samplePlate();
    const car = await addCar(owner, { registration: plate, model: 'Alto', ownership: 'sns' });
    if (!('ok' in car)) throw new Error(car.error);

    let list = await readChecklist();
    let dates = list.items.find((i) => i.key === 'carDates')!;
    expect(dates.done).toBe(false);
    expect(dates.facts.noInsurance).toContain(plate);
    expect(list.blocked).toBe(true);
    expect(list.blockers).toContain('carDates');

    const empty = { insuranceExpires: null, licenceExpires: null, nextServiceOn: null, nextServiceKm: null };
    expect(await changePapers(owner, car.id, { ...empty, insuranceExpires: '2027-03-31' }, empty)).toMatchObject({ ok: true });
    dates = (await readChecklist()).items.find((i) => i.key === 'carDates')!;
    expect(dates.facts.noInsurance).not.toContain(plate);
    expect(dates.facts.noLicence).toContain(plate); // the licence date is still needed
    const was = { ...empty, insuranceExpires: '2027-03-31' };
    expect(await changePapers(owner, car.id, { ...was, licenceExpires: '2027-01-15' }, was)).toMatchObject({ ok: true });
    list = await readChecklist();
    dates = list.items.find((i) => i.key === 'carDates')!;
    expect(dates.facts.noInsurance).not.toContain(plate);
    expect(dates.facts.noLicence).not.toContain(plate);
  });
});
