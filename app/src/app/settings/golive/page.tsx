import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../auth/require';
import { GROUPS, readChecklist, type Item } from '../../../modules/golive/golive';
import { Icon, Notice } from '../../../ui';
import { SettingsFrame } from '../SettingsFrame';
import { TickForm } from './TickForm';
import './golive.css';

// Screen 01.3 Ready to start · setup checklist (ST-01.3; system design, starting data; AT-43). The owner only. Go-live
// waits until every item is done (Confirmed); how each is checked or ticked is Proposed (Dulan, 4 Nov 2026).
const GO: Partial<Record<Item['key'], string>> = { carDates: '/cars', partnerCars: '/partners', authorisedPerson: '/settings/permissions',
  startingPackages: '/settings/packages', staffAccounts: '/settings/people', carsEntered: '/cars' };

export default async function GoLivePage() {
  const person = await requireOwner();
  const [list, t, format] = await Promise.all([readChecklist(), getTranslations('settings.golive'), getFormatter()]);
  const when = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const names = (v: unknown) => (Array.isArray(v) && v.length ? v.join(', ') : '–');
  const fact = (i: Item): string => {
    const f = i.facts;
    switch (i.key) {
      case 'carsEntered': return t('facts.cars', { n: Number(f.cars) });
      case 'startingPackages': return t('facts.packages', { n: Number(f.packages) });
      case 'staffAccounts': return t('facts.people', { n: Number(f.people) });
      case 'carDates': return (f.noInsurance as string[]).length || (f.noLicence as string[]).length
        ? t('facts.datesMissing', { insurance: names(f.noInsurance), licence: names(f.noLicence) }) : t('facts.datesAll');
      case 'partnerCars': return (f.unlinked as string[]).length ? t('facts.unlinked', { cars: names(f.unlinked) }) : t('facts.allLinked');
      case 'authorisedPerson': return (f.notNamed as string[]).length
        ? t('facts.notNamed', { tasks: (f.notNamed as string[]).map((k) => t(`tasks.${k as 'writeOffDebt'}`)).join(', ') }) : t('facts.allNamed');
      default: return t(`facts.${i.key as 'openingCash'}`);
    }
  };
  const w = { tick: t('tick'), untick: t('untick'), reason: t('reason'), errors: t.raw('errors') as Record<string, string> };
  return (
    <SettingsFrame person={person} active="golive" subtitle={t('title')} backHref="/">
      <p className="set-muted" style={{ margin: 0 }}>{t('intro')}</p>
      <Notice tone={list.blocked ? 'warning' : undefined}>{`${t('home', { ready: list.ready, total: list.total })} · ${list.blocked ? t('blocked') : t('allDone')}`}</Notice>
      {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => {
        const items = list.items.filter((i) => (GROUPS[g] as readonly string[]).includes(i.key));
        return (
      <section key={g} className="car-card gl-list" aria-labelledby={`gl-${g}`} data-group={g}>
        <div className="gl-head"><h2 id={`gl-${g}`}>{t(`groups.${g}`)}</h2>
          <span className="set-muted">{t('groupCount', { ready: items.filter((i) => i.done).length, total: items.length })}</span></div>
        {items.map((i) => (
          <div key={i.key} className="gl-item" data-item={i.key} data-done={i.done ? 'yes' : 'no'}>
            <span className={i.done ? 'gl-mark gl-mark-done' : 'gl-mark'} aria-hidden="true"><Icon name={i.done ? 'check' : 'clock'} size={18} /></span>
            <span className="gl-text">
              <b>{t(`items.${i.key}`)}</b>
              <span className="set-muted">{fact(i)}</span>
              <span className="gl-state">{i.kind === 'later' ? t(`later.${i.part as 'money'}`) : `${i.done ? t('ready') : t('notReady')}${i.kind === 'auto' ? ` · ${t('auto')}` : ''}`}</span>
              {i.tick ? <span className="set-muted">{i.tick.done ? t('tickedBy', { name: i.tick.byName ?? '', date: when(i.tick.at) })
                : t('untickedBy', { name: i.tick.byName ?? '', date: when(i.tick.at), reason: i.tick.reason ?? '' })}</span> : null}
            </span>
            <span className="gl-actions">
              {i.kind === 'tick' ? <TickForm item={i.key} done={i.done} w={w} /> : null}
              {GO[i.key] ? <Link className="rt-btn rt-btn-quiet" href={GO[i.key]!}>{t(`go.${i.key as 'carDates'}`)}</Link> : null}
            </span>
          </div>
        ))}
      </section>
        );
      })}
    </SettingsFrame>
  );
}
