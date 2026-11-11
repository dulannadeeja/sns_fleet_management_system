import { describe, it, expect } from 'vitest';
import { receiveCar, rentalBill } from '../../src/modules/rentals/returns';
import { approvalsList, decide } from '../../src/modules/approvals/approvals';
import { samplePerson } from '../helpers/people';
import { outRental } from '../helpers/handover';

// AT-54 (PARTIAL: the charge and the admin's split, #63; the partner's earning line with the day close, Phase 3): "A partner car comes back without its air pump; LKR 2,000 is charged: the 2,000 waits for an admin decision,
// out of the partner's earnings; once the admin sets the split with a reason, the partner's share becomes final"
// (system design 6, 8.4, 7.4 "Receiving the car"; the earning lines themselves with the day close, Phase 3).
describe('AT-54 (partial): a missing accessory on a partner car', { timeout: 60_000 }, () => {
  it('waits for the admin\'s split; an item already missing at handover is never charged', async () => {
    const r = await outRental({ days: 1 });
    const missing = r.accessories.map((a, i) => ({ item: a.item, present: i !== 0 }));
    const item = r.accessories[0].item;
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1100, fuel: 'full', accessories: missing, checked: true, nextState: 'available', payLaterNote: 'Sample',
      accessoryCharges: [] })).toEqual({ error: 'accessoryMissing', item });
    expect(await receiveCar(r.owner, r.rentalId, { inKm: 1100, fuel: 'full', accessories: missing, checked: true, nextState: 'available', payLaterNote: 'Sample',
      accessoryCharges: [{ item, amount: 2000 }] })).toEqual({ ok: true });
    const line = (await rentalBill(r.rentalId))!.lines.find((l) => l.kind === 'accessory')!;
    expect(line).toMatchObject({ amount: 2000, allocation: 'admin', partnerShare: null, waiting: true });
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    const req = (await approvalsList(admin, 'waiting')).find((a) => a.rentalId === r.rentalId && a.kind === 'split')!;
    expect(req).toBeTruthy();
    expect(await decide(admin, req.id, { approve: true, partnerExtra: 1000, splitReason: 'Sample: half each' })).toEqual({ ok: true });
    const after = (await rentalBill(r.rentalId))!.lines.find((l) => l.kind === 'accessory')!;
    expect(after).toMatchObject({ partnerShare: 1000, waiting: false });
  });
});
