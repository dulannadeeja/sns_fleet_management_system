import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { getCustomer, listCustomers } from '../../../modules/customers/customers';
import { warningsFor } from '../../../modules/customers/flags';
import { isFirstRental } from '../../../modules/rentals/rentals';
import { Notice, TextField } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import { GoAheadForm } from '../../customers/FlagForms';
import { flagWords } from '../../customers/words';
import { Step } from '../Step';
import '../../cars/cars.css';
import '../../customers/customers.css';
import '../rentals.css';

// Screen 05.1 Customer and warnings (ST-05.1). A rental starts from the customer: found here, or added on 08.3 first.
// Open flags and an expired licence warn; staff go on only with a decision to continue for exactly those warnings
// (ST-08.4), which then belongs to this rental (system design 7.1, Confirmed 8 Nov 2026). A first rental needs
// "Approve a first-time customer": saving it is the approval. Needs Customer access. Unpaid debts warn here too once
// bills exist (#63; AT-55).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewRentalCustomer({ searchParams }: { searchParams: Promise<{ q?: string; customer?: string }> }) {
  const person = await requirePermission('customerAccess');
  const sp = await searchParams;
  const t = await getTranslations('rentals');
  const tc = await getTranslations('customers');
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 80) : '';
  const c = typeof sp.customer === 'string' && UUID.test(sp.customer) ? await getCustomer(sp.customer) : null;

  if (!c) {
    const rows = q ? await listCustomers(q) : [];
    return (
      <AppFrame person={person} active="rentals" title={t('title')} backHref="/">
        <Step n={1} name="customer" />
        <section className="car-card" aria-labelledby="find">
          <h2 id="find">{t('find')}</h2>
          <form className="cus-search" role="search" action="/rentals/new">
            <TextField name="q" label={t('search')} defaultValue={q} autoComplete="off" />
            <button className="rt-btn rt-btn-secondary" type="submit">{t('search')}</button>
          </form>
          {q ? (
            rows.length ? (
              <div className="car-list">
                {rows.map((r) => (
                  <Link key={r.id} className="ren-car" href={`/rentals/new?customer=${r.id}`} data-customer={r.nic}>
                    <span>{r.name}<span className="car-sub">{`NIC ${r.nic} · ${r.phone}`}</span></span>
                    <span className="rt-btn rt-btn-secondary">{t('choose')}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="set-muted" style={{ margin: 0 }}>{t('noMatch')}</p>
          ) : null}
          <div><Link className="rt-btn rt-btn-quiet" href="/customers/new">{t('addCustomer')}</Link></div>
        </section>
      </AppFrame>
    );
  }

  const [warnings, w, first, mayFirst, mayFlag, mayLicence] = await Promise.all([warningsFor(c.id), flagWords(), isFirstRental(c.id),
    mayDo(person, 'approveFirstCustomer'), mayDo(person, 'proceedDespiteFlag'), mayDo(person, 'overrideExpiredDocuments')]);
  const { openFlags, licenceExpired } = warnings!;
  const hasWarnings = openFlags.length > 0 || licenceExpired;
  const blockedFirst = first && !mayFirst;
  const mayContinue = !blockedFirst && (!openFlags.length || mayFlag) && (!licenceExpired || mayLicence);
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={c.name} backHref="/rentals/new">
      <Step n={1} name="customer" />
      <section className="car-card" aria-labelledby="who">
        <div className="ren-who">
          <span><b id="who">{c.name}</b><span className="car-sub">{`NIC ${c.nic} · ${c.phone}`}</span></span>
          <Link className="rt-btn rt-btn-quiet" href="/rentals/new">{t('change')}</Link>
        </div>
        {first ? <Notice tone={blockedFirst ? 'danger' : 'info'}>{blockedFirst ? t('firstNotAllowed') : t('firstRental')}</Notice> : null}
        {!hasWarnings ? <Notice>{t('noWarnings')}</Notice> : null}
        {openFlags.map((f) => (
          <div key={f.id} className="cus-warning" data-flag={f.kind}>
            <Notice tone="warning">{`${tc('flags.flagWarn', { kind: tc(`flags.kinds.${f.kind}`) })} · ${f.details}`}</Notice>
          </div>
        ))}
        {licenceExpired ? <div className="cus-warning" data-licence="expired"><Notice tone="warning">{tc('flags.licenceWarn', { date: c.licenceExpires })}</Notice></div> : null}
        {hasWarnings ? (
          <GoAheadForm customerId={c.id} flagIds={openFlags.map((f) => f.id)} licenceExpired={licenceExpired} mayContinue={mayContinue} w={w} forRental />
        ) : (
          <div className="set-actions">
            <Link className="rt-btn rt-btn-quiet" href="/rentals/new">{t('cancel')}</Link>
            {blockedFirst ? null : <Link className="rt-btn rt-btn-primary" href={`/rentals/new/car?customer=${c.id}`}>{t('continue')}</Link>}
          </div>
        )}
      </section>
    </AppFrame>
  );
}
