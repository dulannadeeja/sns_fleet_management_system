import { getFormatter, getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../auth/require';
import { currentWording, listWordings } from '../../../modules/rentals/agreements';
import { Notice } from '../../../ui';
import { SettingsFrame } from '../SettingsFrame';
import { AddWordingForm, ApproveForm } from './WordingForms';
import '../../cars/cars.css';

// Settings › Agreement wording (#55; system design 14, Confirmed 8 Nov 2026): the owner adds a version of SNS's
// conditions in Sinhala and English and approves it; an approved version never changes; the newest approved one is
// printed. No board exists yet for this page: it follows the Settings pages' layout.
export default async function AgreementWordingPage({ searchParams }: { searchParams: Promise<{ saved?: string; approved?: string }> }) {
  const person = await requireOwner();
  const [t, versions, current, format, sp] = await Promise.all([getTranslations('settings.agreement'), listWordings(), currentWording(), getFormatter(), searchParams]);
  const day = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo' });
  const w = (await getTranslations()).raw('settings.agreement') as Record<string, string> & { errors: Record<string, string> };
  return (
    <SettingsFrame person={person} active="agreement" subtitle={t('title')} backHref="/settings/business-rules">
      <p className="set-muted" style={{ margin: 0 }}>{t('intro')}</p>
      {sp.saved === '1' ? <Notice>{t('saved')}</Notice> : null}
      {sp.approved === '1' ? <Notice>{t('approvedNow')}</Notice> : null}
      <Notice tone={current ? 'info' : 'warning'}>{current ? t('current', { version: current.version, date: day(current.approvedAt!) }) : t('none')}</Notice>
      {versions.map((v) => (
        <section key={v.id} className="car-card" data-version={v.version} aria-labelledby={`v-${v.version}`}>
          <h2 id={`v-${v.version}`}>{t('version', { version: v.version })}</h2>
          <span className="set-muted">{v.approvedAt ? t('approved', { date: day(v.approvedAt) }) : t('draft')}</span>
          <details><summary>{t('si')}</summary><p style={{ whiteSpace: 'pre-wrap' }}>{v.textSi}</p></details>
          <details><summary>{t('en')}</summary><p style={{ whiteSpace: 'pre-wrap' }}>{v.textEn}</p></details>
          {v.approvedAt ? null : <ApproveForm id={v.id} label={t('approve', { version: v.version })} w={w} />}
        </section>
      ))}
      <AddWordingForm w={w} />
    </SettingsFrame>
  );
}
