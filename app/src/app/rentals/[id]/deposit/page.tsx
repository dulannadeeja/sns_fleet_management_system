import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { depositState } from '../../../../modules/money/deposits';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { getCustomer } from '../../../../modules/customers/customers';
import { Notice } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { rentalWords } from '../../words';
import { DepositForm } from './DepositForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screen 07.3 Use deposit and refund (ST-07.3; system design 8.2, Confirmed 11 Nov 2026). Once per rental after the car
// is back: this bill first, older bills with the customer's agreement, the rest refunded. Needs Customer access; a refund
// above 0 also "Issue refunds and pay expenses" (the module checks it all again).
export default async function DepositPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const s = await depositState((await params).id);
  if (!s) notFound();
  if (!s.returned || s.settlement) redirect(`/rentals/${s.rentalId}`);
  const [c, w, t, mayRefund] = await Promise.all([getCustomer(s.customerId), rentalWords(), getTranslations('rentals.deposit'), mayDo(person, 'refundsAndExpenses')]);
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={`${rentalNumber(s.number)} · ${c?.name ?? ''}`} backHref={`/rentals/${s.rentalId}`}>
      {s.garageWaiting ? <Notice tone="warning">{t('garageWaiting')}</Notice>
        : s.held <= 0 ? <Notice tone="info">{t('nothingHeld')}</Notice>
        : <DepositForm rentalId={s.rentalId} mayRefund={mayRefund} w={w.deposit as unknown as Record<string, string> & { errors: Record<string, string> }}
            facts={{ number: rentalNumber(s.number), billTotal: s.billTotal, billUnpaid: s.billUnpaid, held: s.held, older: s.older.map((o) => ({ ...o, label: rentalNumber(o.number) })) }} />}
    </AppFrame>
  );
}
