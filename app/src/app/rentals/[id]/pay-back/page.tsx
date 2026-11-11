import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { paidAbove } from '../../../../modules/money/writeoffs';
import { rentalTerms } from '../../../../modules/rentals/rentals';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { AppFrame } from '../../../AppFrame';
import { rentalWords } from '../../words';
import { PayBackForm } from './PayBackForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Paying back money above a lowered bill (system design 8.3, Confirmed 11 Nov 2026): up to the amount above the bill,
// cash or bank with its reference, no approval. Needs "Issue refunds or pay expenses" (the module checks it all again).
export default async function PayBackPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('refundsAndExpenses');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const [above, w, t] = await Promise.all([paidAbove(r.id), rentalWords(), getTranslations('rentals.payBack')]);
  if (!above) redirect(`/rentals/${r.id}`);
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={rentalNumber(r.number)} backHref={`/rentals/${r.id}`}>
      <PayBackForm rentalId={r.id} above={above} w={w.payBack as unknown as Record<string, string> & { errors: Record<string, string> }} />
    </AppFrame>
  );
}
