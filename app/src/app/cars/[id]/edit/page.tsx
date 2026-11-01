import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { getCar } from '../../../../modules/cars/cars';
import { listActivity } from '../../../../modules/activity/activity';
import { Notice, PlateBadge, type Lang } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { EditCarForm } from '../../CarForms';
import { carValues, isPartnerTermEntry } from '../../words';
import { carWords } from '../../words-server';
import '../../cars.css';

// Screen 04.4 Edit car, package and terms (ST-04.3): a change applies to new rentals only (4.3, PR-08). Papers, service
// dates and the photo come with #23; who pays which costs with #20.
export default async function EditCarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const person = await requirePermission('editCarsAndPackages');
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();
  const [t, tLog, w, lang, format, q, seeCommission, editCommission, { entries }] = await Promise.all([
    getTranslations('cars'), getTranslations('settings.log'), carWords(), getLocale(), getFormatter(), searchParams,
    mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editPartners'), listActivity({ targetId: car.id, limit: 50 }),
  ]);
  const tc = t as unknown as (k: string, v?: Record<string, string>) => string;
  const changes = entries.filter((e) => e.action === 'car.change' && (seeCommission || !isPartnerTermEntry(e)));
  return (
    <AppFrame person={person} active="cars" title={car.registration} subtitle={t('edit')} backHref={`/cars/${car.id}`}>
      <section className="car-card"><div className="car-top">
        <PlateBadge plate={car.registration} size="lg" lang={lang as Lang} />
        <span>{`${car.model} · ${car.ownership === 'sns' ? t('ownerSns') : t('ownerPartner')}`}</span>
      </div></section>
      {q.from === 'new' ? <Notice tone="warning">{t('added')} {t('errors.invalid')}</Notice> : null}
      <div className="car-cols">
        <div>
          <EditCarForm carId={car.id} terms={{ ...car.terms }} partnerCar={car.ownership === 'partner'} seeCommission={seeCommission} editCommission={editCommission} w={w} />
        </div>
        <div>
          <section className="car-card" aria-labelledby="changes"><h2 id="changes">{t('changes')}</h2>
            {changes.length ? (
              <ul className="car-history">
                {changes.map((e) => (
                  <li key={e.id}>
                    <span className="set-muted">{format.dateTime(e.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' })}</span>
                    <span><b>{e.actorName ?? tLog('system')}</b>{` · ${tLog('actions.car.change', carValues(tc, e))}`}</span>
                  </li>
                ))}
              </ul>
            ) : <span className="set-muted">{t('changesEmpty')}</span>}
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
