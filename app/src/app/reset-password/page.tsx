import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '../../ui';
import '../start.css';
import { ResetForm } from './ResetForm';

// Screen 01.6 New password, opened from the emailed link (system design 3.1 "Email codes and email reset", Proposed).
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  const t = await getTranslations('reset');
  return (
    <main className="start-page">
      <section className="start-card">
        <div className="start-phone-only"><PageHeader backHref="/sign-in" backLabel={t('back')} title={t('title')} subtitle={t('subtitle')} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
            <h1 style={{ margin: 0, fontSize: 22, lineHeight: '32px', fontWeight: 600 }}>{t('heading')}</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: '24px', color: 'var(--ink-muted)' }}>{token && !error ? t('intro') : t('errors.linkOld')}</p>
          </div>
          {token && !error ? (
            <ResetForm token={token} w={{ password: t('password'), repeat: t('repeat'), required: t('required'), rule: t('rule'), save: t('save'), errors: t.raw('errors') as Record<string, string> }} />
          ) : (
            <Link href="/forgot-password" className="rt-btn rt-btn-primary" style={{ textDecoration: 'none' }}>{t('askAgain')}</Link>
          )}
        </div>
      </section>
    </main>
  );
}
