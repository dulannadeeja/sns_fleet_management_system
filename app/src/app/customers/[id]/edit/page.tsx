import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCustomer } from '../../../../modules/customers/customers';
import { AppFrame } from '../../../AppFrame';
import { CorrectCustomerForm, CorrectNicForm } from '../../CustomerForms';
import { customerWords } from '../../words';
import '../../../cars/cars.css';
import '../../customers.css';

// Screen 08.2 "Correct details" (ST-08.3): name, phone, address and licence; never the NIC (one NIC is one customer).
export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const c = await getCustomer((await params).id);
  if (!c) notFound();
  const [t, w] = await Promise.all([getTranslations('customers'), customerWords()]);
  const saved = { name: c.name, phone: c.phone, address: c.address ?? '', licenceNumber: c.licenceNumber, licenceExpires: c.licenceExpires };
  return (
    <AppFrame person={person} active="customers" title={c.name} subtitle={t('edit')} backHref={`/customers/${c.id}`}>
      <p className="set-muted" style={{ margin: 0 }}>{`NIC ${c.nic}`}</p>
      <CorrectCustomerForm customerId={c.id} saved={saved} w={w} />
      {person.role === 'owner' || person.role === 'admin' ? (
        <section className="car-card" aria-labelledby="nic-fix"><h2 id="nic-fix">{t('nicFix')}</h2>
          <span className="set-muted">{t('nicFixNote')}</span>
          <CorrectNicForm customerId={c.id} w={{ nicNew: t('nicNew'), nicHint: t('nicHint'), reason: t('reason'), save: t('nicFixSave'), requiredMark: w.requiredMark, errors: { ...w.errors, nicTaken: t('errors.nicTaken'), reasonMissing: t('errors.reasonMissing') } }} />
        </section>
      ) : null}
    </AppFrame>
  );
}
