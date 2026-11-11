import { describe, it, expect } from 'vitest';
import { askForPrice, approvedTerms, waitingFor } from '../../src/modules/approvals/approvals';
import { sampleRentalFor } from '../helpers/approvals';

// AT-41 (PARTIAL: the extra waits while undecided, #56; the package share final at the day close, Phase 3): "The business day closes before the admin decides the split: the package share becomes final; the extra
// waits, out of the partner's earnings, until decided" (10; ST-10.3). The day close is Phase 3: here, while the
// request waits, the rental's approved terms are still the package with no extra and no split.
describe('AT-41 (partial): the extra waits until decided', { timeout: 30_000 }, () => {
  it('a waiting request changes nothing: the package rate, no extra, no split', async () => {
    const { staff, rentalId } = await sampleRentalFor('partner');
    const ask = await askForPrice(staff, rentalId, { kind: 'rate', amount: 5500, reason: 'Sample' });
    if (!('ok' in ask)) throw new Error(JSON.stringify(ask));
    expect(await waitingFor(rentalId)).toMatchObject({ id: ask.id, aboveTheirPackage: true, extra: 3000 });
    expect(await approvedTerms(rentalId)).toMatchObject({ dailyRate: 4500, packageRate: 4500, extra: 0, partnerExtra: null });
  });
});
