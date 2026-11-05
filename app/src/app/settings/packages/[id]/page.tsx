import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { listPackages } from '../../../../modules/cars/packages';
import { SettingsFrame } from '../../SettingsFrame';
import { ChangePackageForm } from '../PackageForms';
import { packageWords } from '../words';
import '../../../cars/cars.css';

// 04.6 › Change a package (ST-04.4, AT-50): only cars added afterwards start with the change.
export default async function ChangePackagePage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('editCarsAndPackages');
  const { id } = await params;
  const pkg = (await listPackages()).find((x) => x.id === id);
  if (!pkg) notFound();
  const [p, w] = await Promise.all([getTranslations('cars.packages'), packageWords()]);
  return (
    <SettingsFrame person={person} active="packages" subtitle={p('changeTitle')} backHref="/settings/packages">
      <h2 className="set-rules-title" style={{ margin: 0 }}>{`${p('changeTitle')} · ${pkg.name}`}</h2>
      <ChangePackageForm id={pkg.id} pkg={pkg} w={w} />
    </SettingsFrame>
  );
}
