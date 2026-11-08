import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCustomer } from '../../../../modules/customers/customers';
import { rentalTerms } from '../../../../modules/rentals/rentals';
import { AppFrame } from '../../../AppFrame';
import { rentalWords } from '../../words';
import { ReferenceForm } from './ReferenceForm';
import '../../../cars/cars.css';
import '../../../customers/customers.css';
import '../../rentals.css';

// Screen 05.6 Reference person (ST-05.5): added to the rental's customer, then chosen on step 4. Needs Customer access.
export default async function ReferencePage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const [c, t, w, tk] = await Promise.all([getCustomer(r.customerId), getTranslations('rentals'), rentalWords(), getTranslations('customers')]);
  const words = { ...(w.reference as unknown as Record<string, string>), cancel: w.cancel } as unknown as Record<string, string> & { errors: Record<string, string>; relationships: Record<string, string> };
  return (
    <AppFrame person={person} active="rentals" title={t('reference.title')} subtitle={c?.name} backHref={`/rentals/${r.id}/terms`}>
      <ReferenceForm rentalId={r.id} kinds={tk.raw('refKinds') as Record<string, string>} w={words} />
    </AppFrame>
  );
}
