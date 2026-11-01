import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireEmployee } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { readSettings, type Group } from '../../../modules/settings/settings';
import { Notice } from '../../../ui';
import { SettingsFrame } from '../SettingsFrame';
import { showNumber, showTime } from './show';

// Screen 15.2 Business rules (ST-15.3): the owner, the admin and staff read the rules in force; only the owner sees
// "Change" (system design 3.2 "Owner settings", Proposed: Dulan, 1 Nov 2026). Partners are refused (403); the commission
// row only for those who may see partner terms.
const ROWS = ['extraKm', 'fuel', 'businessDay', 'drawerCount', 'cashOut', 'bankCheck', 'expiredDocuments', 'plannedService', 'lateReturn',
  'partnerCashOut', 'commission', 'garageDay', 'payrollDeductions', 'money', 'profit', 'approvals'] as const;

export default async function BusinessRulesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const person = await requireEmployee();
  const [s, t, lang, q] = await Promise.all([readSettings(), getTranslations('settings'), getLocale(), searchParams]);
  const owner = person.role === 'owner';
  // Partner terms are for the owner and whoever may see them (the admin by default), not staff (system design 3.2).
  const rows = (await mayDo(person, 'seePartnerEarnings')) ? ROWS : ROWS.filter((r) => r !== 'commission');
  const groups: { group: Group; value: string }[] = [
    { group: 'dayTimes', value: t('rules.groups.dayTimes.value', { cutoff: showTime(s.pickupCutoff, lang), deadline: showTime(s.returnDeadline, lang) }) },
    { group: 'reminders', value: t('rules.groups.reminders.value', {
      documents: s.documentReminderDays, serviceDays: s.serviceReminderDays, serviceKm: showNumber(s.serviceReminderKm), payroll: s.payrollReminderDays,
    }) },
    { group: 'fuel', value: s.fuelPricePerLitre === null ? t('rules.notSet') : t('rules.groups.fuel.value', { price: showNumber(s.fuelPricePerLitre) }) },
  ];
  return (
    <SettingsFrame person={person} active="rules" subtitle={t('businessRules')} backHref="/">
      {q.saved === '1' && owner ? <Notice>{t('rules.saved')}</Notice> : null}
      <section className="set-list" aria-labelledby="owner-settings">
        <div className="set-list-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <h2 id="owner-settings" className="set-rules-title">{t('rules.ownerTitle')}</h2>
          <span className="set-muted">{t('rules.ownerNote')}</span>
        </div>
        {groups.map(({ group, value }) => (
          <div key={group} className="set-rule set-rule-owner" data-group={group}>
            <span className="set-rule-text">
              <span>{t(`rules.groups.${group}.title`)}</span>
              <span className="set-muted">{t(`rules.groups.${group}.note`)}</span>
              <span className="set-rule-value">{value}</span>
            </span>
            {owner ? <Link className="rt-btn rt-btn-quiet" href={`/settings/business-rules/${group}`} aria-label={`${t('rules.change')}: ${t(`rules.groups.${group}.title`)}`}>{t('rules.change')}</Link> : null}
          </div>
        ))}
      </section>
      <section className="set-list" aria-labelledby="set-now">
        <div className="set-list-head"><h2 id="set-now" className="set-rules-title">{t('rules.setNow')}</h2></div>
        {rows.map((row) => (
          <div key={row} className="set-rule">
            <span className="set-rule-text"><span>{t(`rules.rows.${row}.title`)}</span><span className="set-muted">{t(`rules.rows.${row}.note`)}</span></span>
            <span className="set-rule-value set-rule-end">{t(`rules.rows.${row}.value`)}</span>
          </div>
        ))}
      </section>
      <p className="set-muted" style={{ margin: 0 }}>{t('rules.footer')}</p>
    </SettingsFrame>
  );
}
