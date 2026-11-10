import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { handoverChecklist } from '../../../../modules/rentals/handover';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { Notice } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { rentalWords } from '../../words';
import { FreeCarForm, HandoverForm, PhotoForm } from './HandoverForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screen 06.4 Handover checklist (ST-06.4; system design 6 "Handover requirements" and "Handing over the car",
// Confirmed 10 Nov 2026). Each required item with what is missing and where to add it; the fuel level and the
// accessories are recorded here; money is shown, never required. Needs Customer access; the module checks it all again.
export default async function HandoverPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ photo?: string }> }) {
  const person = await requirePermission('customerAccess');
  const { id } = await params;
  const c = await handoverChecklist(id);
  if (!c) notFound();
  if (c.status !== 'draft') redirect(`/rentals/${c.rentalId}`);
  const [t, tk, w, format, mayOverride, sp] = await Promise.all([getTranslations('rentals.handover'), getTranslations('customers'), rentalWords(),
    getFormatter(), mayDo(person, 'overrideExpiredDocuments'), searchParams]);
  const money = (n: number) => format.number(n);
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const ok = (done: boolean) => <span className={done ? 'ren-ok' : 'ren-missing'} aria-hidden="true">{done ? '✓' : '✗'}</span>;
  const items: { key: string; done: boolean; label: string; note: string; href?: string; fix?: string }[] = [
    { key: 'customerCopies', done: !c.customerCopiesMissing.length, label: t('items.customerCopies'),
      note: c.customerCopiesMissing.length ? t('missingList', { list: c.customerCopiesMissing.map((k) => tk(`kinds.${k}`)).join(', ') }) : t('inPlace'),
      href: `/customers/${c.customerId}`, fix: t('fixCustomer') },
    { key: 'signedAgreement', done: !!c.signedId && !c.agreementOutOfDate, label: t('items.signedAgreement'),
      note: !c.signedId ? t('notUploaded') : c.agreementOutOfDate ? t('outOfDate') : t('inPlace'), href: `/rentals/${c.rentalId}`, fix: t('fixAgreement') },
    { key: 'reference', done: !c.referenceMissing && !c.referenceCopiesMissing.length, label: t('items.reference'),
      note: !c.referenceRequired ? t('refNotRequired') : c.referenceMissing ? t('refNotChosen')
        : c.referenceCopiesMissing.length ? t('missingList', { list: c.referenceCopiesMissing.map((k) => tk(`refKinds.${k}`)).join(', ') }) : t('inPlace'),
      href: c.referenceMissing ? `/rentals/${c.rentalId}/terms` : `/rentals/${c.rentalId}`, fix: t('fixReference') },
    { key: 'car', done: c.carStatus === 'available', label: t('items.car'), note: c.carStatus === 'available' ? t('carAvailable') : t('carNotAvailable'),
      href: `/cars/${c.vehicleId}/status`, fix: t('fixCar') },
    { key: 'accessoriesList', done: c.accessories.length > 0, label: t('items.accessoriesList'), note: c.accessories.length ? t('listCount', { n: c.accessories.length }) : t('listNone'),
      href: '/settings/business-rules', fix: t('fixList') },
  ];
  // Blocks that are not an item to fix here (10 Nov 2026): the car is out on another rental, or the return time passed.
  for (const key of ['carOut', 'deadlinePassed'] as const) if (c.missing.includes(key)) items.push({ key, done: false, label: t(`items.${key}`), note: '' });
  const done = items.filter((i) => i.done).length;
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={`${rentalNumber(c.number)} · ${c.customerName} · ${c.registration}`} backHref={`/rentals/${c.rentalId}`}>
      {sp.photo === '1' ? <Notice>{t('photoSaved')}</Notice> : null}
      {c.notCollected ? (
        <section className="car-card" aria-labelledby="h-free" data-not-collected>
          <Notice tone="warning">{t('notCollected', { when: when(c.createdAt) })}</Notice>
          <h2 id="h-free">{t('freeTitle')}</h2>
          {c.nothingPaid ? <><span className="set-muted">{t('freeNote')}</span>
            <FreeCarForm rentalId={c.rentalId} w={w.handover as unknown as Record<string, string> & { errors: Record<string, string> }} /></>
            : <span className="set-muted">{t('freePaidNote')}</span>}
        </section>
      ) : null}
      <section className="car-card" aria-labelledby="h-list" data-checklist={c.missing.join(' ') || 'ready'}>
        <h2 id="h-list">{t('checklist', { done, total: items.length })}</h2>
        <span className="set-muted">{t('backBy', { when: when(c.deadlineAt) })}</span>
        <ul className="ren-checklist">
          {items.map((i) => (
            <li key={i.key} data-item={i.key} data-done={i.done ? '1' : '0'}>
              {ok(i.done)}<span className="ren-check-text"><span style={{ fontWeight: 600 }}>{i.label}</span><span className="set-muted">{i.note}</span></span>
              {!i.done && i.href ? <Link href={i.href}>{i.fix}</Link> : null}
            </li>
          ))}
        </ul>
        {c.papers.expired ? <Notice tone="warning">{t('papersExpired', { insurance: c.papers.insuranceExpires ?? t('notEntered'), licence: c.papers.licenceExpires ?? t('notEntered') })}</Notice> : null}
      </section>
      {c.money ? (
        <section className="car-card" aria-labelledby="h-money" data-money>
          <h2 id="h-money">{t('money')}</h2>
          <dl className="ren-lines">
            <dt>{t('deposit')}</dt><dd>{c.money.depositSet === null ? t('depositWaived') : t('depositLine', { received: money(c.money.depositReceived), set: money(c.money.depositSet) })}</dd>
            <dt>{t('rent')}</dt><dd>{c.money.rentPaid === 'now' ? (c.money.unpaid > 0 ? t('rentNowUnpaid', { unpaid: money(c.money.unpaid) }) : t('rentNowPaid')) : t('rentAtReturn')}</dd>
          </dl>
          <span className="set-muted">{t('moneyNote')}</span>
          <div><Link className="rt-btn rt-btn-secondary" href={`/rentals/${c.rentalId}/pay`}>{t('recordPayment')}</Link></div>
        </section>
      ) : null}
      <section className="car-card" aria-labelledby="h-photos">
        <h2 id="h-photos">{t('photos')}</h2>
        <span className="set-muted">{t('photosNote', { n: c.photos.length })}</span>
        {c.photos.length ? <ul className="set-muted" style={{ margin: 0, paddingLeft: 18 }}>{c.photos.map((p, i) => <li key={p.id}><Link href={`/rentals/${c.rentalId}/photos/${p.id}`}>{t('photoN', { n: i + 1 })}</Link></li>)}</ul> : null}
        {c.photos.length < 10 ? <PhotoForm rentalId={c.rentalId} w={w.handover as unknown as Record<string, string> & { errors: Record<string, string> }} /> : null}
      </section>
      <HandoverForm rentalId={c.rentalId} accessories={c.accessories} lastKm={c.lastKm} blocked={c.missing.length > 0}
        papersExpired={c.papers.expired} mayOverride={mayOverride} w={w.handover as unknown as Record<string, string> & { errors: Record<string, string>; fuels: Record<string, string> }} />
    </AppFrame>
  );
}
