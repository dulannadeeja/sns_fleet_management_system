import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCustomer } from '../../../../modules/customers/customers';
import { debtOf } from '../../../../modules/customers/flags';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { Notice } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { WriteOffForm } from './WriteOffForm';
import '../../../cars/cars.css';
import '../../customers.css';

// Screen 08.6 Write off a debt (ST-08.6; system design 8.3, Confirmed 11 Nov 2026): all or part of the customer's debt,
// oldest rentals first, with a reason. Needs "Write off a customer debt" (the owner until someone is given it).
export default async function WriteOffPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('writeOffDebt');
  const c = await getCustomer((await params).id);
  if (!c) notFound();
  const [debt, t] = await Promise.all([debtOf(c.id), getTranslations('customers')]);
  return (
    <AppFrame person={person} active="customers" title={t('writeOff.title')} subtitle={c.name} backHref={`/customers/${c.id}`}>
      {!debt.total ? <Notice>{t('writeOff.none')}</Notice> : (
        <WriteOffForm customerId={c.id} debt={debt.total} rentals={debt.rentals.map((r) => ({ label: rentalNumber(r.number), unpaid: r.unpaid }))}
          w={t.raw('writeOff') as Record<string, string> & { errors: Record<string, string> }} />
      )}
    </AppFrame>
  );
}
