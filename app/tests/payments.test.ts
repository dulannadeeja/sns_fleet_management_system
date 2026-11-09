import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { createRental, rentalEstimate } from '../src/modules/rentals/rentals';
import { setRentalTerms } from '../src/modules/rentals/terms';
import { recordPayment, rentalMoney, payableRentals } from '../src/modules/money/payments';
import { setPermission } from '../src/modules/people/people';
import { theOwner, samplePerson } from './helpers/people';
import { sampleCarAndCustomer, samplePickup } from './helpers/rentals';

// ST-09.1, record a payment (system design 8.1, 8.2; Confirmed 9 Nov 2026). Each test adds its own sample car, customer
// and rental; references are random so they never meet another test's.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

async function sampleRental(days = 2, customerId?: string) {
  const owner = await theOwner();
  const s = await sampleCarAndCustomer(owner);
  const r = await createRental(owner, { customerId: customerId ?? s.customerId, vehicleId: s.carId, pickupAt: samplePickup(), days });
  if (!('ok' in r)) throw new Error(JSON.stringify(r));
  return { rentalId: r.id, customerId: customerId ?? s.customerId, estimate: (await rentalEstimate(r.id))!.total };
}
const ref = () => `Sample-${randomUUID().slice(0, 8)}`;
const bill = (customerId: string, rentals: { rentalId: string; amount: number }[], parts: { method: 'cash' | 'bank' | 'card'; amount: number; reference?: string }[], extra = {}) =>
  ({ key: randomUUID(), customerId, for: 'bill' as const, rentals, parts, ...extra });

