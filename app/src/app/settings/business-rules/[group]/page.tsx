import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../../auth/require';
import { SETTINGS, asText, isGroup, keysOf, readSettings } from '../../../../modules/settings/settings';
import { SettingsFrame } from '../../SettingsFrame';
import { showNumber } from '../show';
import { ChangeForm, type ChangeWords, type Field } from './ChangeForm';

// Screen 15.7 Change a setting (ST-15.3): the owner only (system design 3.2 "Owner settings", Proposed: Dulan,
// 1 Nov 2026). One group per page: rental day times, reminders or the fuel price.
export default async function ChangeSettingPage({ params }: { params: Promise<{ group: string }> }) {
  const person = await requireOwner();
  const { group } = await params;
  if (!isGroup(group)) notFound();
  const [s, t, lang] = await Promise.all([readSettings(), getTranslations('settings.rules'), getLocale()]);
  const fields: Field[] = keysOf(group).map((key) => {
    const def = SETTINGS[key];
    const unit = t(`fields.${key}.unit`);
    const limits = def.kind === 'number' ? { min: showNumber(def.min), max: showNumber(def.max) } : null;
    return {
      key, type: def.kind, saved: asText(s[key]), label: t(`fields.${key}.label`),
      hint: [unit, t(`fields.${key}.hint`)].filter(Boolean).join(' · '),
      errors: {
        required: t('errors.required'), number: t('errors.number'), time: t('errors.time'),
        range: limits ? t('errors.range', limits) : t('errors.time'),
      },
    };
  });
  const w: ChangeWords = {
    check: t('check'), noChange: t('noChange'), changeLine: t.raw('changeLine') as string, logNote: t('logNote'), save: t('save'), cancel: t('cancel'),
    days: t.raw('days') as string, km: t.raw('km') as string, rupees: t.raw('rupees') as string, notSet: t('notSet'),
    formErrors: { notAllowed: t('errors.notAllowed'), failed: t('errors.failed') },
  };
  return (
    <SettingsFrame person={person} active="rules" subtitle={t(`groups.${group}.title`)} backHref="/settings/business-rules">
      <h2 className="set-rules-title" style={{ margin: 0 }}>{t(`groups.${group}.title`)}</h2>
      <p className="set-muted" style={{ margin: 0 }}>{t(`intro.${group}`)}</p>
      <ChangeForm group={group} fields={fields} w={w} lang={lang} />
    </SettingsFrame>
  );
}
