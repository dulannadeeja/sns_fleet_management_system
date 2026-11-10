import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { COPY_KINDS, getCustomer } from '../../../modules/customers/customers';
import { listActivity } from '../../../modules/activity/activity';
import { flagsOf, goAheadsOf } from '../../../modules/customers/flags';
import { CloseFlagForm } from '../FlagForms';
import { Notice } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import { AddCopyForm } from '../CustomerForms';
import { customerWords, flagWords } from '../words';
import '../../cars/cars.css';
import '../customers.css';

// Screen 08.2 Customer details (ST-08.3): details, warnings, document copies and what happened. Full NIC and phone, no
// masking (PR-13). Flags and the check before a rental (#24); debts and rentals (Phase 2) fill in later. Needs customer access.
export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; existing?: string; copy?: string; nic?: string; flag?: string }> }) {
  const person = await requirePermission('customerAccess');
  const c = await getCustomer((await params).id);
  if (!c) notFound();
  const [t, tLog, w, format, q, { entries }] = await Promise.all([getTranslations('customers'), getTranslations('settings.log'), customerWords(), getFormatter(), searchParams, listActivity({ targetId: c.id, limit: 50 })]);
  const [flags, decisions, fw] = await Promise.all([flagsOf(c.id), goAheadsOf(c.id), flagWords()]);
  const open = flags.filter((f) => !f.closedAt);
  const when = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const day = (d: string) => format.dateTime(new Date(`${d}T00:00:00Z`), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const tc = t as unknown as { has: (k: string) => boolean; (k: string): string };
  const sentence = (e: (typeof entries)[number]) => {
    const key = `actions.${e.action}`;
    if (!tLog.has(key as 'actions.customer.add')) return e.action;
    const field = String(e.details?.field ?? '');
    const kind = String(e.details?.kind ?? '');
    return tLog(key as 'actions.customer.add', {
      target: String(e.details?.name ?? c.name), field: tc.has(`fieldNames.${field}`) ? tc(`fieldNames.${field}`) : field,
      copy: tc.has(`kinds.${kind}`) ? tc(`kinds.${kind}`) : kind, old: String(e.details?.old ?? ''), new: String(e.details?.new ?? ''),
      kind: tc.has(`flags.kinds.${kind}`) ? tc(`flags.kinds.${kind}`) : kind, details: String(e.details?.details ?? ''), reason: String(e.details?.reason ?? ''),
      // customer.reference*: the reference person's name (#54; missing until #57 review).
      reference: String(e.details?.reference ?? ''),
    });
  };
  return (
    <AppFrame person={person} active="customers" title={t('title')} subtitle={c.name} backHref="/customers">
      {q.existing === '1' ? <Notice>{t('existing')}</Notice> : null}
      {q.saved === '1' ? <Notice>{t('saved')}</Notice> : null}
      {q.copy === '1' ? <Notice>{t('copyAdded')}</Notice> : null}
      {q.nic === '1' ? <Notice>{t('nicFixed')}</Notice> : null}
      {q.flag === 'added' ? <Notice>{t('flags.added')}</Notice> : q.flag === 'closed' ? <Notice>{t('flags.closedDone')}</Notice> : q.flag === 'decided' ? <Notice>{t('flags.decided')}</Notice> : null}
      <section className="car-card">
        <div className="car-top">
          <span className="set-avatar">{c.name.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ fontSize: 18 }}>{c.name}</b>
            <span className="set-muted rt-num">{`NIC ${c.nic} · ${c.phone}`}</span>
            {c.address ? <span className="set-muted">{c.address}</span> : null}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="rt-btn rt-btn-secondary" style={{ textDecoration: 'none' }} href={`tel:${c.phone}`}>{t('call')}</a>
            <Link className="rt-btn rt-btn-secondary" style={{ textDecoration: 'none' }} href={`/customers/${c.id}/edit`}>{t('edit')}</Link>
          </span>
        </div>
        <span>{`${t('licence')}: ${c.licenceNumber} · `}{c.licenceExpired ? <span className="cus-tag cus-tag-bad">{t('licenceExpired', { date: day(c.licenceExpires) })}</span> : t('licenceUntil', { date: day(c.licenceExpires) })}</span>
      </section>
      <section className="car-card" aria-labelledby="warnings"><h2 id="warnings">{t('warnings')}</h2>
        {open.map((f) => <Notice key={f.id} tone="warning">{`${t('flags.flagWarn', { kind: t(`flags.kinds.${f.kind}`) })} · ${f.details}`}</Notice>)}
        {c.licenceExpired ? <Notice tone="warning">{t('licenceWarning', { date: day(c.licenceExpires) })}</Notice> : null}
        {!open.length && !c.licenceExpired ? <span>{t('noWarnings')}</span> : null}
        <span className="set-muted">{t('flagsLater')}</span>
        <div className="set-actions" style={{ justifyContent: 'flex-start' }}>
          <Link className="rt-btn rt-btn-secondary" style={{ textDecoration: 'none' }} href={`/customers/${c.id}/flags/new`}>{t('flags.add')}</Link>
          <Link className="rt-btn rt-btn-quiet" style={{ textDecoration: 'none' }} href={`/customers/${c.id}/check`}>{t('flags.check')}</Link>
        </div>
      </section>
      {/* Flags (ST-08.5, AT-48): open ones can be closed with a reason; closed ones stay, with who closed them and why. */}
      <section className="car-card" aria-labelledby="flags"><h2 id="flags">{t('flags.title')}</h2>
        {flags.length ? (
          <ul className="cus-flags">
            {flags.map((f) => (
              <li key={f.id} data-flag-state={f.closedAt ? 'closed' : 'open'}>
                <span><b>{t(`flags.kinds.${f.kind}`)}</b>{` · ${f.details}`} <span className={f.closedAt ? 'cus-tag' : 'cus-tag cus-tag-bad'}>{t(f.closedAt ? 'flags.closed' : 'flags.open')}</span></span>
                <span className="set-muted">{t('flags.by', { name: f.createdByName ?? '', date: when(f.createdAt) })}</span>
                {f.closedAt ? <span className="set-muted">{t('flags.closedBy', { name: f.closedByName ?? '', date: when(f.closedAt), reason: f.closeReason ?? '' })}</span>
                  : <CloseFlagForm customerId={c.id} flagId={f.id} w={fw} />}
              </li>
            ))}
          </ul>
        ) : <span className="set-muted">{t('flags.none')}</span>}
        {decisions.length ? (
          <>
            <h3 style={{ margin: 0, fontSize: 16 }}>{t('flags.decisions')}</h3>
            <ul className="cus-flags">
              {decisions.map((d) => <li key={d.id}><span>{t('flags.decision', { name: d.byName ?? '', date: when(d.createdAt), reason: d.reason })}</span></li>)}
            </ul>
          </>
        ) : null}
      </section>
      <section className="car-card" aria-labelledby="copies"><h2 id="copies">{t('copies')}</h2>
        {c.copiesMissing.length ? <span><span className="cus-tag cus-tag-warn">{t('copiesMissing')}</span></span> : null}
        <div className="cus-copies">
          {COPY_KINDS.map((k) => {
            const d = c.documents.find((x) => x.kind === k);
            return (
              <div key={k} className={`cus-copy${d ? ' cus-copy-on' : ''}`} data-copy={k}>
                <span style={{ fontWeight: 600 }}>{w.kinds[k]}</span>
                <span className="set-muted">{d ? `${t('onFile')} · ${format.dateTime(d.createdAt, { day: 'numeric', month: 'short', timeZone: 'Asia/Colombo' })}` : t('notYet')}</span>
                {d ? <a href={`/customers/${c.id}/copies/${d.id}`} target="_blank" rel="noreferrer">{t('open')}</a> : null}
                <AddCopyForm customerId={c.id} kind={k} has={!!d} w={w} />
              </div>
            );
          })}
        </div>
        <span className="set-muted">{t('copiesNote')}</span>
      </section>
      <section className="car-card" aria-labelledby="history"><h2 id="history">{t('history')}</h2>
        {entries.length ? (
          <ul className="car-history">
            {entries.map((e) => (
              <li key={e.id}>
                <span className="set-muted">{format.dateTime(e.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' })}</span>
                <span><b>{e.actorName ?? tLog('system')}</b>{` · ${sentence(e)}`}</span>
              </li>
            ))}
          </ul>
        ) : <span className="set-muted">{t('historyEmpty')}</span>}
      </section>
    </AppFrame>
  );
}
