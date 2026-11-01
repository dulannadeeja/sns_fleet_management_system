import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../auth/require';
import { listCustomers } from '../../modules/customers/customers';
import { TextField } from '../../ui';
import { AppFrame } from '../AppFrame';
import '../cars/cars.css';
import './customers.css';

// Screen 08.1 Customers (ST-08.1): find a customer by name, NIC or phone; an expired licence comes first. Full NIC and
// phone numbers, no masking (PR-13); no ratings or scores (PR-14). Needs customer access (Proposed, 1 Nov 2026).
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const person = await requirePermission('customerAccess');
  const q = typeof (await searchParams).q === 'string' ? (await searchParams).q!.slice(0, 80) : '';
  const [rows, t, format] = await Promise.all([listCustomers(q), getTranslations('customers'), getFormatter()]);
  const day = (d: string) => format.dateTime(new Date(`${d}T00:00:00Z`), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return (
    <AppFrame person={person} active="customers" title={t('title')} backHref="/">
      <div className="car-head">
        <form className="cus-search" role="search" action="/customers">
          <TextField name="q" label={t('search')} defaultValue={q} autoComplete="off" />
          <button className="rt-btn rt-btn-secondary" type="submit">{t('searchButton')}</button>
        </form>
        <Link className="rt-btn rt-btn-primary" href="/customers/new">{t('add')}</Link>
      </div>
      <p className="set-muted" style={{ margin: 0 }}>{t('firstNote')}</p>
      <section className="car-list" aria-label={t('title')}>
        <div className="cus-row cus-row-head" aria-hidden="true"><span /><span>{t('cols.customer')}</span><span>{t('cols.nic')}</span><span>{t('cols.phone')}</span><span>{t('cols.licence')}</span><span>{t('cols.copies')}</span></div>
        {rows.length ? rows.map((c) => (
          <Link key={c.id} className="cus-row" href={`/customers/${c.id}`} data-customer={c.nic}>
            <span className="set-avatar">{initials(c.name)}</span>
            <span>{c.name}<span className="car-sub">{`${c.nic} · ${c.phone}`}</span></span>
            <span className="rt-num">{c.nic}</span>
            <span className="rt-num">{c.phone}</span>
            <span>{c.licenceExpired ? <span className="cus-tag cus-tag-bad">{t('licenceExpired', { date: day(c.licenceExpires) })}</span> : t('licenceUntil', { date: day(c.licenceExpires) })}</span>
            <span>{c.copiesMissing.length ? <span className="cus-tag cus-tag-warn">{t('copiesMissing')}</span> : <span className="cus-tag">{t('copiesIn')}</span>}</span>
          </Link>
        )) : <p className="set-muted" style={{ margin: 0, padding: '16px 20px' }}>{q ? t('empty') : t('none')}</p>}
      </section>
      {rows.length >= 100 ? <p className="set-muted" style={{ margin: 0 }}>{t('limitNote')}</p> : null}
    </AppFrame>
  );
}
