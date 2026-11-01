import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { isPermission } from '../../../auth/permissions';
import { KINDS, listActivity, peopleForFilter, type Entry, type Kind } from '../../../modules/activity/activity';
import { Icon, type IconName } from '../../../ui';
import { SettingsFrame } from '../SettingsFrame';

// Screen 15.5 Activity log (ST-15.4): read only, newest first, by person and by kind. The owner, and whoever has
// "See the activity log" (the admin by default, DN-01). Entries can never be changed or deleted (Derived control).
const UUID = /^[0-9a-f-]{36}$/i;
const ICON: Record<string, IconName> = { settings: 'settings', money: 'wallet', customers: 'users', cars: 'car' };

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<{ person?: string; kind?: string; before?: string }> }) {
  const viewer = await requirePermission('seeActivityLog');
  const q = await searchParams;
  const personId = q.person && UUID.test(q.person) ? q.person : undefined;
  const kind = KINDS.includes(q.kind as Kind) ? (q.kind as Kind) : undefined;
  const beforeDate = q.before ? new Date(q.before) : undefined;
  const before = beforeDate && !Number.isNaN(beforeDate.getTime()) ? beforeDate : undefined;
  const [{ entries, older }, people] = await Promise.all([listActivity({ personId, kind, before }), peopleForFilter(personId)]);
  const t = await getTranslations('settings');
  const format = await getFormatter();
  const link = (p: { person?: string; kind?: string; before?: string }) => {
    const params = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]);
    return `/settings/activity-log${params.size ? `?${params}` : ''}`;
  };
  const sentence = (e: Entry) => {
    const values = {
      target: e.targetName ?? e.targetId ?? '',
      permission: typeof e.details?.permission === 'string' && isPermission(e.details.permission) ? t(`perms.${e.details.permission}`) : String(e.details?.permission ?? ''),
      role: typeof e.details?.role === 'string' ? t(`roles.${e.details.role as 'staff'}`) : '',
      email: String(e.details?.email ?? ''),
    };
    return t.has(`log.actions.${e.action}`) ? t(`log.actions.${e.action}` as 'log.actions.person.add', values) : e.action;
  };
  const day = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo' });
  const groups: { day: string; entries: Entry[] }[] = [];
  for (const e of entries) {
    const label = day(e.createdAt);
    if (groups.at(-1)?.day !== label) groups.push({ day: label, entries: [] });
    groups.at(-1)!.entries.push(e);
  }
  const chip = (href: string, label: string, on: boolean) => (
    <Link key={href + label} href={href} className={on ? 'set-chip set-chip-on' : 'set-chip'} aria-current={on ? 'true' : undefined}>{label}</Link>
  );
  return (
    <SettingsFrame person={viewer} active="activity" subtitle={t('activityLog')} backHref="/">
      <section className="set-list">
        <div className="set-list-head" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: '28px', fontWeight: 600 }}>{t('activityLog')}</h2>
          <span className="set-muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="lock" size={16} />{t('log.readOnly')}</span>
        </div>
        <div className="set-chips" style={{ padding: '0 20px 14px' }}>
          <nav aria-label={t('log.byPerson')} className="set-chips">
            {chip(link({ kind }), t('log.allPeople'), !personId)}
            {people.map((p) => chip(link({ person: p.id, kind }), p.name, personId === p.id))}
          </nav>
          <nav aria-label={t('log.byKind')} className="set-chips">
            {chip(link({ person: personId }), t('log.allKinds'), !kind)}
            {KINDS.map((k) => chip(link({ person: personId, kind: k }), t(`log.kinds.${k}`), kind === k))}
          </nav>
        </div>
        {groups.length === 0 ? <p className="set-muted" style={{ margin: 0, padding: '14px 20px', borderTop: '1px solid var(--line)' }}>{t('log.empty')}</p> : null}
        {groups.map((g) => (
          <div key={g.day}>
            <h3 className="set-day">{g.day}</h3>
            {g.entries.map((e) => (
              <div key={e.id} className="set-entry">
                <span className="rt-num set-muted">{format.dateTime(e.createdAt, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Colombo' })}</span>
                <span aria-hidden="true" className="set-entry-icon"><Icon name={e.reason ? 'flag' : ICON[e.kind ?? ''] ?? 'clipboard'} size={20} /></span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span><b>{e.actorName ?? t('log.system')}</b> · {sentence(e)}</span>
                  {e.reason ? <span className="set-muted">{t('log.reason', { reason: e.reason })}</span> : null}
                </span>
              </div>
            ))}
          </div>
        ))}
        {older ? (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
            <Link href={link({ person: personId, kind, before: older.toISOString() })} className="rt-btn rt-btn-secondary" style={{ textDecoration: 'none' }}>{t('log.older')}</Link>
          </div>
        ) : null}
      </section>
    </SettingsFrame>
  );
}
