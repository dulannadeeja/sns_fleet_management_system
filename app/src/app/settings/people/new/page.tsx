import { getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../../auth/require';
import { SettingsFrame } from '../../SettingsFrame';
import { AddPersonForm } from './AddPersonForm';

// Screen 15.4 Add a person (ST-15.2): Staff or Admin with a first password the owner types (Proposed, Dulan 1 Nov 2026);
// partners are added with their partner record (ST-11.2). Owner only.
export default async function AddPersonPage() {
  const owner = await requireOwner();
  const t = await getTranslations('settings');
  const a = (key: string, values?: Record<string, string>) => t(`add.${key}`, values);
  const role = (r: 'staff' | 'admin') => t(`roles.${r}`);
  return (
    <SettingsFrame person={owner} active="people" subtitle={`${t('people')} › ${a('title')}`} backHref="/settings/people">
      <section className="set-card">
        <h2>{a('title')}</h2>
        <AddPersonForm w={{
          name: a('name'), namePlaceholder: a('namePlaceholder'), phone: a('phone'), phoneHint: a('phoneHint'), password: a('password'),
          passwordPlaceholder: a('passwordPlaceholder'), passwordHint: a('passwordHint'), role: a('role'), staff: role('staff'), staffHint: a('staffHint'),
          admin: role('admin'), adminHint: a('adminHint'), partner: t('roles.partner'), partnerHint: a('partnerHint'),
          defaultsStaff: a('defaultsTitle', { role: role('staff') }), defaultsAdmin: a('defaultsTitle', { role: role('admin') }), defaultsHint: a('defaultsHint'),
          language: a('language'), sinhala: a('sinhala'), sinhalaHint: a('sinhalaHint'), english: a('english'), englishHint: a('englishHint'),
          required: t('requiredMark'), cancel: a('cancel'), save: a('save'), footer: a('footer'), errors: t.raw('errors') as Record<string, string>,
        }} />
      </section>
    </SettingsFrame>
  );
}
