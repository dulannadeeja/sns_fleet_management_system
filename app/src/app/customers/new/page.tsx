import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { AppFrame } from '../../AppFrame';
import { NewCustomerForm } from '../CustomerForms';
import { customerWords } from '../words';
import '../../cars/cars.css';
import '../customers.css';

// Screen 08.3 New customer with documents (ST-08.2): needs customer access. Copies may come later (AT-49); a NIC already
// recorded opens that customer (AT-51).
export default async function NewCustomerPage() {
  const person = await requirePermission('customerAccess');
  const [t, w] = await Promise.all([getTranslations('customers'), customerWords()]);
  return (
    <AppFrame person={person} active="customers" title={t('title')} subtitle={t('add')} backHref="/customers">
      <NewCustomerForm w={w} />
    </AppFrame>
  );
}
