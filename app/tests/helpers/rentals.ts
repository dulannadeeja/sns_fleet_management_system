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

/** A pickup time a little ahead of now (a pickup is now or within the next day, system design 7.1). Each test uses
 *  its own sample car, so sample rentals never meet. */
export const samplePickup = (minutesAhead = 5) => new Date(Date.now() + minutesAhead * 60_000);
