import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../auth/require';
import { PERMISSION_KEYS, PERMISSIONS, type PermissionGroup } from '../../../auth/permissions';
import { listPeople } from '../../../modules/people/people';
import { Icon } from '../../../ui';
import { SettingsFrame } from '../SettingsFrame';
import { PermissionBox } from './PermissionBox';

// Screen 15.1 Permissions (ST-15.1): one tick per permission and person, from the agreed defaults (system design 3.2).
// Only the primary owner sees and changes it; the owner can do everything and is not listed.
const GROUPS: PermissionGroup[] = ['rentals', 'money', 'running'];

export default async function PermissionsPage() {
  const owner = await requireOwner();
  const t = await getTranslations('settings');
  // Active admins and staff: a turned-off account can do nothing, whatever is ticked.
  const people = (await listPeople()).filter((p) => (p.role === 'admin' || p.role === 'staff') && !p.disabledAt);
  const errors = t.raw('errors') as Record<string, string>;
  return (
    <SettingsFrame person={owner} active="permissions" subtitle={t('permissions')} backHref="/settings/people">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: 'var(--sunken)', borderRadius: 12 }}>
        <span style={{ flex: 'none', display: 'flex', marginTop: 2 }}><Icon name="lock" size={20} /></span>
        <span style={{ fontSize: 15, lineHeight: '24px' }}>{t('permissionsPage.lock')}</span>
      </div>
      {people.length === 0 ? <p className="set-muted">{t('permissionsPage.noPeople')}</p> : GROUPS.map((group) => (
        <section key={group} className="set-list">
          <div className="set-list-head"><h2 style={{ margin: 0, fontSize: 18, lineHeight: '28px', fontWeight: 600 }}>{t(`permissionsPage.groups.${group}`)}</h2></div>
          <div className="set-perm-scroll">
            <table className="set-perm">
              <thead>
                <tr>
                  <th scope="col">{t('permissionsPage.permission')}</th>
                  {people.map((p) => (
                    <th key={p.id} scope="col">
                      <Link href={`/settings/people/${p.id}`}>{p.name}</Link>
                      <span className="set-muted" style={{ display: 'block' }}>{t(`roles.${p.role as 'staff'}`)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_KEYS.filter((key) => PERMISSIONS[key].group === group).map((key) => {
                  const authorised = PERMISSIONS[key].startsWith === 'authorised';
                  const nobody = authorised && people.every((p) => !p.permissions.includes(key));
                  return (
                    <tr key={key}>
                      <th scope="row" style={{ fontWeight: 400 }}>
                        <span style={{ display: 'block', fontSize: 15, lineHeight: '24px' }}>{t(`perms.${key}`)}</span>
                        {nobody ? <span className="set-muted">{t('permissionsPage.authorised')}</span> : null}
                      </th>
                      {people.map((p) => (
                        <td key={p.id}>
                          <PermissionBox personId={p.id} permission={key} allowed={p.permissions.includes(key)} label={`${t(`perms.${key}`)} · ${p.name}`} errors={errors} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="set-muted" style={{ margin: 0 }}>{t('permissionsPage.authorisedHint')}</p>
      <p className="set-muted" style={{ margin: 0 }}>{t('permissionsPage.selfApproval')}</p>
    </SettingsFrame>
  );
}
