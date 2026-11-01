import type { NavItem, Lang } from '../ui';
import type { SignedInPerson } from '../auth/first-sign-in';
import en from '../i18n/en.json';

// The desktop menu: only what is built so far (each feature adds its own item), for the people who may open it.
export function railItems(person: SignedInPerson, active: 'cars' | 'settings', t: (key: 'nav.today' | 'nav.cars' | 'nav.settings') => string, lang: Lang): NavItem[] {
  const echo = (key: 'today' | 'cars' | 'settings') => (lang === 'si' ? en.nav[key] : undefined);
  const employee = ['owner', 'admin', 'staff'].includes(person.role);
  return [
    { icon: 'home', label: t('nav.today'), en: echo('today'), group: 0, href: '/' },
    ...(employee ? [{ icon: 'car' as const, label: t('nav.cars'), en: echo('cars'), group: 1 as const, href: '/cars', active: active === 'cars' }] : []),
    { icon: 'settings', label: t('nav.settings'), en: echo('settings'), group: 9, href: person.role === 'owner' ? '/settings/people' : '/settings/business-rules', active: active === 'settings' },
  ];
}
