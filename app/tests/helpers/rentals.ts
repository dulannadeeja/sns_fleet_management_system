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

/** A pickup time: now (the pickup is the moment of the save, system design 7.1). Each test uses its own sample car, so
 *  sample rentals never meet. */
export const samplePickup = () => new Date();
