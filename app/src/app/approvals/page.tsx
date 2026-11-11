import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../auth/require';
import { mayDo } from '../../auth/access';
import { approvalsList, type ListStatus } from '../../modules/approvals/approvals';
import { rentalNumber } from '../../modules/rentals/agreements';
import { Notice } from '../../ui';
import { AppFrame } from '../AppFrame';
import { bearer } from './bearer';
import '../cars/cars.css';
import '../rentals/rentals.css';

// Screen 10.1 Approvals (ST-10.1): the requests waiting for this person, with their effect on the bill and who bears it,
// and the requester's reason word for word; approved and rejected ones too. A person never sees their own request as one
// to decide; the primary owner's own is marked self-approved (DN-01). Needs "Change agreed rental price or grant discount".
const TABS: ListStatus[] = ['waiting', 'approved', 'rejected'];


export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ status?: string; done?: string }> }) {
  const person = await requirePermission('changePriceOrDiscount');
  const sp = await searchParams;
  const status: ListStatus = TABS.includes(sp.status as ListStatus) ? (sp.status as ListStatus) : 'waiting';
  const [rows, t, format, seeTerms] = await Promise.all([approvalsList(person.id, status), getTranslations('approvals'), getFormatter(), mayDo(person, 'seePartnerEarnings')]);
  const tt = t as unknown as (k: string, v?: Record<string, string | number>) => string;
  const money = (n: number) => format.number(n);
  const signed = (n: number) => (n < 0 ? `− ${money(-n)}` : `+ ${money(n)}`);
  const when = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  return (
    <AppFrame person={person} active="approvals" title={t('title')} subtitle={t(`tabs.${status}`)} backHref="/">
      {sp.done === 'approved' ? <Notice>{t('done.approved')}</Notice> : sp.done === 'rejected' ? <Notice>{t('done.rejected')}</Notice> : null}
      <nav className="set-chips" aria-label={t('title')}>
        {TABS.map((s) => <Link key={s} className={`set-chip${s === status ? ' set-chip-on' : ''}`} href={`/approvals?status=${s}`} aria-current={s === status ? 'true' : undefined}>{t(`tabs.${s}`)}</Link>)}
      </nav>
      {rows.length === 0 ? <p className="set-muted">{t(`none.${status}`)}</p> : null}
      {rows.map((a) => (
        <section key={a.id} className="car-card" aria-labelledby={`a-${a.id}`} data-approval={a.id} data-kind={a.kind}>
          <h2 id={`a-${a.id}`}>{`${t(`kinds.${a.kind}`)} · ${signed(a.effect)}`}</h2>
          <span className="set-muted">{`${rentalNumber(a.number)} · ${a.registration} · ${a.customerName} · ${a.partner ? t('partnerCar') : t('snsCar')}`}</span>
          <dl className="ren-lines">
            <dt>{t('requestedBy')}</dt><dd>{`${a.byName} · ${when(a.createdAt)}`}</dd>
            {a.kind === 'rate' ? <><dt>{t('rate')}</dt><dd>{t('rateValue', { was: money(a.rateWas), now: money(a.newDailyRate!), days: a.days })}</dd></>
              : <><dt>{t('discount')}</dt><dd>{money(a.discount!)}</dd></>}
            <dt>{t('effect')}</dt><dd>{signed(a.effect)}</dd>
            <dt>{t('whoBears')}</dt><dd>{bearer(a, tt, seeTerms)}</dd>
            {a.aboveTheirPackage ? <><dt>{t('extra')}</dt><dd>{t('extraValue', { extra: money(a.extra), package: money(a.packageRate) })}</dd></> : null}
            {a.outcome ? <><dt>{t('decidedBy')}</dt><dd>{`${a.decidedByName ?? ''} · ${a.decidedAt ? when(a.decidedAt) : ''}${a.selfApproved ? ` · ${t('selfApproved')}` : ''}`}</dd></> : null}
            {a.partnerExtra !== null && seeTerms ? <><dt>{t('partnerGets')}</dt><dd>{money(a.partnerExtra)}</dd></> : null}
          </dl>
          <span><span style={{ fontWeight: 600 }}>{t('reason', { name: a.byName })}</span> <q data-reason>{a.reason}</q></span>
          {a.note ? <span><span style={{ fontWeight: 600 }}>{t('note')}</span> {a.note}</span> : null}
          {status === 'waiting' ? (
            <div className="set-actions" style={{ justifyContent: 'flex-start' }}>
              <Link className="rt-btn rt-btn-secondary" href={`/approvals/${a.id}?do=reject`}>{t('reject')}</Link>
              <Link className="rt-btn rt-btn-primary" href={`/approvals/${a.id}?do=approve`}>{t('approve')}</Link>
            </div>
          ) : null}
        </section>
      ))}
      {status === 'waiting' ? <p className="set-muted" style={{ margin: 0 }}>{t('confirmNote')}</p> : null}
    </AppFrame>
  );
}
