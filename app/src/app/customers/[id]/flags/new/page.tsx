import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../../auth/require';
import { getCustomer } from '../../../../../modules/customers/customers';
import { AppFrame } from '../../../../AppFrame';
import { AddFlagForm } from '../../../FlagForms';
import { flagWords } from '../../../words';
import '../../../../cars/cars.css';
import '../../../customers.css';

// Screen 08.5 Add a customer flag (ST-08.5): why and what happened; shown to everyone before the customer's next
// rental. Needs "Customer access" (Proposed: Dulan, 4 Nov 2026).
export default async function AddFlagPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const c = await getCustomer((await params).id);
  if (!c) notFound();
  const [t, w] = await Promise.all([getTranslations('customers'), flagWords()]);
  return (
    <AppFrame person={person} active="customers" title={t('title')} subtitle={c.name} backHref={`/customers/${c.id}`}>
      <h2 className="set-rules-title" style={{ margin: 0 }}>{t('flags.addTitle', { name: c.name })}</h2>
      <AddFlagForm customerId={c.id} w={w} />
    </AppFrame>
  );
}
