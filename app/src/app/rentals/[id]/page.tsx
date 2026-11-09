import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { getCar } from '../../../modules/cars/cars';
import { getCustomer } from '../../../modules/customers/customers';
import { rentalEstimate, rentalTerms } from '../../../modules/rentals/rentals';
import { rentalReadiness } from '../../../modules/rentals/terms';
import { getReference } from '../../../modules/customers/references';
import { RefCopyForm } from './reference/ReferenceForm';
import { SignedForm } from './review/PrintForm';
import { agreementState, rentalNumber } from '../../../modules/rentals/agreements';
import { rentalWords } from '../words';
import { paymentNumber, rentalMoney } from '../../../modules/money/payments';
import { Notice, PlateBadge, type Lang } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import '../../cars/cars.css';
import '../rentals.css';

// A saved rental (#51), until Rental details (06.2) comes with #58: who, which car, from when to when, the estimate from
// its own saved terms. The deposit, agreement and handover come with #54, #55 and #57. Needs Customer access.
export default async function RentalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; terms?: string; copy?: string; signed?: string; paid?: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const [c, car, est, t, format, lang] = await Promise.all([getCustomer(r.customerId), getCar(r.segments[0].vehicleId), rentalEstimate(r.id),
    getTranslations('rentals'), getFormatter(), getLocale()]);
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const money = (n: number) => format.number(n);
  const seg = r.segments[0];
  const [ready, w, tk, agr, cash] = await Promise.all([rentalReadiness(r.id), rentalWords(), getTranslations('customers'), agreementState(r.id), rentalMoney(r.id)]);
  const ref = ready?.referencePersonId ? await getReference(ready.referencePersonId) : null;
  const sp = await searchParams;
  const refW = { ...(w.reference as unknown as Record<string, string>) } as unknown as Record<string, string> & { errors: Record<string, string>; relationships: Record<string, string> };
  return (
    <AppFrame person={person} active="rentals" title={t('rental')} subtitle={c?.name} backHref="/rentals/new">
      {sp.terms === '1' ? <Notice>{t('terms.termsSaved')}</Notice> : null}
      {sp.signed === '1' ? <Notice>{t('signed.saved')}</Notice> : null}
      {typeof sp.paid === 'string' && /^P-\d{4,}(,P-\d{4,})*$/.test(sp.paid) ? <Notice>{t('pay.saved', { numbers: sp.paid.replace(/,/g, ', ') })}</Notice> : null}
      {sp.saved === '1' ? <Notice>{t('saved', { plate: car?.registration ?? '', deadline: when(r.deadlineAt) })}</Notice> : null}
      <section className="car-card" aria-labelledby="r-h" data-rental={r.id}>
        <h2 id="r-h">{`${t('rental')} ${rentalNumber(r.number)}`}</h2>
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
      <section className="car-card" aria-labelledby="t-h" data-terms={ready?.termsSet ? 'set' : 'missing'}>
        <h2 id="t-h">{t('steps.terms')}</h2>
        {ready?.termsSet ? (
          <dl className="ren-lines">
            <dt>{t('terms.deposit')}</dt><dd data-deposit>{ready.waivedReason ? t('terms.depositWaived', { reason: ready.waivedReason }) : t('terms.depositAmount', { amount: money(ready.deposit ?? 0) })}</dd>
            <dt>{t('terms.rentPaid')}</dt><dd>{ready.rentPaid === 'now' ? t('terms.rentNow') : t('terms.rentReturn')}</dd>
            <dt>{t('terms.fuel')}</dt><dd>{ready.fuel === 'sameLevel' ? t('terms.fuelSame') : t('terms.fuelNotCounted')}</dd>
            <dt>{t('terms.reference')}</dt><dd>{ready.referenceRequired ? (ref ? `${ref.name} · NIC ${ref.nic}` : t('terms.refMissing')) : t('terms.refNo')}</dd>
          </dl>
        ) : <Notice tone="warning">{t('terms.notSet')}</Notice>}
        {ref && ref.copiesMissing.length ? (
          <div className="cus-copies" data-ref-missing={ref.copiesMissing.join(' ')}>
            <Notice tone="warning">{t('terms.refCopiesMissing', { list: ref.copiesMissing.map((k) => tk(`refKinds.${k}`)).join(', ') })}</Notice>
            {ref.copiesMissing.map((k) => (
              <label key={k} className="cus-copy"><span style={{ fontWeight: 600 }}>{tk(`refKinds.${k}`)}</span>
                <RefCopyForm rentalId={r.id} referenceId={ref.id} kind={k} label={tk(`refKinds.${k}`)} w={refW} /></label>
            ))}
          </div>
        ) : null}
        {ref && ref.documents.length ? (
          <ul className="set-muted" style={{ margin: 0, paddingLeft: 18 }}>
            {ref.documents.map((d) => <li key={d.id}><Link href={`/customers/${ref.customerId}/references/${ref.id}/copies/${d.id}`}>{tk(`refKinds.${d.kind}`)}</Link></li>)}
          </ul>
        ) : null}
        {r.status === 'draft' ? <div><Link className="rt-btn rt-btn-secondary" href={`/rentals/${r.id}/terms`}>{t('terms.edit')}</Link></div> : null}
      </section>
      <section className="car-card" aria-labelledby="a-h" data-agreement={!agr?.printed ? 'none' : agr.outOfDate ? 'outOfDate' : agr.signedId ? 'signed' : 'printed'}>
        <h2 id="a-h">{t('signed.title')}</h2>
        {!agr?.printed ? <span className="set-muted">{t('signed.none')}</span>
          : agr.outOfDate ? <Notice tone="warning">{t('signed.outOfDate')}</Notice>
            : agr.signedAt ? <Notice>{t('signed.uploaded', { date: when(agr.signedAt) })}</Notice>
              : <Notice tone="warning">{t('signed.printed')}</Notice>}
        {agr?.signedId ? <div><Link href={`/rentals/${r.id}/signed/${agr.signedId}`}>{t('signed.open')}</Link></div> : null}
        {agr?.printed && r.status === 'draft' ? <SignedForm rentalId={r.id} w={w.signed as unknown as Record<string, string> & { errors: Record<string, string> }} /> : null}
        {r.status === 'draft' ? <div><Link className="rt-btn rt-btn-secondary" href={`/rentals/${r.id}/review`}>{agr?.printed ? t('signed.reprint') : t('signed.review')}</Link></div> : null}
      </section>
      {cash ? (
        <section className="car-card" aria-labelledby="m-h" data-paid={cash.paid} data-deposit-received={cash.depositReceived}>
          <h2 id="m-h">{t('pay.money')}</h2>
          <dl className="ren-lines">
            <dt>{t('pay.paidSoFar')}</dt><dd>{t('pay.lkr', { amount: money(cash.paid) })}</dd>
            <dt>{t('pay.unpaid')}</dt><dd>{t('pay.lkr', { amount: money(cash.unpaid) })}</dd>
            {cash.depositSet !== null ? <><dt>{t('pay.depositReceived')}</dt><dd>{`${t('pay.lkr', { amount: money(cash.depositReceived) })} / ${money(cash.depositSet)}`}</dd></> : null}
          </dl>
          {cash.payments.length ? (
            <ul className="set-muted" style={{ margin: 0, paddingLeft: 18 }}>
              {cash.payments.map((p) => (
                <li key={`${p.id}-${p.for}`} data-payment={paymentNumber(p.number)}>
                  {t('pay.line', { number: paymentNumber(p.number), for: p.for === 'deposit' ? t('pay.lineDeposit') : t('pay.lineBill'), method: t(`pay.methods.${p.method}`), amount: money(p.amount) })}
                  {p.reference ? ` · ${t('pay.lineRef', { reference: p.reference })}` : ''}
                  {` · ${t('pay.by', { name: p.createdByName, date: when(p.createdAt) })}`}
                  {p.check ? ` · ${t(p.check === 'waiting' ? 'pay.checkWaiting' : p.check === 'matched' ? 'pay.checkMatched' : 'pay.checkFlagged')}` : ''}
                </li>
              ))}
            </ul>
          ) : <span className="set-muted">{t('pay.none')}</span>}
          {r.status === 'draft' ? <div><Link className="rt-btn rt-btn-secondary" href={`/rentals/${r.id}/pay`}>{t('pay.record')}</Link></div> : null}
        </section>
      ) : null}
      <p className="set-muted" style={{ margin: 0 }}>{t('nextSteps')}</p>
    </AppFrame>
  );
}