describe('ST-09.1: record a payment', () => {
  it('a bill payment is at most what is unpaid on the estimate; the paid amount is kept', async () => {
    const owner = await theOwner();
    const { rentalId, customerId, estimate } = await sampleRental();
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: estimate + 1 }], [{ method: 'cash', amount: estimate + 1 }]))).toMatchObject({ error: 'overEstimate' });
    const first = await recordPayment(owner, bill(customerId, [{ rentalId, amount: 1000 }], [{ method: 'cash', amount: 1000 }]));
    expect(first).toMatchObject({ ok: true });
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: estimate - 999 }], [{ method: 'cash', amount: estimate - 999 }]))).toMatchObject({ error: 'overEstimate' });
    expect(await rentalMoney(rentalId)).toMatchObject({ estimate, paid: 1000, unpaid: estimate - 1000 });
  });

  it('refuses a wrong amount, a missing bank reference or card receipt, and parts that do not add up', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const one = [{ rentalId, amount: 500 }];
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: 0 }], [{ method: 'cash', amount: 0 }]))).toMatchObject({ error: 'amountInvalid' });
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: 1.5 }], [{ method: 'cash', amount: 1.5 }]))).toMatchObject({ error: 'amountInvalid' });
    expect(await recordPayment(owner, bill(customerId, one, [{ method: 'bank', amount: 500 }]))).toMatchObject({ error: 'referenceMissing' });
    expect(await recordPayment(owner, bill(customerId, one, [{ method: 'card', amount: 500, reference: '  ' }]))).toMatchObject({ error: 'referenceMissing' });
    expect(await recordPayment(owner, bill(customerId, one, [{ method: 'cash', amount: 400 }]))).toMatchObject({ error: 'totalsDiffer' });
    expect(await recordPayment(owner, bill(customerId, one, [{ method: 'cheque' as 'cash', amount: 500 }]))).toMatchObject({ error: 'methodInvalid' });
  });

  it('a payment goes only on the same customer\'s rentals', async () => {
    const owner = await theOwner();
    const a = await sampleRental();
    const b = await sampleRental();
    expect(await recordPayment(owner, bill(a.customerId, [{ rentalId: b.rentalId, amount: 500 }], [{ method: 'cash', amount: 500 }]))).toMatchObject({ error: 'notFound' });
  });

  it('saving the same form twice records it once', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const input = bill(customerId, [{ rentalId, amount: 700 }], [{ method: 'cash', amount: 700 }]);
    const [x, y] = await Promise.all([recordPayment(owner, input), recordPayment(owner, input)]);
    expect(x).toMatchObject({ ok: true });
    expect(y).toMatchObject({ ok: true });
    expect((x as { paymentIds: string[] }).paymentIds).toEqual((y as { paymentIds: string[] }).paymentIds);
    expect((await rentalMoney(rentalId))!.paid).toBe(700);
  });

  it('a mixed payment is one payment per part; each cash part adds a drawer line; bank and card wait for the check', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const r = await recordPayment(owner, bill(customerId, [{ rentalId, amount: 3000 }], [{ method: 'cash', amount: 1000 }, { method: 'bank', amount: 2000, reference: ref() }]));
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    expect(r.paymentIds).toHaveLength(2);
    const { rows: cash } = await pool.query('select amount, kind, created_by from cash_movement where payment_id = any($1)', [r.paymentIds]);
    expect(cash).toEqual([{ amount: '1000', kind: 'paymentIn', created_by: owner }]);
    const { rows: rec } = await pool.query('select p.method, rc.status from reconciliation rc join payment p on p.id = rc.payment_id where p.id = any($1)', [r.paymentIds]);
    expect(rec).toEqual([{ method: 'bank', status: 'waiting' }]);
    const m = (await rentalMoney(rentalId))!;
    expect(m.paid).toBe(3000);
    expect(m.payments.map((p) => p.method).sort()).toEqual(['bank', 'cash']);
  });

  it('a reference already on another payment of the same method shows it; saving then needs a reason, which is kept', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const same = ref();
    const first = await recordPayment(owner, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'card', amount: 100, reference: same }]));
    if (!('ok' in first)) throw new Error(JSON.stringify(first));
    const again = await recordPayment(owner, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'card', amount: 100, reference: ` ${same.toLowerCase()} ` }]));
    expect(again).toMatchObject({ error: 'sameReference', same: [{ amount: 100, method: 'card' }] });
    // The same number on a bank transfer is another method: no warning.
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'bank', amount: 100, reference: same }]))).toMatchObject({ ok: true });
    const withReason = await recordPayment(owner, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'card', amount: 100, reference: same }], { sameReferenceReason: 'Sample: the machine started its numbers again' }));
    if (!('ok' in withReason)) throw new Error(JSON.stringify(withReason));
    const { rows } = await pool.query('select same_reference_reason from payment where id = $1', [withReason.paymentIds[0]]);
    expect(rows[0].same_reference_reason).toBe('Sample: the machine started its numbers again');
  });

  it('a deposit payment is at most the deposit set, less what was received; it is held money, not a bill payment', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const dep = (amount: number) => ({ key: randomUUID(), customerId, for: 'deposit' as const, rentals: [{ rentalId, amount }], parts: [{ method: 'cash' as const, amount }] });
    expect(await recordPayment(owner, dep(1000))).toMatchObject({ error: 'noDeposit' });
    expect(await setRentalTerms(owner, rentalId, { deposit: 5000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false })).toEqual({ ok: true });
    expect(await recordPayment(owner, dep(5001))).toMatchObject({ error: 'overDeposit' });
    expect(await recordPayment(owner, dep(3000))).toMatchObject({ ok: true });
    expect(await recordPayment(owner, dep(2001))).toMatchObject({ error: 'overDeposit' });
    expect(await rentalMoney(rentalId)).toMatchObject({ paid: 0, depositSet: 5000, depositReceived: 3000 });
    // Derived control: the deposit cannot go below what was received, or be waived after.
    expect(await setRentalTerms(owner, rentalId, { deposit: 2999, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false })).toEqual({ error: 'depositBelowReceived' });
    expect(await setRentalTerms(owner, rentalId, { deposit: null, waiveReason: 'Sample', rentPaid: 'return', fuel: 'notCounted', referenceRequired: false })).toEqual({ error: 'depositBelowReceived' });
    expect(await setRentalTerms(owner, rentalId, { deposit: 3000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false })).toEqual({ ok: true });
  });

  it('needs Customer access; logged with who took it', async () => {
    const owner = await theOwner();
    const staff = (await samplePerson()).id;
    const { rentalId, customerId } = await sampleRental();
    expect(await setPermission(owner, staff, 'customerAccess', false)).toMatchObject({ ok: true });
    expect(await recordPayment(staff, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'cash', amount: 100 }]))).toMatchObject({ error: 'notAllowed' });
    expect(await setPermission(owner, staff, 'customerAccess', true)).toMatchObject({ ok: true });
    const r = await recordPayment(staff, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'cash', amount: 100 }]));
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    const { rows } = await pool.query("select created_by from audit_event where action = 'payment.record' and target_id = $1", [r.paymentIds[0]]);
    expect(rows).toEqual([{ created_by: staff }]);
    expect((await payableRentals(customerId)).map((x) => x.id)).toContain(rentalId);
  });

  it('payments, allocations, deposit lines, drawer lines and checks can never be changed', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const r = await recordPayment(owner, bill(customerId, [{ rentalId, amount: 100 }], [{ method: 'cash', amount: 100 }]));
    if (!('ok' in r)) throw new Error(JSON.stringify(r));
    for (const t of ['payment', 'payment_allocation', 'cash_movement']) {
      const col = t === 'payment' ? 'id' : 'payment_id';
      await expect(pool.query(`update ${t} set amount = 1 where ${col} = $1`, [r.paymentIds[0]])).rejects.toThrow(/insert-only/);
      await expect(pool.query(`delete from ${t} where ${col} = $1`, [r.paymentIds[0]])).rejects.toThrow(/insert-only/);
    }
    expect(await setRentalTerms(owner, rentalId, { deposit: 1000, rentPaid: 'return', fuel: 'notCounted', referenceRequired: false })).toEqual({ ok: true });
    const d = await recordPayment(owner, { key: randomUUID(), customerId, for: 'deposit', rentals: [{ rentalId, amount: 1000 }], parts: [{ method: 'bank', amount: 1000, reference: ref() }] });
    if (!('ok' in d)) throw new Error(JSON.stringify(d));
    for (const t of ['deposit_movement', 'reconciliation']) await expect(pool.query(`delete from ${t} where payment_id = $1`, [d.paymentIds[0]])).rejects.toThrow(/insert-only/);
  });

  it('the screen limits: 5 parts, 10 rentals, an 80-letter reference, a 500-letter reason; a key reused for another payment is refused', async () => {
    const owner = await theOwner();
    const { rentalId, customerId } = await sampleRental();
    const six = Array.from({ length: 6 }, () => ({ method: 'cash' as const, amount: 1 }));
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: 6 }], six))).toMatchObject({ error: 'tooMany' });
    expect(await recordPayment(owner, bill(customerId, Array.from({ length: 11 }, () => ({ rentalId: randomUUID(), amount: 1 })), [{ method: 'cash', amount: 11 }]))).toMatchObject({ error: 'tooMany' });
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: 1 }], [{ method: 'bank', amount: 1, reference: 'x'.repeat(81) }]))).toMatchObject({ error: 'tooLong' });
    expect(await recordPayment(owner, bill(customerId, [{ rentalId, amount: 1 }], [{ method: 'cash', amount: 1 }], { sameReferenceReason: 'x'.repeat(501) }))).toMatchObject({ error: 'tooLong' });
    const first = bill(customerId, [{ rentalId, amount: 200 }], [{ method: 'cash', amount: 200 }]);
    expect(await recordPayment(owner, first)).toMatchObject({ ok: true });
    expect(await recordPayment(owner, { ...first, rentals: [{ rentalId, amount: 300 }], parts: [{ method: 'cash', amount: 300 }] })).toMatchObject({ error: 'keyInvalid' });
    expect((await rentalMoney(rentalId))!.paid).toBe(200);
  });
});
