import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { SettingsFrame } from '../../SettingsFrame';
import { AddPackageForm } from '../PackageForms';
import { packageWords } from '../words';
import '../../../cars/cars.css';

// 04.6 › Add a package (ST-04.4): a name, its models (a new model comes in this way) and its rates.
export default async function AddPackagePage() {
  const person = await requirePermission('editCarsAndPackages');
  const [p, w] = await Promise.all([getTranslations('cars.packages'), packageWords()]);
  return (
    <SettingsFrame person={person} active="packages" subtitle={p('addTitle')} backHref="/settings/packages">
      <h2 className="set-rules-title" style={{ margin: 0 }}>{p('addTitle')}</h2>
      <AddPackageForm w={w} />
    </SettingsFrame>
  );
}
