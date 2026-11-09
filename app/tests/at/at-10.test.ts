import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { createRental } from '../../src/modules/rentals/rentals';
import { recordPayment, rentalMoney } from '../../src/modules/money/payments';
import { theOwner } from '../helpers/people';
import { sampleCarAndCustomer, samplePickup } from '../helpers/rentals';

// AT-10: "Employee records bank payment with reference: recorded confirmed immediately; reconciliation status tracked
// separately" (system design 8.1, 9; the bank check itself is Phase 3).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

describe('AT-10: a bank payment with its reference', () => {
  it('counts as paid at once, while its bank check waits apart', async () => {
    const owner = await theOwner();
    const { carId, customerId } = await sampleCarAndCustomer(owner);
    const r = await createRental(owner, { customerId, vehicleId: carId, pickupAt: samplePickup(), days: 2 });
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    const reference = `Sample-${randomUUID().slice(0, 8)}`;
    const p = await recordPayment(owner, { key: randomUUID(), customerId, for: 'bill', rentals: [{ rentalId: r.id, amount: 4000 }], parts: [{ method: 'bank', amount: 4000, reference }] });
    if (!('ok' in p)) throw new Error(JSON.stringify(p));
    expect((await rentalMoney(r.id))!).toMatchObject({ paid: 4000, payments: [{ method: 'bank', amount: 4000, reference, check: 'waiting' }] });
    const { rows } = await pool.query('select status from reconciliation where payment_id = $1', [p.paymentIds[0]]);
    expect(rows).toEqual([{ status: 'waiting' }]);
  });
});
