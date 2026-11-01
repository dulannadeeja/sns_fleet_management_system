import { getTranslations } from 'next-intl/server';
import { Icon, PageHeader } from '../../../ui';
import '../../start.css';
import { CodeForm } from './CodeForm';

// Screen 01.4 Sign-in code (ST-01.1, AT-61; system design 3.1 "Email codes and email reset", Proposed).
export default async function SignInCodePage() {
  const t = await getTranslations('code');
  return (
    <main className="start-page">
      <section className="start-card">
        <div className="start-phone-only"><PageHeader backHref="/sign-in" backLabel={t('back')} title={t('title')} subtitle={t('subtitle')} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
            <h1 style={{ margin: 0, fontSize: 22, lineHeight: '32px', fontWeight: 600 }}>{t('heading')}</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: '24px', color: 'var(--ink-muted)' }}>{t('intro')}</p>
          </div>
          <CodeForm w={{ code: t('code'), required: t('required'), placeholder: t('placeholder'), submit: t('submit'), resend: t('resend'), sent: t('sent'), other: t('other'), errors: t.raw('errors') as Record<string, string> }} />
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sunken)', borderRadius: 12, fontSize: 14, lineHeight: '22px', color: 'var(--ink-muted)' }}>
            <span style={{ flex: 'none', display: 'flex' }}><Icon name="lock" size={20} /></span><span>{t('device')}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
