import { describe, it, expect } from 'vitest';
import { askForPrice, decide, approvedTerms } from '../../src/modules/approvals/approvals';
import { setPermission } from '../../src/modules/people/people';
import { sampleRentalFor } from '../helpers/approvals';

// AT-40 (PARTIAL: the saved split, #56; the day earning shown as one amount with the day close, Phase 3): "Same, but the admin sets a 50/50 split of the extra, with a reason: the partner's day earning is their package
// share plus half the extra, shown as one amount; SNS keeps its commission plus the other half" (8.4; ST-10.3; the split
// is the partner's rupees of the extra, 11 Nov 2026). The day earnings come with the day close (Phase 3).
describe('AT-40 (partial): a 50/50 split of the extra', { timeout: 30_000 }, () => {
  it('saves the partner\'s rupees of the extra; it needs "Share an above-package price" and stays within the extra', async () => {
    const { owner, staff, admin, rentalId } = await sampleRentalFor('partner');
    const ask = await askForPrice(staff, rentalId, { kind: 'rate', amount: 5500, reason: 'Sample' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await decide(admin, ask.id, { approve: true, partnerExtra: 3001, splitReason: 'Sample' })).toEqual({ error: 'splitInvalid' });
    expect(await setPermission(owner, admin, 'sharePartnerCarSurcharge', false)).toMatchObject({ ok: true });
    expect(await decide(admin, ask.id, { approve: true, partnerExtra: 1500, splitReason: 'Sample' })).toEqual({ error: 'splitNotAllowed' });
    expect(await setPermission(owner, admin, 'sharePartnerCarSurcharge', true)).toMatchObject({ ok: true });
    expect(await decide(admin, ask.id, { approve: true, partnerExtra: 1500, splitReason: 'Sample: Sunil serviced the car' })).toEqual({ ok: true });
    expect(await approvedTerms(rentalId)).toMatchObject({ dailyRate: 5500, extra: 3000, partnerExtra: 1500, splitReason: 'Sample: Sunil serviced the car' });
  });
});
