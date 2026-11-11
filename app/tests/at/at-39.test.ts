import { describe, it, expect } from 'vitest';
import { askForPrice, decide, approvedTerms } from '../../src/modules/approvals/approvals';
import { sampleRentalFor } from '../helpers/approvals';

// AT-39 (PARTIAL: the decision and its saved split, #56; the partner's earning lines with the day close, Phase 3): "A partner car is rented above its package price; the admin keeps the whole extra for SNS: the partner's
// earning is worked out on the package price only; the partner sees no customer price and no extra" (system design
// 8.4; ST-10.3). The earnings lines come with the day close (Phase 3): here the decision and its saved split.
describe('AT-39 (partial): the whole extra kept for SNS', { timeout: 30_000 }, () => {
  it('needs the split; 0 rupees to the partner is allowed, with a reason', async () => {
    const { staff, admin, rentalId } = await sampleRentalFor('partner');
    const ask = await askForPrice(staff, rentalId, { kind: 'rate', amount: 5500, reason: 'Sample: festival weekend' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await decide(admin, ask.id, { approve: true })).toEqual({ error: 'splitMissing' });
    expect(await decide(admin, ask.id, { approve: true, partnerExtra: 0, splitReason: ' ' })).toEqual({ error: 'splitReasonMissing' });
    expect(await decide(admin, ask.id, { approve: true, partnerExtra: 0, splitReason: 'Sample: SNS found the customer' })).toEqual({ ok: true });
    expect(await approvedTerms(rentalId)).toMatchObject({ dailyRate: 5500, packageRate: 4500, extra: 3000, partnerExtra: 0 });
  });
});
