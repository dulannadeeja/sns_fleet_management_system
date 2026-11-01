import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../auth/require';
import { mayDo } from '../../auth/access';
import { listCars } from '../../modules/cars/cars';
import { PlateBadge, StatusChip, type Lang } from '../../ui';
import { AppFrame } from '../AppFrame';
import { showNumber } from '../settings/business-rules/show';
import './cars.css';

// Screen 04.1 All cars (ST-04.1): everyone who works at SNS sees every car with its owner, package and status.
const OWNERS = ['sns', 'partner'] as const;

export default async function CarsPage({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
  const person = await requireEmployee();
  const [cars, t, lang, q] = await Promise.all([listCars(), getTranslations('cars'), getLocale(), searchParams]);
  const owner = OWNERS.find((o) => o === q.owner);
  const shown = owner ? cars.filter((c) => c.ownership === owner) : cars;
  const count = (o?: string) => (o ? cars.filter((c) => c.ownership === o).length : cars.length);
  const chip = (o: (typeof OWNERS)[number] | undefined, label: string) => (
    <Link className={`set-chip${owner === o ? ' set-chip-on' : ''}`} href={o ? `/cars?owner=${o}` : '/cars'} aria-current={owner === o ? 'true' : undefined}>{`${label} ${count(o)}`}</Link>
  );
  return (
    <AppFrame person={person} active="cars" title={t('title')} backHref="/">
      <div className="car-head">
        <nav className="set-chips" aria-label={t('cols.owner')}>{chip(undefined, t('all'))}{chip('sns', t('sns'))}{chip('partner', t('partner'))}</nav>
        {(await mayDo(person, 'editCarsAndPackages')) ? <Link className="rt-btn rt-btn-primary" href="/cars/new">{t('add')}</Link> : null}
      </div>
      <section className="car-list" aria-label={t('title')}>
        <div className="car-row car-row-head" aria-hidden="true">
          <span>{t('cols.car')}</span><span>{t('cols.owner')}</span><span className="car-num">{t('cols.perDay')}</span>
          <span className="car-num">{t('cols.kmDay')}</span><span className="car-num">{t('cols.extraKm')}</span><span>{t('cols.status')}</span>
        </div>
        {shown.length ? shown.map((c) => (
          <Link key={c.id} className="car-row" href={`/cars/${c.id}`} data-plate={c.registration}>
            <span><PlateBadge plate={c.registration} size="sm" lang={lang as Lang} /><span className="car-sub">{c.model}</span></span>
            <span>{c.ownership === 'sns' ? t('ownerSns') : c.partnerName ? t('ownerPartnerNamed', { name: c.partnerName }) : t('ownerPartner')}</span>
            <span className="car-num">{showNumber(c.terms.dailyRate)}</span>
            <span className="car-num">{showNumber(c.terms.kmPerDay)}</span>
            <span className="car-num">{showNumber(c.terms.extraKmRate)}</span>
            <span className="car-price">{`${t('cols.perDay')} ${showNumber(c.terms.dailyRate)} · ${t('cols.kmDay')} ${showNumber(c.terms.kmPerDay)} · ${t('cols.extraKm')} ${showNumber(c.terms.extraKmRate)}`}</span>
            <span><StatusChip status={c.status} size="sm" lang={lang as Lang} /></span>
          </Link>
        )) : <p className="set-muted" style={{ margin: 0, padding: '16px 20px' }}>{t('empty')}</p>}
      </section>
      <p className="set-muted" style={{ margin: 0 }}>{t('listNote')}</p>
    </AppFrame>
  );
}
