import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../../auth/require';
import { getPrint } from '../../../../../modules/rentals/agreements';
import { PrintButton } from './PrintButton';
import './agreement.css';

// Printouts 16.1 (Sinhala) and 16.2 (English), the rental agreement (ST-16.1). Shown exactly as it was printed: the
// business details, the rental, its terms and the approved wording kept with the printout (system design 14, Confirmed
// 8 Nov 2026). The words are in the agreement's language, not the person's. Odometer and fuel are written at handover.
export default async function AgreementPrintPage({ params }: { params: Promise<{ id: string; printId: string }> }) {
  await requirePermission('customerAccess');
  const { id, printId } = await params;
  const c = await getPrint(id, printId);
  if (!c) notFound();
  const t = await getTranslations({ locale: c.language, namespace: 'agreementDoc' });
  const locale = c.language === 'si' ? 'si-LK' : 'en-GB';
  const when = (iso: string) => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' }).format(new Date(iso));
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  return (
    <>
      <div className="agr-tools">
        <Link className="rt-btn rt-btn-quiet" href={`/rentals/${id}`}>{t('back')}</Link>
        <PrintButton label={t('print')} />
      </div>
      <article className="agr-page" lang={c.language} data-agreement={c.number}>
        <header className="agr-head">
          <div>
            <h1>{c.business.name}</h1>
            <div>{[c.business.registration ? t('reg', { reg: c.business.registration }) : null, c.business.address, c.business.phones].filter(Boolean).join(' · ')}</div>
          </div>
          <div style={{ textAlign: 'right' }}><div className="agr-no">{c.number}</div><div>{t('title')}</div><div className="agr-foot">{t('printedIn')}</div></div>
        </header>
        <section className="agr-section"><h2>{t('customer')}</h2>
          <dl className="agr-grid"><dt>{t('name')}</dt><dd>{c.customer.name}</dd><dt>{t('nic')}</dt><dd>{c.customer.nic}</dd>
            <dt>{t('phone')}</dt><dd>{c.customer.phone}</dd><dt>{t('licence')}</dt><dd>{t('licenceOnFile')}</dd></dl></section>
        <section className="agr-section"><h2>{t('car')}</h2>
          <dl className="agr-grid"><dt>{t('plate')}</dt><dd>{c.car.registration}</dd><dt>{t('model')}</dt><dd>{c.car.model}</dd>
            <dt>{t('odoOut')}</dt><dd>{t('atHandover')}</dd><dt>{t('fuelOut')}</dt><dd>{t('atHandover')}</dd></dl></section>
        <section className="agr-section"><h2>{t('dates')}</h2>
          <dl className="agr-grid">
            <dt>{t('pickup')}</dt><dd>{when(c.pickupAt)}</dd><dt>{t('backBy')}</dt><dd>{when(c.deadlineAt)}</dd>
            <dt>{t('perDay')}</dt><dd>{t('perDayValue', { rate: money(c.dailyRate), days: c.days, base: money(c.base) })}</dd>
            {c.longRental ? <><dt>{t('longRental')}</dt><dd>{t('longRentalValue', { amount: money(c.longRental) })}</dd></> : null}
            <dt>{t('km')}</dt><dd>{t('kmValue', { km: money(c.includedKm), rate: money(c.extraKmRate) })}</dd>
            <dt>{t('deposit')}</dt><dd>{c.depositWaived ? t('depositWaived') : t('depositValue', { amount: money(c.deposit ?? 0) })}</dd>
            <dt>{t('rentPaid')}</dt><dd>{c.rentPaid === 'now' ? t('rentNow') : t('rentReturn')}</dd>
            <dt>{t('fuel')}</dt><dd>{c.fuel === 'sameLevel' ? t('fuelSame') : t('fuelNotCounted')}</dd>
          </dl></section>
        <section className="agr-section"><h2>{t('conditions')}</h2><div className="agr-conditions" data-conditions>{c.conditions}</div></section>
        <div className="agr-sign"><div>{t('signature')}</div><div>{t('forSns', { name: c.printedByName })}</div></div>
        <p className="agr-foot">{t('footer', { date: when(c.printedAt), name: c.printedByName, version: c.wordingVersion })}</p>
      </article>
    </>
  );
}
