import { paymentNumber } from '../../modules/money/payments';
import { rentalNumber } from '../../modules/rentals/agreements';

// What a payment correction (#65) asks for, in one line: "P-0012 · Amount: 7,000 → 700", the new way, the new reference,
// or the rental the money moves to. Used on Approvals and on the rental page.
type T = (key: string, values?: Record<string, string | number>) => string;
export interface CorrectionFacts { paymentNumber: number | null; fix: string | null; was: number; newAmount: number | null; newMethod: string | null; newReference: string | null; toRentalNumber: number | null }

export function correctionText(c: CorrectionFacts, t: T, money: (n: number) => string): string {
  const p = c.paymentNumber === null ? '' : `${paymentNumber(c.paymentNumber)} · `;
  if (c.fix === 'amount') return p + t('fixes.amount', { was: money(c.was), now: money(c.newAmount ?? 0) });
  if (c.fix === 'method') return p + t('fixes.method', { method: t(`methods.${c.newMethod ?? 'cash'}`), reference: c.newReference ? ` · ${c.newReference}` : '' });
  if (c.fix === 'reference') return p + t('fixes.reference', { reference: c.newReference ?? '' });
  return p + t('fixes.rental', { amount: money(c.was), rental: c.toRentalNumber === null ? '' : rentalNumber(c.toRentalNumber) });
}
