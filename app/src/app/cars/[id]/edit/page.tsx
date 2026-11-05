import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { getCar, TERM_FIELDS, type Terms } from '../../../../modules/cars/cars';
import { listActivity } from '../../../../modules/activity/activity';
import { Notice, PlateBadge, type Lang } from '../../../../ui';
import { CarPicture } from '../../CarPicture';
import { PhotoForm } from '../../PhotoForm';
import { AppFrame } from '../../../AppFrame';
import { EditCarForm } from '../../CarForms';
import { carValues, isPartnerTermEntry } from '../../words';
import { carWords } from '../../words-server';
import '../../cars.css';

const TERM_FIELDS_ONLY = (t: Terms) => Object.fromEntries(TERM_FIELDS.map((f) => [f, t[f]])) as Record<string, number | null>;

// Screen 04.4 Edit car, package and terms (ST-04.3): a change applies to new rentals only (4.3, PR-08). The catalogue
// photo is added, replaced or removed here (ST-04.7, #23); papers and service dates have their own page, open to
// everyone at SNS (/cars/[id]/papers).
export default async function EditCarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ photo?: string }> }) {
  const person = await requirePermission('editCarsAndPackages');
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();
  const [q, tp] = await Promise.all([searchParams, getTranslations('cars.photo')]);
  const [t, tLog, w, lang, format, seeCommission, editCommission, { entries }] = await Promise.all([
    getTranslations('cars'), getTranslations('settings.log'), carWords(), getLocale(), getFormatter(),
    mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editPartners'), listActivity({ targetId: car.id, limit: 50 }),
  ]);
  const tc = t as unknown as (k: string, v?: Record<string, string>) => string;
  // Partner terms never reach the browser of someone who may not see them (#18 review).
  const changes = entries.filter((e) => e.action === 'car.change' && (seeCommission || !isPartnerTermEntry(e)));
  return (
    <AppFrame person={person} active="cars" title={car.registration} subtitle={t('edit')} backHref={`/cars/${car.id}`}>
      {q.photo === 'saved' ? <Notice>{tp('saved')}</Notice> : q.photo === 'removed' ? <Notice>{tp('removed')}</Notice> : null}
      <section className="car-card"><div className="car-top">
        <CarPicture carId={car.id} model={car.model} photoId={car.photoId} size="lg" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <PlateBadge plate={car.registration} size="lg" lang={lang as Lang} />
          <span>{`${car.model} · ${car.ownership === 'sns' ? t('ownerSns') : car.partnerName ? t('ownerPartnerNamed', { name: car.partnerName }) : t('ownerPartner')}`}</span>
        </span>
      </div>
        <PhotoForm carId={car.id} hasPhoto={!!car.photoId} w={{ add: tp('add'), replace: tp('replace'), remove: tp('remove'), choose: tp('choose'), hint: tp('hint'),
          standard: tp('standard'), notCondition: tp('notCondition'), errors: tp.raw('errors') as Record<string, string> }} />
      </section>
            <div className="car-cols">
        <div>
          <EditCarForm carId={car.id} terms={{ ...TERM_FIELDS_ONLY(car.terms), commissionPercent: seeCommission ? car.terms.commissionPercent : null }}
            costs={seeCommission ? car.terms.ownerPays : []} partnerCar={car.ownership === 'partner'} seeCommission={seeCommission} editCommission={editCommission} w={w} />
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
