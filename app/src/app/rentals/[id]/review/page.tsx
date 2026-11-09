import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCar } from '../../../../modules/cars/cars';
import { getCustomer } from '../../../../modules/customers/customers';
import { getReference } from '../../../../modules/customers/references';
import { rentalEstimate, rentalTerms } from '../../../../modules/rentals/rentals';
import { rentalReadiness } from '../../../../modules/rentals/terms';
import { currentWording, rentalNumber } from '../../../../modules/rentals/agreements';
import { readSettings } from '../../../../modules/settings/settings';
import { Notice, PlateBadge, type Lang } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { Step } from '../../Step';
import { rentalWords } from '../../words';
import { PrintForm } from './PrintForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screen 05.5 Review and print (ST-05.6): everything agreed, the language, and "Save and print agreement" (16.1 or
// 16.2). Printing needs step 4, an approved agreement wording and the business details (system design 14, Confirmed
// 8 Nov 2026). Needs Customer access.
export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ terms?: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const [c, car, est, ready, wording, settings, t, w, format, lang, sp] = await Promise.all([getCustomer(r.customerId), getCar(r.segments[0].vehicleId), rentalEstimate(r.id),
    rentalReadiness(r.id), currentWording(), readSettings(), getTranslations('rentals'), rentalWords(), getFormatter(), getLocale(), searchParams]);
  const ref = ready?.referencePersonId ? await getReference(ready.referencePersonId) : null;
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const money = (n: number) => format.number(n);
  const seg = r.segments[0];
  const businessSet = !!(settings.businessName && settings.businessRegistration && settings.businessAddress && settings.businessPhones);
  const blocked = r.status !== 'draft' ? t('review.errors.notDraft') : !ready?.termsSet ? t('review.termsFirst') : !wording ? t('review.noWording') : !businessSet ? t('review.noBusiness') : null;
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={`${c?.name ?? ''} · ${car?.registration ?? ''}`} backHref={`/rentals/${r.id}/terms`}>
      <Step n={5} name="review" />
      {sp.terms === '1' ? <Notice>{t('terms.termsSaved')}</Notice> : null}
      <section className="car-card" aria-labelledby="rv-h" data-number={rentalNumber(r.number)}>
        <h2 id="rv-h">{`${rentalNumber(r.number)}`}</h2>
        {car ? <span><PlateBadge plate={car.registration} size="sm" lang={lang as Lang} /><span className="car-sub">{car.model}</span></span> : null}
        <dl className="ren-lines">
          <dt>{t('customer')}</dt><dd>{c?.name}</dd>
          <dt>{t('pickup')}</dt><dd>{when(r.pickupAt)}</dd>
          <dt>{t('backBy')}</dt><dd>{when(r.deadlineAt)}</dd>
          {est ? <><dt>{t('review.rent')}</dt><dd>{t('review.rentValue', { days: est.days, rate: money(seg.dailyRate), base: money(est.base) })}</dd></> : null}
          {est?.longRental ? <><dt>{t('longRental')}</dt><dd>{money(est.longRental)}</dd></> : null}
          {est ? <><dt>{t('review.included')}</dt><dd>{t('review.includedValue', { km: money(est.includedKm), rate: money(seg.extraKmRate) })}</dd></> : null}
          {ready?.termsSet ? (
            <>
              <dt>{t('review.deposit')}</dt><dd>{ready.waivedReason ? t('review.waived') : t('review.depositValue', { amount: money(ready.deposit ?? 0) })}</dd>
              <dt>{t('terms.rentPaid')}</dt><dd>{ready.rentPaid === 'now' ? t('terms.rentNow') : t('terms.rentReturn')}</dd>
              <dt>{t('terms.fuel')}</dt><dd>{ready.fuel === 'sameLevel' ? t('terms.fuelSame') : t('terms.fuelNotCounted')}</dd>
              <dt>{t('terms.reference')}</dt><dd>{ready.referenceRequired ? (ref ? ref.name : t('terms.refMissing')) : t('terms.refNo')}</dd>
            </>
          ) : null}
        </dl>
      </section>
      <section className="car-card" aria-labelledby="next-h">
        <h2 id="next-h">{t('review.next')}</h2>
        <span className="set-muted">{t('review.steps')}</span>
        {car ? <span className="set-muted">{t('review.held', { plate: car.registration })}</span> : null}
        {blocked ? <Notice tone="warning">{blocked}</Notice> : null}
        <PrintForm rentalId={r.id} defaultLanguage={lang} disabled={!!blocked} w={w.review as unknown as Record<string, string> & { errors: Record<string, string> }} />
      </section>
    </AppFrame>
  );
}
