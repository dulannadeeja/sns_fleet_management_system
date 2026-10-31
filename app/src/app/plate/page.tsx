import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppHeader, BottomTabBar, NavRail, PageHeader, type NavItem } from '../../ui';
import en from '../../i18n/en.json';

// Development-only preview of the Plate app frame, to check it against screen boards 19.1 and 02.1 (#13).
// Desktop: /plate · phone: /plate?device=phone. Sample data only; not built into production.
export default async function PlatePreview({ searchParams }: { searchParams: Promise<{ device?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const t = await getTranslations();
  const { device } = await searchParams;
  const item = (key: keyof typeof en.nav, icon: NavItem['icon'], extra: Partial<NavItem> = {}): NavItem =>
    ({ icon, label: t(`nav.${key}`), en: en.nav[key], href: '#', ...extra });

  if (device === 'phone') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <PageHeader backHref="/plate?device=phone" backLabel={t('frame.back')} title={t('plate.title')} subtitle={t('plate.subtitle')} />
        <main style={{ flex: 1, padding: 16 }} />
        <BottomTabBar
          tabs={[item('cars', 'car', { active: true }), item('rentals', 'clipboard'), item('drawer', 'drawer'), item('more', 'more')]}
          fab={{ icon: 'plus', label: t('nav.new'), href: '#' }} />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'nowrap', alignItems: 'stretch' }}>
      <NavRail items={[
        item('today', 'home', { active: true }), item('cars', 'car'),
        item('rentals', 'clipboard', { badge: 1, badgeTone: 'overdue', badgeHref: '#' }), item('customers', 'users'),
        item('money', 'wallet'), item('partners', 'handshake'), item('approvals', 'stamp', { badge: 3 }),
        item('maintenance', 'wrench'), item('payroll', 'idcard'), item('reports', 'chart'), item('settings', 'settings'),
      ]} />
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppHeader title={t('plate.title')} subtitle={t('plate.subtitle')} search={t('frame.search')} searchHref="#" newHref="#" newLabel={t('frame.newRental')} user="S D De Silva" role="Owner" />
        <main style={{ padding: '24px 32px' }} />
      </div>
    </div>
  );
}
