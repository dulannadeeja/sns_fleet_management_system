import type { NavItem, Lang } from '../ui';
import type { SignedInPerson } from '../auth/first-sign-in';
import en from '../i18n/en.json';

// The desktop menu: only what is built so far (each feature adds its own item), for the people who may open it.
export function railItems(person: SignedInPerson, active: 'cars' | 'partners' | 'settings', t: (key: 'nav.today' | 'nav.cars' | 'nav.partners' | 'nav.settings') => string, lang: Lang, may: { partners: boolean }): NavItem[] {
  const echo = (key: 'today' | 'cars' | 'partners' | 'settings') => (lang === 'si' ? en.nav[key] : undefined);
  const employee = ['owner', 'admin', 'staff'].includes(person.role);
  return [
    { icon: 'home', label: t('nav.today'), en: echo('today'), group: 0, href: '/' },
    ...(employee ? [{ icon: 'car' as const, label: t('nav.cars'), en: echo('cars'), group: 1 as const, href: '/cars', active: active === 'cars' }] : []),
    ...(may.partners ? [{ icon: 'handshake' as const, label: t('nav.partners'), en: echo('partners'), group: 2 as const, href: '/partners', active: active === 'partners' }] : []),
    { icon: 'settings', label: t('nav.settings'), en: echo('settings'), group: 9, href: person.role === 'owner' ? '/settings/people' : '/settings/business-rules', active: active === 'settings' },
  ];
}
