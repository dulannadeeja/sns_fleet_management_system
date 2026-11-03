import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { getCar, TERM_FIELDS } from '../../../modules/cars/cars';
import { listActivity } from '../../../modules/activity/activity';
import { statusOf } from '../../../modules/cars/status';
import { papersOf } from '../../../modules/cars/papers';
import { todayColombo } from '../../../lib/dates';
import { showNumber } from '../../settings/business-rules/show';
import { CarPicture } from '../CarPicture';
import { statusChoices } from '../status-choices';
import { Notice, PlateBadge, StatusChip, type Lang } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import { carValues, showTerm } from '../words';
import '../cars.css';

// Screens 04.2 Car details · owner and 04.3 Car details · staff (ST-04.2). Everyone who works at SNS opens a car; the
// terms are shown to people who may see partner terms (the owner and the admin by default, DN-01). Rentals, papers,
// reservations and earnings fill in with their own tickets.
export default async function CarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; status?: string; papers?: string }> }) {
  const person = await requireEmployee();
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();
  const [t, tLog, lang, format, q, seeTerms, mayEdit, { entries }] = await Promise.all([
    getTranslations('cars'), getTranslations('settings.log'), getLocale(), getFormatter(), searchParams,
    mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editCarsAndPackages'), listActivity({ targetId: car.id, limit: 50 }),
  ]);
  // The status now and what this person may change it to (04.5, 04.7; #22).
  const [now, ts, papers, tp] = await Promise.all([statusOf(car.id), getTranslations('cars.status'), papersOf(car.id), getTranslations('cars.papers')]);
  const today = todayColombo();
  const choices = await statusChoices(person, now.status);
  const day = (d: string) => format.dateTime(new Date(`${d}T00:00:00+05:30`), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Colombo' });
  const statusLine = [now.reason, now.status === 'retired' && now.retiredOn ? ts('retiredSince', { date: day(now.retiredOn) })
    : now.since ? ts('since', { date: format.dateTime(now.since, { day: 'numeric', month: 'short', timeZone: 'Asia/Colombo' }) }) : null,
    now.expectedBack ? ts('back', { date: day(now.expectedBack) }) : null, now.byName && now.status !== 'available' ? ts('by', { name: now.byName }) : null].filter(Boolean).join(' · ');
  // The terms are for people who may see them (board 04.3 shows staff no terms): staff see no changes to them either.
  const history = seeTerms ? entries : entries.filter((e) => e.action !== 'car.change');
  const fields = TERM_FIELDS.filter((f) => f !== 'commissionPercent' || car.ownership === 'partner');
  const tc = t as unknown as (k: string, v?: Record<string, string>) => string;
  const sentence = (e: (typeof entries)[number]) => {
    const key = `actions.${e.action}`;
    return tLog.has(key as 'actions.car.add') ? tLog(key as 'actions.car.add', carValues(tc, e)) : e.action;
  };
  return (
    <AppFrame person={person} active="cars" title={t('title')} subtitle={car.registration} backHref="/cars">
      {q.saved === '1' && mayEdit ? <Notice>{t('saved')}</Notice> : null}
      {q.status === '1' ? <Notice>{ts('saved')}</Notice> : null}
      {q.papers === '1' ? <Notice>{tp('saved')}</Notice> : null}
      <section className="car-card">
        <div className="car-top">
          <CarPicture carId={car.id} model={car.model} photoId={car.photoId} size="lg" />
          <PlateBadge plate={car.registration} size="lg" lang={lang as Lang} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, lineHeight: '26px' }}>{`${car.model} · ${car.ownership === 'sns' ? t('ownerSns') : car.partnerName ? t('ownerPartnerNamed', { name: car.partnerName }) : t('ownerPartner')}`}</span>
            <StatusChip status={car.status} lang={lang as Lang} />
          </span>
          {mayEdit ? <Link className="rt-btn rt-btn-secondary" style={{ marginLeft: 'auto', textDecoration: 'none' }} href={`/cars/${car.id}/edit`}>{t('edit')}</Link> : null}
        </div>
        {now.status !== 'available' ? <span className="set-muted" data-status-line>{statusLine}</span> : null}
        {choices.length ? (
          <div className="set-actions" style={{ justifyContent: 'flex-start' }}>
            {choices.includes('available') ? (
              <Link className="rt-btn rt-btn-secondary" style={{ textDecoration: 'none' }} href={`/cars/${car.id}/status?to=available`}>{now.status === 'retired' ? ts('bringBack') : ts('markAvailable')}</Link>
            ) : null}
            {now.status !== 'retired' ? <Link className="rt-btn rt-btn-quiet" style={{ textDecoration: 'none' }} href={`/cars/${car.id}/status`}>{ts('change')}</Link> : null}
          </div>
        ) : now.status === 'repair' || now.status === 'unavailable' ? <span className="set-muted">{ts('onlyAuthorised')}</span> : null}
      </section>
      {/* Papers and service (ST-04.6): everyone at SNS sees and changes them. */}
      <section className="car-card" aria-labelledby="papers">
        <div className="car-head"><h2 id="papers">{tp('title')}</h2>
          <Link className="rt-btn rt-btn-quiet" href={`/cars/${car.id}/papers`}>{tp('change')}</Link></div>
        <dl className="car-papers">
          {(['insuranceExpires', 'licenceExpires', 'nextServiceOn'] as const).map((f) => {
            const v = papers?.[f] ?? null;
            const expired = !!v && f !== 'nextServiceOn' && v < today;
            // Whole days from today in Sri Lanka, as boards 04.2/04.3 show ("43 days left").
            const left = v && !expired ? Math.round((Date.parse(`${v}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) : null;
            return (
              <div key={f}><dt>{tp(f)}</dt>
                <dd data-paper={f} data-expired={expired ? '' : undefined}>{v ? `${tp(expired ? 'expired' : 'until', { date: day(v) })}${left !== null && f !== 'nextServiceOn' ? ` · ${tp('left', { n: left })}` : ''}` : tp('notRecorded')}</dd></div>
            );
          })}
          <div><dt>{tp('nextServiceKm')}</dt>
            <dd data-paper="nextServiceKm">{papers?.nextServiceKm != null ? tp('km', { n: showNumber(papers.nextServiceKm) }) : tp('notRecorded')}</dd></div>
        </dl>
      </section>
      {seeTerms ? (
        <section className="car-card" aria-labelledby="terms">
          <h2 id="terms">{t('termsTitle')}</h2>
          <dl className="car-terms">
            {fields.map((f) => (
              <div key={f}><dt>{t(`fields.${f}.label`)}</dt><dd data-term={f}>{showTerm(tc, f, car.terms[f])}</dd></div>
            ))}
            {car.ownership === 'partner' ? (
              <div><dt>{t('ownerPays.label')}</dt><dd data-term="ownerPays">{car.terms.ownerPays.length ? car.terms.ownerPays.map((c) => t(`costs.${c}`)).join(', ') : t('ownerPays.none')}</dd></div>
            ) : null}
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
