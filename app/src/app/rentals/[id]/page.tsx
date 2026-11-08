import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { getCar } from '../../../modules/cars/cars';
import { getCustomer } from '../../../modules/customers/customers';
import { rentalEstimate, rentalTerms } from '../../../modules/rentals/rentals';
import { Notice, PlateBadge, type Lang } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import '../../cars/cars.css';
import '../rentals.css';

// A saved rental (#51), until Rental details (06.2) comes with #58: who, which car, from when to when, the estimate from
// its own saved terms. The deposit, agreement and handover come with #54, #55 and #57. Needs Customer access.
export default async function RentalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const [c, car, est, t, format, lang] = await Promise.all([getCustomer(r.customerId), getCar(r.segments[0].vehicleId), rentalEstimate(r.id),
    getTranslations('rentals'), getFormatter(), getLocale()]);
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const money = (n: number) => format.number(n);
  const seg = r.segments[0];
  return (
    <AppFrame person={person} active="rentals" title={t('rental')} subtitle={c?.name} backHref="/rentals/new">
      {(await searchParams).saved === '1' ? <Notice>{t('saved', { plate: car?.registration ?? '', deadline: when(r.deadlineAt) })}</Notice> : null}
      <section className="car-card" aria-labelledby="r-h" data-rental={r.id}>
        <h2 id="r-h">{t('rental')}</h2>
        <dl className="ren-lines">
          <dt>{t('customer')}</dt><dd>{c ? <Link href={`/customers/${c.id}`}>{c.name}</Link> : null}</dd>
          <dt>{t('car')}</dt><dd>{car ? <PlateBadge plate={car.registration} size="sm" lang={lang as Lang} /> : null}</dd>
          <dt>{t('pickup')}</dt><dd>{when(r.pickupAt)}</dd>
          <dt>{t('backBy')}</dt><dd>{when(r.deadlineAt)}</dd>
          <dt>{t('status')}</dt><dd>{t('statusDraft')}</dd>
        </dl>
      </section>
      {est ? (
        <section className="car-card" aria-labelledby="e-h">
          <h2 id="e-h">{t('estimate')}</h2>
          <dl className="ren-lines" data-estimate={est.total}>
            <dt>{t('base', { days: est.days, rate: money(seg.dailyRate) })}</dt><dd>{money(est.base)}</dd>
            {est.longRental ? <><dt>{t('longRental')}</dt><dd>{money(est.longRental)}</dd></> : null}
            <dt>{t('includedKm')}</dt><dd>{t('kmValue', { km: money(est.includedKm) })}</dd>
            <dt>{t('extraKm')}</dt><dd>{t('extraKmValue', { rate: money(seg.extraKmRate) })}</dd>
            <dt className="ren-total">{t('total')}</dt><dd className="ren-total">{t('totalValue', { total: money(est.total) })}</dd>
          </dl>
        </section>
      ) : null}
      <p className="set-muted" style={{ margin: 0 }}>{t('nextSteps')}</p>
    </AppFrame>
  );
}
