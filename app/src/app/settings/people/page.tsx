import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../auth/require';
import { defaultPermissions, type Role } from '../../../auth/permissions';
import { listPeople, type PersonRow } from '../../../modules/people/people';
import { Icon } from '../../../ui';
import { SettingsFrame } from '../SettingsFrame';

// Screen 15.3 People (ST-15.2): everyone with an SNS account; a row opens the person (15.6), the owner's too (for
// the owner's email, #28). Owner only (system design 3.2).
export default async function PeoplePage() {
  const owner = await requireOwner();
  const t = await getTranslations('settings');
  const people = await listPeople();
  const summary = (p: PersonRow) => {
    if (p.role === 'owner') return t('everything');
    const defaults = defaultPermissions(p.role as Role).sort().join();
    return [...p.permissions].sort().join() === defaults ? t(`agreedDefaults.${p.role as 'staff'}`) : t('changed');
  };
  const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <SettingsFrame person={owner} active="people" subtitle={t('people')} backHref="/">
      <section className="set-list">
        <div className="set-list-head">
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: '28px', fontWeight: 600 }}>
            {t('team')} <span className="rt-num" style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>{people.length}</span>
          </h2>
          <Link href="/settings/people/new" className="rt-btn rt-btn-primary" style={{ marginLeft: 'auto' }}>
            <Icon name="plus" size={20} /><span>{t('addPerson')}</span>
          </Link>
        </div>
        {people.map((p) => (
          <Link key={p.id} className="set-row" href={`/settings/people/${p.id}`}>
            <span aria-hidden="true" className={p.role === 'owner' ? 'set-avatar set-avatar-owner' : 'set-avatar'}>{initials(p.name)}</span>
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600 }}>{p.name}</span>
              <span className="set-muted">{t(`roles.${p.role as 'staff'}`)}</span>
            </span>
            <span style={{ fontSize: 15, lineHeight: '24px', color: 'var(--ink-muted)' }}>{summary(p)}</span>
            <span className={p.disabledAt ? 'set-status set-status-off' : 'set-status'}>{p.disabledAt ? t('status.off') : t('status.active')}</span>
          </Link>
        ))}
      </section>
      <p className="set-muted" style={{ margin: 0 }}>{t('partnersLater')}</p>
      <p className="set-muted" style={{ margin: 0 }}>{t('peopleNote')}</p>
    </SettingsFrame>
  );
}
