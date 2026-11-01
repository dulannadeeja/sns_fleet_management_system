import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { AppHeader, NavRail, PageHeader, type Lang } from '../ui';
import type { SignedInPerson } from '../auth/first-sign-in';
import { railItems } from './rail';
import './settings/settings.css';

// The frame of the module pages (cars first): on a computer the menu and the top bar, on a phone the page header with a
// back link, as the boards show. Shares its layout classes with the Settings frame.
export async function AppFrame({ person, active, title, subtitle, backHref, children }: {
  person: SignedInPerson; active: 'cars'; title: string; subtitle?: string; backHref: string; children: ReactNode;
}) {
  const t = await getTranslations();
  const lang = (await getLocale()) as Lang;
  return (
    <div className="set-desktop">
      <NavRail labels={{ menu: t('frame.menu') }} items={railItems(person, active, t, lang)} />
      <div className="set-body">
        <AppHeader title={title} subtitle={subtitle} user={person.name} role={t(`settings.roles.${person.role as 'owner'}`)} lang={lang} langLabel={t('frame.language')} />
        <div className="set-phone-head">
          <PageHeader backHref={backHref} backLabel={t('settings.back')} title={subtitle ?? title} subtitle={subtitle ? title : undefined} />
        </div>
        <main className="set-main"><div className="set-content" style={{ flexBasis: '100%' }}>{children}</div></main>
      </div>
    </div>
  );
}
