import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { nextStep, signedInPerson } from '../../auth/first-sign-in';
import { BrandMark, Icon, type Lang } from '../../ui';
import { SignInForm } from './SignInForm';
import { SignInLanguage } from './SignInLanguage';
import '../start.css';

// Screen 01.1 Sign in (ST-01.1). Email reset for owner and admin is not offered until #28.
export default async function SignInPage() {
  const person = await signedInPerson(await headers());
  if (person) redirect(nextStep(person) ?? '/');
  const t = await getTranslations('signIn');
  const lang = (await getLocale()) as Lang;
  return (
    <main className="start-page">
      <section className="start-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <BrandMark size="lg" />
          <SignInLanguage lang={lang} label={t('language')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '32px 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: '38px', fontWeight: 600 }}>{t('welcome')}</h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: '26px', color: 'var(--ink-muted)' }}>{t('intro')}</p>
          </div>
          <SignInForm words={{ phone: t('phone'), password: t('password'), submit: t('submit'), wrong: t('wrong'), locked: t('locked'), missing: t('missing') }} />
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sunken)', borderRadius: 12, fontSize: 14, lineHeight: '22px', color: 'var(--ink-muted)' }}>
            <span style={{ flex: 'none', display: 'flex' }}><Icon name="info" size={20} /></span>
            <span>{t('help')}</span>
          </div>
        </div>
        <p style={{ margin: 0, padding: '16px 20px 24px', textAlign: 'center', fontSize: 14, lineHeight: '22px', color: 'var(--ink-muted)' }}>{t('everyone')}</p>
      </section>
    </main>
  );
}
