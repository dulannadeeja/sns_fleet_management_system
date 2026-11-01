import Link from 'next/link';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { AppHeader, Icon, NavRail, PageHeader, type Lang } from '../../ui';
import type { SignedInPerson } from '../../auth/first-sign-in';
import en from '../../i18n/en.json';
import './settings.css';

// The frame of screens 15.1, 15.3, 15.4 and 15.6: on a computer the menu and the top bar, on a phone the page header
// with a back link; then the Settings list and the page. The menu holds only what is built so far (each feature adds
// its own item); the Settings list shows only the Settings pages that exist.
export async function SettingsFrame({ person, active, subtitle, backHref, children }: {
  person: SignedInPerson; active: 'people' | 'permissions' | 'activity'; subtitle: string; backHref: string; children: ReactNode;
}) {
  const t = await getTranslations();
  const lang = (await getLocale()) as Lang;
  const echo = (key: 'today' | 'settings') => (lang === 'si' ? en.nav[key] : undefined);
  const title = lang === 'si' ? `${t('settings.title')} · ${en.settings.title}` : t('settings.title');
  return (
    <div className="set-desktop">
      <NavRail labels={{ menu: t('frame.menu') }} items={[
        { icon: 'home', label: t('nav.today'), en: echo('today'), group: 0, href: '/' },
        { icon: 'settings', label: t('nav.settings'), en: echo('settings'), group: 9, href: person.role === 'owner' ? '/settings/people' : '/settings/activity-log', active: true },
      ]} />
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
            {/* Shown on owner pages (the owner may see the log) and on the log page itself (whoever may see it). */}
            <Link href="/settings/activity-log" aria-current={active === 'activity' ? 'page' : undefined}><Icon name="clock" size={20} />{t('settings.activityLog')}</Link>
          </nav>
          <div className="set-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
