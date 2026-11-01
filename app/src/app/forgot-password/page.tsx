import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Icon, PageHeader } from '../../ui';
import '../start.css';
import { ForgotForm } from './ForgotForm';

// Screen 01.5 Forgot password (ST-01.1; DN-03; system design 3.1 "Email codes and email reset", Proposed).
export default async function ForgotPasswordPage() {
  const t = await getTranslations('forgot');
  const s = await getTranslations('signIn');
  return (
    <main className="start-page">
      <section className="start-card">
        <div className="start-phone-only"><PageHeader backHref="/sign-in" backLabel={t('back')} title={t('title')} subtitle={t('subtitle')} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
            <h1 style={{ margin: 0, fontSize: 22, lineHeight: '32px', fontWeight: 600 }}>{t('heading')}</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: '24px', color: 'var(--ink-muted)' }}>{t('intro')}</p>
          </div>
          <ForgotForm w={{ phone: s('phone'), required: t('required'), submit: t('submit'), sent: t('sent'), errors: { phoneMissing: s('phoneMissing'), phoneInvalid: s('phoneInvalid') } }} />
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sunken)', borderRadius: 12, fontSize: 14, lineHeight: '22px', color: 'var(--ink-muted)' }}>
            <span style={{ flex: 'none', display: 'flex' }}><Icon name="info" size={20} /></span><span>{t('staff')}</span>
          </div>
          <Link href="/sign-in" style={{ fontSize: 15 }}>{t('backToSignIn')}</Link>
        </div>
      </section>
    </main>
  );
}
