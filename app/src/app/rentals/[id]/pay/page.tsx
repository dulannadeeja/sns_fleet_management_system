import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCustomer } from '../../../../modules/customers/customers';
import { payableRentals } from '../../../../modules/money/payments';
import { rentalTerms } from '../../../../modules/rentals/rentals';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { Notice } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { rentalWords } from '../../words';
import { PayForm } from './PayForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screens 09.3 Record a payment and 09.4 Split payment (ST-09.1; system design 8.1, 8.2; Confirmed 9 Nov 2026). For
// the bill (shared across the customer's rentals, at most what is unpaid on each estimate) or the deposit (at most what
// is set, less what was received). Needs Customer access. Each visit gets its own key: the same form sent twice is
// recorded once.
export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const [c, rentals, w, t] = await Promise.all([getCustomer(r.customerId), payableRentals(r.customerId), rentalWords(), getTranslations('rentals')]);
  const here = rentals.find((x) => x.id === r.id);
  return (
    <AppFrame person={person} active="rentals" title={t('pay.title')} subtitle={c?.name} backHref={`/rentals/${r.id}`}>
      {!here ? <Notice tone="warning">{t('pay.notPayable')}</Notice> : (
        <PayForm customerId={r.customerId} rentalId={r.id} formKey={randomUUID()} w={w.pay as unknown as Record<string, string> & { errors: Record<string, string>; methods: Record<string, string> }}
          rentals={[here, ...rentals.filter((x) => x.id !== r.id)].map((x) => ({ ...x, label: rentalNumber(x.number) }))} />
      )}
    </AppFrame>
  );
}
