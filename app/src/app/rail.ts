import type { NavItem, Lang } from '../ui';
import type { SignedInPerson } from '../auth/first-sign-in';
import en from '../i18n/en.json';

// The desktop menu: only what is built so far (each feature adds its own item), for the people who may open it.
export function railItems(person: SignedInPerson, active: 'cars' | 'rentals' | 'customers' | 'partners' | 'approvals' | 'settings', t: (key: 'nav.today' | 'nav.cars' | 'nav.rentals' | 'nav.customers' | 'nav.partners' | 'nav.approvals' | 'nav.settings') => string, lang: Lang, may: { partners: boolean; customers: boolean; overdue?: number; approvals?: boolean; waiting?: number }): NavItem[] {
  const echo = (key: 'today' | 'cars' | 'rentals' | 'customers' | 'partners' | 'approvals' | 'settings') => (lang === 'si' ? en.nav[key] : undefined);
  const employee = ['owner', 'admin', 'staff'].includes(person.role);
  return [
    { icon: 'home', label: t('nav.today'), en: echo('today'), group: 0, href: '/' },
    ...(employee ? [{ icon: 'car' as const, label: t('nav.cars'), en: echo('cars'), group: 1 as const, href: '/cars', active: active === 'cars' }] : []),
    // The rentals list (#58) needs Customer access; its count of overdue rentals opens the list filtered (AT-28).
    ...(may.customers ? [{ icon: 'clipboard' as const, label: t('nav.rentals'), en: echo('rentals'), group: 1 as const, href: '/rentals', active: active === 'rentals',
      ...(may.overdue ? { badge: may.overdue, badgeTone: 'overdue' as const, badgeHref: '/rentals?filter=overdue' } : {}) }] : []),
    ...(may.customers ? [{ icon: 'users' as const, label: t('nav.customers'), en: echo('customers'), group: 1 as const, href: '/customers', active: active === 'customers' }] : []),
    ...(may.partners ? [{ icon: 'handshake' as const, label: t('nav.partners'), en: echo('partners'), group: 2 as const, href: '/partners', active: active === 'partners' }] : []),
    // Approvals (#56) for whoever may decide a price change; the count is what waits for them.
    ...(may.approvals ? [{ icon: 'stamp' as const, label: t('nav.approvals'), en: echo('approvals'), group: 2 as const, href: '/approvals', active: active === 'approvals',
      ...(may.waiting ? { badge: may.waiting, badgeTone: 'waiting' as const, badgeHref: '/approvals' } : {}) }] : []),
    { icon: 'settings', label: t('nav.settings'), en: echo('settings'), group: 9, href: person.role === 'owner' ? '/settings/people' : '/settings/business-rules', active: active === 'settings' },
  ];
}
