import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { getCar, TERM_FIELDS } from '../../../modules/cars/cars';
import { listActivity } from '../../../modules/activity/activity';
import { Notice, PlateBadge, StatusChip, type Lang } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import { carValues, isPartnerTermEntry, showTerm } from '../words';
import '../cars.css';

// Screens 04.2 Car details · owner and 04.3 Car details · staff (ST-04.2). Everyone who works at SNS opens a car; the
// terms are shown to people who may see partner terms (the owner and the admin by default, DN-01). Rentals, papers,
// reservations and earnings fill in with their own tickets.
export default async function CarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const person = await requireEmployee();
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();
  const [t, tLog, lang, format, q, seeTerms, mayEdit, { entries }] = await Promise.all([
    getTranslations('cars'), getTranslations('settings.log'), getLocale(), getFormatter(), searchParams,
    mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editCarsAndPackages'), listActivity({ targetId: car.id, limit: 50 }),
  ]);
  const history = seeTerms ? entries : entries.filter((e) => !isPartnerTermEntry(e));
  const fields = TERM_FIELDS.filter((f) => f !== 'commissionPercent' || car.ownership === 'partner');
  const tc = t as unknown as (k: string, v?: Record<string, string>) => string;
  const sentence = (e: (typeof entries)[number]) => {
    const key = `actions.${e.action}`;
    return tLog.has(key as 'actions.car.add') ? tLog(key as 'actions.car.add', carValues(tc, e)) : e.action;
  };
  return (
    <AppFrame person={person} active="cars" title={t('title')} subtitle={car.registration} backHref="/cars">
      {q.saved === '1' && mayEdit ? <Notice>{t('saved')}</Notice> : null}
      <section className="car-card">
        <div className="car-top">
          <PlateBadge plate={car.registration} size="lg" lang={lang as Lang} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, lineHeight: '26px' }}>{`${car.model} · ${car.ownership === 'sns' ? t('ownerSns') : t('ownerPartner')}`}</span>
            <StatusChip status={car.status} lang={lang as Lang} />
          </span>
          {mayEdit ? <Link className="rt-btn rt-btn-secondary" style={{ marginLeft: 'auto', textDecoration: 'none' }} href={`/cars/${car.id}/edit`}>{t('edit')}</Link> : null}
        </div>
      </section>
      {seeTerms ? (
        <section className="car-card" aria-labelledby="terms">
          <h2 id="terms">{t('termsTitle')}</h2>
          <dl className="car-terms">
            {fields.map((f) => (
              <div key={f}><dt>{t(`fields.${f}.label`)}</dt><dd data-term={f}>{showTerm(tc, f, car.terms[f])}</dd></div>
            ))}
          </dl>
          <span className="set-muted">{t('termsNote')}</span>
        </section>
      ) : null}
      <section className="car-card" aria-labelledby="history">
        <h2 id="history">{t('history')}</h2>
        {history.length ? (
          <ul className="car-history">
            {history.map((e) => (
              <li key={e.id}>
                <span className="set-muted">{format.dateTime(e.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' })}</span>
                <span><b>{e.actorName ?? tLog('system')}</b>{` · ${sentence(e)}`}</span>
              </li>
            ))}
          </ul>
        ) : <span className="set-muted">{t('historyEmpty')}</span>}
      </section>
    </AppFrame>
  );
}
