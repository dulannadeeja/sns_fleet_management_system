import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '../auth/require';
import { mayDo } from '../auth/access';
import { Button } from '../ui';
import { signOutAction } from './actions';

// Until the home screens (Phase 2 and 4), the signed-in start page only says who is signed in.
export default async function Home() {
  const person = await requireUser();
  const t = await getTranslations();
  return (
    <main style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <h1 style={{ margin: 0 }}>{t('title')}</h1>
      <p style={{ margin: 0 }}>{t('home.signedIn', { name: person.name })}</p>
      {['owner', 'admin', 'staff'].includes(person.role) ? <Link href="/cars">{t('nav.cars')}</Link> : null}
      {(await mayDo(person, 'customerAccess')) ? <Link href="/customers">{t('nav.customers')}</Link> : null}
      {(await mayDo(person, 'seePartnerEarnings')) ? <Link href="/partners">{t('nav.partners')}</Link> : null}
      {person.role === 'owner' ? <Link href="/settings/people">{t('settings.homeSettings')}</Link> : null}
      {person.role === 'admin' || person.role === 'staff' ? <Link href="/settings/business-rules">{t('settings.businessRules')}</Link> : null}
      {person.role !== 'owner' && (await mayDo(person, 'seeActivityLog')) ? <Link href="/settings/activity-log">{t('settings.activityLog')}</Link> : null}
      <form action={signOutAction}><Button type="submit" variant="secondary" icon="arrowLeft">{t('home.signOut')}</Button></form>
    </main>
  );
}
