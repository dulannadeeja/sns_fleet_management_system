import type { ApprovalRow } from '../../modules/approvals/approvals';

/** Who bears a price change (10.1, 10.2; system design 8.4): SNS on its own car; on a partner car a lower price is
 *  shared by the commission, and the extra above the package is split as the admin sets. */
export function bearer(a: Pick<ApprovalRow, 'partner' | 'effect' | 'aboveTheirPackage' | 'commissionPercent' | 'kind'>, t: (k: string, v?: Record<string, string | number>) => string, seeTerms: boolean) {
  if (!a.partner) return t('bearer.sns');
  if (a.aboveTheirPackage) return t('bearer.split');
  // A discount reduces SNS's and the partner's earnings in proportion (8.4); a lower rate follows the commission.
  // The commission is a partner term: shown only to people who may see partner terms (4.2).
  if (a.kind === 'discount') return t('bearer.proportional');
  return seeTerms ? t('bearer.shared', { sns: a.commissionPercent ?? 0, partner: 100 - (a.commissionPercent ?? 0) }) : t('bearer.sharedPlain');
}
