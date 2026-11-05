import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { listPackages, readDefaults, DEFAULT_FIELDS } from '../../../modules/cars/packages';
import { Notice } from '../../../ui';
import { showNumber } from '../business-rules/show';
import { SettingsFrame } from '../SettingsFrame';
import '../../cars/cars.css';

// Screen 04.6 Starting packages (ST-04.4; system design 4.1, 4.2; Confirmed 5 Nov 2026: everyone who works at
// SNS reads it (partners are refused); the Change buttons only for people who may add or edit cars and packages (the
// admin by default); the commission default only for those who see partner terms.
export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const person = await requireEmployee();
  const [packages, defaults, t, p, q, seeCommission] = await Promise.all([
    listPackages(), readDefaults(), getTranslations('cars'), getTranslations('cars.packages'), searchParams, mayDo(person, 'seePartnerEarnings')]);
  const edit = await mayDo(person, 'editCarsAndPackages');
  const fields = DEFAULT_FIELDS.filter((f) => f !== 'commissionPercent' || seeCommission);
  return (
    <SettingsFrame person={person} active="packages" subtitle={p('title')} backHref="/settings/business-rules">
      {q.saved === '1' && edit ? <Notice>{p('saved')}</Notice> : null}
      <section className="car-list" aria-labelledby="pkg-title">
        <div className="car-head" style={{ padding: '14px 20px' }}>
          <h2 id="pkg-title">{p('title')}</h2><span className="set-muted" style={{ marginLeft: 'auto' }}>{p('lkr')}</span>
        </div>
        <div className="car-row car-row-head pkg-row" aria-hidden="true">
          <span>{p('name')}</span><span className="car-num">{t('fields.dailyRate.label')}</span><span className="car-num">{t('fields.kmPerDay.label')}</span>
          <span className="car-num">{t('fields.extraKmRate.label')}</span><span className="car-num">{p('cars')}</span><span />
        </div>
        {packages.map((pkg) => (
          <div key={pkg.id} className="car-row pkg-row" data-package={pkg.name}>
            <span><b>{pkg.name}</b><span className="car-sub">{pkg.models.join(', ')}</span></span>
            <span className="car-num car-price">{showNumber(pkg.dailyRate)}<span className="pkg-phone">{` · ${t('fields.kmPerDay.show', { n: showNumber(pkg.kmPerDay) })} · ${t('fields.extraKmRate.show', { n: showNumber(pkg.extraKmRate) })}`}</span></span>
            <span className="car-num">{showNumber(pkg.kmPerDay)}</span><span className="car-num">{showNumber(pkg.extraKmRate)}</span>
            <span className="car-num">{pkg.cars}</span>
            {edit ? <Link className="rt-btn rt-btn-quiet" href={`/settings/packages/${pkg.id}`} aria-label={`${p('change')}: ${pkg.name}`}>{p('change')}</Link> : <span />}
          </div>
        ))}
      </section>
      <section className="car-card" aria-labelledby="pkg-defaults">
        <h2 id="pkg-defaults">{p('defaults')}</h2>
        <dl className="car-terms">
          {fields.map((f) => <div key={f}><dt>{t(`fields.${f}.label`)}</dt><dd>{t(`fields.${f}.show`, { n: showNumber(defaults[f]) })}</dd></div>)}
        </dl>
      </section>
      {edit ? (
        <div className="set-actions" style={{ justifyContent: 'flex-start' }}>
          <Link className="rt-btn rt-btn-secondary" href="/settings/packages/new">{p('add')}</Link>
          <Link className="rt-btn rt-btn-quiet" href="/settings/packages/defaults">{p('changeDefaults')}</Link>
        </div>
      ) : null}
      <p className="set-muted" style={{ margin: 0 }}>{p('note')}</p>
    </SettingsFrame>
  );
}
