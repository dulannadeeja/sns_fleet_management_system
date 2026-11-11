import { addCar } from '../../src/modules/cars/cars';
import { addCustomer } from '../../src/modules/customers/customers';
import { createRental } from '../../src/modules/rentals/rentals';
import { samplePlate } from './cars';
import { sampleCustomer } from './customers';
import { theOwner, samplePerson } from './people';
import { samplePickup } from './rentals';

/** A sample 3-day rental on a sample car: SNS-owned, or a partner car (package LKR 4,500 a day, 15% to SNS), as on
 *  boards 05.7 and 10.4. Plus a sample staff member who asks and a sample admin who decides. Not real data. */
export async function sampleRentalFor(ownership: 'sns' | 'partner', days = 3) {
  const owner = await theOwner();
  const car = await addCar(owner, { registration: samplePlate(), model: 'Wagon R', ownership }, ownership === 'partner' ? { dailyRate: 4500, commissionPercent: 15 } : { dailyRate: 4500 });
  if (!('ok' in car)) throw new Error(`car: ${JSON.stringify(car)}`);
  const c = await addCustomer(owner, sampleCustomer());
  if (!('ok' in c)) throw new Error(`customer: ${JSON.stringify(c)}`);
  const r = await createRental(owner, { customerId: c.id, vehicleId: car.id, pickupAt: samplePickup(), days });
  if (!('ok' in r)) throw new Error(`rental: ${JSON.stringify(r)}`);
  const staff = (await samplePerson()).id;
  const admin = (await samplePerson('first-pass-1', 'admin')).id;
  return { owner, staff, admin, rentalId: r.id, carId: car.id, customerId: c.id };
}
