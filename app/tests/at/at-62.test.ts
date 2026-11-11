import { describe, it, expect } from 'vitest';
import { receiveCar, rentalBill, correctGarageDays } from '../../src/modules/rentals/returns';
import { approvalsList, decide } from '../../src/modules/approvals/approvals';
import { samplePerson } from '../helpers/people';
import { outRental } from '../helpers/handover';

// AT-62 (PARTIAL: the garage days and their split, #63; the partner's earning lines with the day close, Phase 3): "A partner car comes back damaged and spends 3 days at the garage: staff propose 3 garage days; once an admin
// approves, 3 × the car's garage-day rate is on the bill and the split waits for the admin, out of the partner's
// earnings" (ST-07.2; 7.4 "Receiving the car": on a partner car the admin sets the partner's rupees when approving).
describe('AT-62 (partial): garage days after damage', { timeout: 60_000 }, () => {
  it('proposed with damage and the car under repair; approved with the split; corrected later by a dated line', async () => {
    const r = await outRental({ days: 1 });
    const base = { inKm: 1100, fuel: 'full' as const, accessories: r.accessories, checked: true, payLaterNote: 'Sample' };
    expect(await receiveCar(r.owner, r.rentalId, { ...base, nextState: 'repair', nextReason: 'Sample', garageDays: 3 })).toEqual({ error: 'garageNeedsDamage' });
    expect(await receiveCar(r.owner, r.rentalId, { ...base, nextState: 'available', damage: { what: 'Sample: dented door', amount: 15_000 }, garageDays: 3 })).toEqual({ error: 'garageNeedsRepair' });
    expect(await receiveCar(r.owner, r.rentalId, { ...base, nextState: 'repair', nextReason: 'Sample: door', damage: { what: 'Sample: dented door', amount: 15_000 }, garageDays: 3 })).toEqual({ ok: true });
    expect((await rentalBill(r.rentalId))!.lines.some((l) => l.kind === 'garageDays')).toBe(false);
    const admin = (await samplePerson('first-pass-1', 'admin')).id;
    const req = (await approvalsList(admin, 'waiting')).find((a) => a.rentalId === r.rentalId && a.kind === 'garageDays')!;
    expect(req).toMatchObject({ garageDays: 3, effect: 15_000 });
    expect(await decide(admin, req.id, { approve: true })).toEqual({ error: 'splitMissing' });
    expect(await decide(admin, req.id, { approve: true, partnerExtra: 0, splitReason: 'Sample: all SNS' })).toEqual({ ok: true });
    const line = (await rentalBill(r.rentalId))!.lines.find((l) => l.kind === 'garageDays')!;
    expect(line).toMatchObject({ amount: 15_000, partnerShare: 0, waiting: false });
    // Back from the garage after 2 days: a dated line of − 1 day; the first stays.
    expect(await correctGarageDays(admin, r.rentalId, { days: 2, reason: 'Sample: back after 2 days', partnerRupees: 0 })).toEqual({ ok: true });
    const lines = (await rentalBill(r.rentalId))!.lines.filter((l) => l.kind === 'garageDays');
    expect(lines.map((l) => l.amount)).toEqual([15_000, -5_000]);
  });
});
