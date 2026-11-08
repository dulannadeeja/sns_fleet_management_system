import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCustomer } from '../../../../modules/customers/customers';
import { freeCarsNow } from '../../../../modules/rentals/rentals';
import { PlateBadge, type Lang } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { Step } from '../../Step';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screen 05.2 Choose a car (ST-05.2): only cars that can go out and that nothing holds now are offered (AT-20); the
// save checks again for every chosen day (AT-08, AT-30). The commission is a partner term and is not shown here.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewRentalCar({ searchParams }: { searchParams: Promise<{ customer?: string; ok?: string }> }) {
  const person = await requirePermission('customerAccess');
  const sp = await searchParams;
  const c = typeof sp.customer === 'string' && UUID.test(sp.customer) ? await getCustomer(sp.customer) : null;
  if (!c) notFound();
  const ok = typeof sp.ok === 'string' && UUID.test(sp.ok) ? sp.ok : null;
  const [t, cars, format, lang] = await Promise.all([getTranslations('rentals'), freeCarsNow(), getFormatter(), getLocale()]);
  const back = `/rentals/new?customer=${c.id}`;
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={c.name} backHref={back}>
      <Step n={2} name="car" />
      {ok ? <p className="set-muted" style={{ margin: 0 }}>{t('decided')}</p> : null}
      <div className="car-head"><h2>{t('freeCars', { n: cars.length })}</h2></div>
      <section className="car-list" aria-label={t('steps.car')}>
        {cars.length ? cars.map((car) => (
          <Link key={car.id} className="ren-car" data-car={car.registration}
            href={`/rentals/new/dates?customer=${c.id}&car=${car.id}${ok ? `&ok=${ok}` : ''}`}>
            <span><PlateBadge plate={car.registration} size="sm" lang={lang as Lang} />
              <span className="car-sub">{`${car.model} · ${t('perDay', { rate: format.number(car.terms.dailyRate) })}`}</span></span>
            <span className="rt-btn rt-btn-secondary">{t('choose')}</span>
          </Link>
        )) : <p className="set-muted" style={{ margin: 0, padding: '16px 20px' }}>{t('noCars')}</p>}
      </section>
      <div className="set-actions"><Link className="rt-btn rt-btn-quiet" href={back}>{t('steps.customer')}</Link></div>
    </AppFrame>
  );
}
