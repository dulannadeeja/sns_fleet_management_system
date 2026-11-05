import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BrandMark } from '../ui';
import './start.css';

// The 403 page: a signed-in person asked for something their account may not do (PR-06, AT-24).
export default async function Forbidden() {
  const t = await getTranslations('settings.forbidden');
  return (
    <main className="start-page">
      <section className="start-card" style={{ padding: 24, gap: 16 }}>
        <BrandMark />
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '34px', fontWeight: 600 }}>{t('title')}</h1>
        <p style={{ margin: 0, color: 'var(--ink-muted)' }}>{t('body')}</p>
        <Link href="/" className="rt-btn rt-btn-primary">{t('home')}</Link>
      </section>
    </main>
  );
}
