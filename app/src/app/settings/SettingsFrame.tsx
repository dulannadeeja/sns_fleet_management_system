import Link from 'next/link';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { mayDo } from '../../auth/access';
import { railItems } from '../rail';
import { AppHeader, Icon, NavRail, PageHeader, type Lang } from '../../ui';
import type { SignedInPerson } from '../../auth/first-sign-in';
import en from '../../i18n/en.json';
import './settings.css';

// The frame of screens 15.1 to 15.7: on a computer the menu and the top bar, on a phone the page header
// with a back link; then the Settings list and the page. The menu holds only what is built so far (each feature adds
// its own item); the Settings list shows only the Settings pages that exist.
export async function SettingsFrame({ person, active, subtitle, backHref, children }: {
  person: SignedInPerson; active: 'people' | 'permissions' | 'activity' | 'rules'; subtitle: string; backHref: string; children: ReactNode;
}) {
  const t = await getTranslations();
  const seeLog = await mayDo(person, 'seeActivityLog');
  const lang = (await getLocale()) as Lang;
  const title = lang === 'si' ? `${t('settings.title')} · ${en.settings.title}` : t('settings.title');
  return (
    <div className="set-desktop">
      <NavRail labels={{ menu: t('frame.menu') }} items={railItems(person, 'settings', t, lang)} />
      <div className="set-body">
        <AppHeader title={title} subtitle={subtitle} user={person.name} role={t(`settings.roles.${person.role as 'owner'}`)} lang={lang} langLabel={t('frame.language')} />
        <div className="set-phone-head">
          <PageHeader backHref={backHref} backLabel={t('settings.back')} title={subtitle} subtitle={title} />
        </div>
        <main className="set-main">
          <nav className="set-nav" aria-label={t('settings.menu')}>
            {person.role === 'owner' ? (
              <>
                <Link href="/settings/permissions" aria-current={active === 'permissions' ? 'page' : undefined}><Icon name="users" size={20} />{t('settings.permissions')}</Link>
                <Link href="/settings/people" aria-current={active === 'people' ? 'page' : undefined}><Icon name="idcard" size={20} />{t('settings.people')}</Link>
              </>
            ) : null}
            {/* Everyone who works at SNS reads the business rules (15.2); the log only for whoever may see it (15.5). */}
            <Link href="/settings/business-rules" aria-current={active === 'rules' ? 'page' : undefined}><Icon name="file" size={20} />{t('settings.businessRules')}</Link>
            {seeLog ? <Link href="/settings/activity-log" aria-current={active === 'activity' ? 'page' : undefined}><Icon name="clock" size={20} />{t('settings.activityLog')}</Link> : null}
          </nav>
          <div className="set-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
