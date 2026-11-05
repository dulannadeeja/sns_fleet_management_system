import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../auth/require';
import { mayDo } from '../../auth/access';
import { listPartners, unlinkedPartnerCars } from '../../modules/partners/partners';
import { PlateBadge, type Lang } from '../../ui';
import { AppFrame } from '../AppFrame';
import '../cars/cars.css';
import './partners.css';

// Screen 11.1 Partner owners (ST-11.1): every partner with their cars, commission and account, and the partner cars not
// yet linked to an owner. Partner terms: people who may see them (the owner and the admin by default, DN-01).
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

export default async function PartnersPage() {
  const person = await requirePermission('seePartnerEarnings');
  const [partners, unlinked, t, lang, mayAdd] = await Promise.all([listPartners(), unlinkedPartnerCars(), getTranslations('partners'), getLocale(), mayDo(person, 'editPartners')]);
  const pct = (c: number[]) => (c.length === 0 ? '–' : c.length === 1 ? `${c[0]}%` : `${c[0]}–${c[c.length - 1]}%`);
  return (
    <AppFrame person={person} active="partners" title={t('title')} backHref="/">
      <div className="car-head">
        <h2>{t('title')}</h2>
        {mayAdd ? <Link className="rt-btn rt-btn-primary" href="/partners/new">{t('add')}</Link> : null}
      </div>
      <section className="car-list" aria-label={t('title')}>
        <div className="ptn-row ptn-row-head" aria-hidden="true"><span /><span>{t('cols.owner')}</span><span>{t('cols.cars')}</span><span>{t('cols.commission')}</span><span>{t('cols.account')}</span></div>
        {partners.length ? partners.map((p) => (
          <Link key={p.id} className="ptn-row" href={`/partners/${p.id}`} data-partner={p.name}>
            <span className="set-avatar">{initials(p.name)}</span>
            <span>{p.name}<span className="car-sub">{p.phone}</span></span>
            <span>{t('carsCount', { n: p.cars })}<span className="car-sub">{p.plates.join(', ')}</span></span>
            <span>{pct(p.commission)}</span>
            <span><span className={`set-status${p.active ? '' : ' set-status-off'}`}>{p.active ? t('active') : t('off')}</span></span>
          </Link>
        )) : <p className="set-muted" style={{ margin: 0, padding: '16px 20px' }}>{t('empty')}</p>}
      </section>
      <section className="car-card" aria-labelledby="unlinked">
        <h2 id="unlinked">{`${t('unlinkedTitle')} · ${unlinked.length}`}</h2>
        {unlinked.length ? (
          <div className="ptn-cars">
            {unlinked.map((c) => (
              <Link key={c.id} className="ptn-car" href={`/cars/${c.id}`} style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                <PlateBadge plate={c.registration} size="sm" lang={lang as Lang} /><span>{c.model}</span>
              </Link>
            ))}
          </div>
        ) : <span className="set-muted">{t('unlinkedNone')}</span>}
        <span className="set-muted">{t('unlinkedNote')}</span>
      </section>
    </AppFrame>
  );
}
