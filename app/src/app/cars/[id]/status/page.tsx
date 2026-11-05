import { forbidden, notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../../../auth/require';
import { getCar } from '../../../../modules/cars/cars';
import { statusOf, isCarState } from '../../../../modules/cars/status';
import { todayColombo } from '../../../../lib/dates';
import { PlateBadge, type Lang } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { statusChoices } from '../../status-choices';
import { StatusForm } from './StatusForm';
import '../../cars.css';

// Screen 04.5 Change a car's status (ST-04.5; system design 11; Confirmed 5 Nov 2026. Only the statuses this
// person may set are offered; a person who may set none is refused (403).
export default async function CarStatusPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ to?: string }> }) {
  const person = await requireEmployee();
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();
  const [now, t, ts, lang, q] = await Promise.all([statusOf(car.id), getTranslations('cars.status'), getTranslations('settings'), getLocale(), searchParams]);
  const choices = await statusChoices(person, now.status);
  if (!choices.length) forbidden();
  const names = Object.fromEntries((['available', 'repair', 'unavailable', 'retired'] as const).map((s) => [s, t(`names.${s}`)]));
  const hints = Object.fromEntries((['available', 'repair', 'unavailable', 'retired'] as const).map((s) => [s, t(`hints.${s}`)]));
  const start = q.to && isCarState(q.to) && choices.includes(q.to) ? q.to : choices[0];
  return (
    <AppFrame person={person} active="cars" title={t('title')} subtitle={car.registration} backHref={`/cars/${car.id}`}>
      <section className="car-card">
        <div className="car-top">
          <h2>{t('title')}</h2>
          <PlateBadge plate={car.registration} lang={lang as Lang} />
        </div>
        <span className="set-muted">{t('now', { status: names[now.status] })}</span>
        <StatusForm carId={car.id} now={now.status} nowReason={now.reason ?? ''} nowBack={now.expectedBack ?? ''} choices={choices} start={start} today={todayColombo()}
          w={{ names, hints, reason: t('reason'), reasonHint: t('reasonHint'), reasonBack: t('reasonBack'), expectedBack: t('expectedBack'), expectedHint: t('expectedHint'),
            retiredOn: t('retiredOn'), retiredHint: t('retiredHint'), save: t('save'), cancel: t('cancel'), note: t('note'), errors: t.raw('errors') as Record<string, string>, requiredMark: ts('requiredMark') }} />
      </section>
    </AppFrame>
  );
}
