import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../auth/require';
import { isFilter, listRentals, type Group, type ListRow } from '../../modules/rentals/list';
import { rentalNumber } from '../../modules/rentals/agreements';
import { PlateBadge, type Lang } from '../../ui';
import { AppFrame } from '../AppFrame';
import '../cars/cars.css';
import './rentals.css';

// Screen 06.1 Rentals (ST-06.1): open rentals grouped by what needs doing. A filter opened from the menu's Overdue count
// (or, with #67, the attention summary) is shown and can be removed (AT-28). Needs Customer access.
const ORDER: Group[] = ['overdue', 'dueBack', 'handover', 'other'];

export default async function RentalsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const person = await requirePermission('customerAccess');
  const sp = await searchParams;
  const filter = isFilter(sp.filter) ? sp.filter : undefined;
  const [list, t, th, format, lang] = await Promise.all([listRentals({ filter }), getTranslations('rentals.list'), getTranslations('rentals.handover'), getFormatter(), getLocale()]);
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const late = (m: number) => t('late', { h: Math.floor(m / 60), m: String(m % 60).padStart(2, '0') });
  const total = ORDER.reduce((n, g) => n + list.groups[g].length, 0);
  const note = (r: ListRow) => r.overdue ? `${late(r.lateMinutes)} · ${t('deadline', { when: when(r.deadlineAt) })}`
    : r.status === 'draft' ? [r.notCollected ? t('notCollected', { when: when(r.createdAt) }) : t('savedAt', { when: when(r.createdAt) }),
      r.checklist ? (r.checklist.missing.length ? t('checklistMissing', { done: r.checklist.done, total: r.checklist.total, first: th(`items.${r.checklist.missing[0]}`) }) : t('checklistReady')) : ''].filter(Boolean).join(' · ')
      : t('backBy', { when: when(r.deadlineAt) });
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={t('open', { n: total })} backHref="/">
      <div className="set-actions" style={{ justifyContent: 'flex-start' }}>
        <Link className="rt-btn rt-btn-primary" href="/rentals/new">{t('new')}</Link>
      </div>
      {list.filter ? (
        <nav className="set-chips" aria-label={t('filterLabel')} data-filter={list.filter}>
          <span className="set-chip set-chip-on">{t(`filters.${list.filter}`)}</span>
          <Link className="set-chip" href="/rentals">{t('removeFilter')}</Link>
        </nav>
      ) : null}
      {total === 0 ? <p className="set-muted">{list.filter ? t('noneFiltered') : t('none')}</p> : null}
      {ORDER.filter((g) => list.groups[g].length).map((g) => (
        <section key={g} className="car-card" aria-labelledby={`g-${g}`} data-group={g}>
          <h2 id={`g-${g}`} className={g === 'overdue' ? 'ren-overdue' : undefined}>
            {g === 'dueBack' ? t('groups.dueBack', { when: when(list.dueBy) }) : t(`groups.${g}`)} <span className="set-muted">{list.groups[g].length}</span>
          </h2>
          <ul className="ren-list">
            {list.groups[g].map((r) => (
              <li key={r.id} data-rental={rentalNumber(r.number)} data-overdue={r.overdue ? '1' : '0'}>
                <Link href={`/rentals/${r.id}`} className="ren-list-row">
                  <PlateBadge plate={r.registration} size="sm" lang={lang as Lang} />
                  <span className="ren-check-text">
                    <span style={{ fontWeight: 600 }}>{`${rentalNumber(r.number)} · ${r.customerName}`}</span>
                    <span className="set-muted">{`${r.model} · ${note(r)}`}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </AppFrame>
  );
}
