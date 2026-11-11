import { notFound } from 'next/navigation';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { getCustomer } from '../../../../modules/customers/customers';
import { warningsFor } from '../../../../modules/customers/flags';
import { Notice } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { GoAheadForm } from '../../FlagForms';
import { flagWords } from '../../words';
import '../../../cars/cars.css';
import '../../customers.css';

// Screen 08.4 Flag and expired licence warning (ST-08.4). Until New rental exists (Phase 2), it opens from the
// customer's page and records a decision to continue (Confirmed 5 Nov 2026). A flag needs "Go ahead despite a
// customer flag"; an expired licence needs "Override expired-document warnings"; the licence stays expired.
export default async function CheckPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const c = await getCustomer((await params).id);
  if (!c) notFound();
  const [t, w, format, warnings, mayFlag, mayLicence] = await Promise.all([getTranslations('customers'), flagWords(), getFormatter(), warningsFor(c.id),
    mayDo(person, 'proceedDespiteFlag'), mayDo(person, 'overrideExpiredDocuments')]);
  const day = (d: string) => format.dateTime(new Date(`${d}T00:00:00Z`), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const { openFlags, licenceExpired, debt } = warnings!;
  const mayContinue = (!openFlags.length || mayFlag) && (!debt.total || mayFlag) && (!licenceExpired || mayLicence);
  const any = openFlags.length > 0 || licenceExpired || debt.total > 0;
  return (
    <AppFrame person={person} active="customers" title={t('title')} subtitle={c.name} backHref={`/customers/${c.id}`}>
      <section className="car-card" aria-labelledby="check">
        <h2 id="check">{t('flags.checkTitle')}</h2>
        <b>{c.name}</b>
        {!any ? <Notice>{t('flags.checkNone')}</Notice> : null}
        {openFlags.map((f) => (
          <div key={f.id} className="cus-warning" data-flag={f.kind}>
            <Notice tone="warning">{`${t('flags.flagWarn', { kind: t(`flags.kinds.${f.kind}`) })} · ${f.details}`}</Notice>
            <span className="set-muted">{t('flags.flagNote')}</span>
          </div>
        ))}
        {licenceExpired ? (
          <div className="cus-warning" data-licence="expired">
            <Notice tone="warning">{t('flags.licenceWarn', { date: day(c.licenceExpires) })}</Notice>
            <span className="set-muted">{t('flags.licenceNote')}</span>
          </div>
        ) : null}
        {debt.total ? (
          <div className="cus-warning" data-debt={debt.total}>
            <Notice tone="warning">{t('flags.debtWarn', { amount: format.number(debt.total) })}</Notice>
            <span className="set-muted">{t('flags.debtList', { list: debt.rentals.map((d) => `${rentalNumber(d.number)} · ${format.number(d.unpaid)}`).join(', ') })}</span>
          </div>
        ) : null}
        {any ? (
          <GoAheadForm customerId={c.id} flagIds={openFlags.map((f) => f.id)} licenceExpired={licenceExpired} debt={debt.total} mayContinue={mayContinue} w={w} />
        ) : null}
        {any && !mayContinue ? <span className="set-muted" role="note">{t('flags.errors.' + (licenceExpired && !mayLicence ? 'licenceNotAllowed' : 'notAllowed') as 'flags.errors.notAllowed')}</span> : null}
      </section>
    </AppFrame>
  );
}
