import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { signedInPerson } from '../../auth/first-sign-in';
import { Icon, PageHeader } from '../../ui';
import '../start.css';
import { ConfirmForm } from './ConfirmForm';

// Screen 01.7 Confirm your email (#28; system design 3.1 "Email codes and email reset", Proposed): after the owner
// changes an email, the person types the code sent to the new one. Until then, codes go to the old one.
export default async function ConfirmEmailPage() {
  const person = await signedInPerson(await headers());
  if (!person) redirect('/sign-in');
  if (person.mustChangePassword) redirect('/first-sign-in');
  if (!person.pendingEmail || !person.emailVerified) redirect('/');
  const t = await getTranslations('confirmEmail');
  const c = await getTranslations('code');
  return (
    <main className="start-page">
      <section className="start-card">
        <div className="start-phone-only"><PageHeader title={t('title')} subtitle={t('subtitle')} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
            <h1 style={{ margin: 0, fontSize: 22, lineHeight: '32px', fontWeight: 600 }}>{t('heading')}</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: '24px', color: 'var(--ink-muted)' }}>{t('intro', { email: person.pendingEmail })}</p>
          </div>
          <ConfirmForm w={{ code: c('code'), required: c('required'), placeholder: c('placeholder'), send: t('send'), sent: t('sent'), confirm: t('confirm'), later: t('later'), errors: t.raw('errors') as Record<string, string> }} />
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sunken)', borderRadius: 12, fontSize: 14, lineHeight: '22px', color: 'var(--ink-muted)' }}>
            <span style={{ flex: 'none', display: 'flex' }}><Icon name="info" size={20} /></span><span>{t('notMine')}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
