import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../../../auth/require';
import { getCar } from '../../../../modules/cars/cars';
import { papersOf } from '../../../../modules/cars/papers';
import { PlateBadge, type Lang } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { PapersForm } from './PapersForm';
import '../../cars.css';

// Papers and service dates (ST-04.6; boards 04.2/04.3 "Papers and service"; Proposed: Dulan, 3 Nov 2026): everyone who
// works at SNS enters and changes them. Each changed box is logged with its old and new value.
export default async function CarPapersPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requireEmployee();
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();
  const [papers, t, lang] = await Promise.all([papersOf(car.id), getTranslations('cars.papers'), getLocale()]);
  const was = Object.fromEntries(Object.entries(papers!).map(([k, v]) => [k, v === null ? '' : String(v)]));
  return (
    <AppFrame person={person} active="cars" title={t('title')} subtitle={car.registration} backHref={`/cars/${car.id}`}>
      <section className="car-card">
        <div className="car-top"><h2>{t('title')}</h2><PlateBadge plate={car.registration} lang={lang as Lang} /></div>
        <PapersForm carId={car.id} was={was} w={{
          labels: { insuranceExpires: t('insuranceExpires'), licenceExpires: t('licenceExpires'), nextServiceOn: t('nextServiceOn'), nextServiceKm: t('nextServiceKm') },
          hint: t('hint'), kmHint: t('kmHint'), note: t('note'), save: t('save'), cancel: t('cancel'), errors: t.raw('errors') as Record<string, string>,
        }} />
      </section>
    </AppFrame>
  );
}
