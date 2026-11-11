import { changeGroup, readSettings, asText, linesOf } from '../../src/modules/settings/settings';
import { changePapers } from '../../src/modules/cars/papers';
import { addCar } from '../../src/modules/cars/cars';
import { handOver } from '../../src/modules/rentals/handover';
import { samplePlate } from './cars';
import { addCopy } from '../../src/modules/customers/customers';
import { createRental } from '../../src/modules/rentals/rentals';
import { setRentalTerms } from '../../src/modules/rentals/terms';
import { addWording, approveWording, currentWording, printAgreement, uploadSigned } from '../../src/modules/rentals/agreements';
import { ensureBusinessDetails } from './business';
import { theOwner } from './people';
import { sampleCarAndCustomer, samplePickup } from './rentals';
import { JPEG } from './customers';

/** Handover needs the owner's accessories list. When the test database has none, a sample list is set and left in
 *  place (like the business details); a list already there is never changed. Not real data. */
export async function ensureAccessories(): Promise<string[]> {
  const s = await readSettings();
  if (linesOf(s.accessories).length) return linesOf(s.accessories);
  const r = await changeGroup(await theOwner(), 'handover', { accessories: 'Sample spare wheel\nSample jack\nSample air pump' }, { accessories: asText(s.accessories) });
  if ('error' in r && r.error !== 'stale') throw new Error(JSON.stringify(r));
  return linesOf((await readSettings()).accessories);
}

const future = () => `${new Date().getFullYear() + 1}-12-31`;

/** A sample car (papers in date unless `papers: false`) and customer with all four copies (or `customerId`, one that has them), a rental with step 4 saved,
 *  printed and signed: everything handover needs. Not real data. */
export async function readyRental(opts: { carId?: string; customerId?: string; days?: number; papers?: boolean; copies?: boolean; signed?: boolean; terms?: Partial<Parameters<typeof setRentalTerms>[2]> } = {}) {
  const owner = await theOwner();
  await ensureBusinessDetails();
  await ensureAccessories();
  if (!(await currentWording())) {
    const w = await addWording(owner, { textSi: 'Sample', textEn: 'Sample' });
    if ('ok' in w) await approveWording(owner, w.id);
  }
  const sample = await sampleCarAndCustomer(owner);
  const carId = opts.carId ?? sample.carId;
  const customerId = opts.customerId ?? sample.customerId;
  if (opts.papers !== false) {
    const p = await changePapers(owner, carId, { insuranceExpires: future(), licenceExpires: future(), nextServiceOn: null, nextServiceKm: null },
      { insuranceExpires: null, licenceExpires: null, nextServiceOn: null, nextServiceKm: null });
    if (!('ok' in p)) throw new Error(`papers: ${JSON.stringify(p)}`);
  }
  if (opts.copies !== false && !opts.customerId) for (const kind of ['nicFront', 'nicBack', 'licenceFront', 'licenceBack']) {
    const c = await addCopy(owner, customerId, kind, JPEG);
    if (!('ok' in c)) throw new Error(`copy: ${JSON.stringify(c)}`);
  }
  const r = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: opts.days ?? 2 });
  if (!('ok' in r)) throw new Error(`rental: ${JSON.stringify(r)}`);
  const t = await setRentalTerms(owner, r.id, { deposit: 10_000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false, ...opts.terms });
  if (!('ok' in t)) throw new Error(`terms: ${JSON.stringify(t)}`);
  if (opts.signed !== false) {
    const p = await printAgreement(owner, r.id, 'en');
    if (!('ok' in p)) throw new Error(`print: ${JSON.stringify(p)}`);
    const s = await uploadSigned(owner, r.id, JPEG);
    if (!('ok' in s)) throw new Error(`signed: ${JSON.stringify(s)}`);
  }
  return { rentalId: r.id, carId, customerId, owner };
}

/** A sample car (SNS-owned or a partner car at 15% to SNS), Wagon R terms of the starting package (4,500 a day, 100 km a
 *  day, 25 a km, garage day 5,000), handed over at 1,000 km with a full tank and every accessory: out, ready to come
 *  back. Not real data. */
export async function outRental(opts: { ownership?: 'sns' | 'partner'; customerId?: string; days?: number; fuel?: 'notCounted' | 'sameLevel'; deposit?: number | null } = {}) {
  const owner = await theOwner();
  const ownership = opts.ownership ?? 'partner';
  const car = await addCar(owner, { registration: samplePlate(), model: 'Wagon R', ownership },
    { dailyRate: 4500, kmPerDay: 100, extraKmRate: 25, garageDayCharge: 5000, ...(ownership === 'partner' ? { commissionPercent: 15 } : {}) });
  if (!('ok' in car)) throw new Error(`car: ${JSON.stringify(car)}`);
  if (opts.fuel === 'sameLevel') await ensureFuelPrice();
  const r = await readyRental({ carId: car.id, customerId: opts.customerId, days: opts.days, terms: { fuel: opts.fuel ?? 'notCounted', ...(opts.deposit === null ? { deposit: null, waiveReason: 'Sample' } : opts.deposit ? { deposit: opts.deposit } : {}) } });
  const accessories = (await ensureAccessories()).map((item) => ({ item, present: true }));
  const h = await handOver(owner, r.rentalId, { outKm: 1000, fuel: 'full', accessories, checked: true });
  if (!('ok' in h)) throw new Error(`handover: ${JSON.stringify(h)}`);
  return { ...r, carId: car.id, accessories };
}

/** A "same level" rental needs the owner's fuel price. When none is set, a sample price (LKR 300 a litre, as on board
 *  07.1) is set and left in place. Not real data. */
export async function ensureFuelPrice(): Promise<number> {
  const s = await readSettings();
  if (s.fuelPricePerLitre) return s.fuelPricePerLitre;
  const r = await changeGroup(await theOwner(), 'fuel', { fuelPricePerLitre: '300' }, { fuelPricePerLitre: '' });
  if ('error' in r && r.error !== 'stale') throw new Error(JSON.stringify(r));
  return (await readSettings()).fuelPricePerLitre!;
}
