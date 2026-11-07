import { addCar } from '../../src/modules/cars/cars';
import { addCustomer } from '../../src/modules/customers/customers';
import { samplePlate } from './cars';
import { sampleCustomer } from './customers';

/** A sample Wagon R (SNS-owned) and a sample customer, added by the given person. Not real data. */
export async function sampleCarAndCustomer(actorId: string) {
  const car = await addCar(actorId, { registration: samplePlate(), model: 'Wagon R', ownership: 'sns' });
  if (!('ok' in car)) throw new Error(`sample car: ${JSON.stringify(car)}`);
  const c = await addCustomer(actorId, sampleCustomer());
  if (!('ok' in c)) throw new Error(`sample customer: ${JSON.stringify(c)}`);
  return { carId: car.id, customerId: c.id };
}

/** A pickup time far in the future, different for each call, so sample rentals never meet another test's. */
let n = 0;
export const samplePickup = () => new Date(Date.UTC(2090 + Math.floor(Math.random() * 9), 0, 1) + (n++ * 7 + Math.floor(Math.random() * 300) * 10) * 86_400_000);
