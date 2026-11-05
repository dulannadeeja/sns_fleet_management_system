import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { signedInPerson } from '../../auth/first-sign-in';
import { PageHeader } from '../../ui';
import '../start.css';
import { FirstSignInForm } from './FirstSignInForm';

// Screen 01.2 First sign-in · set password (ST-01.2): only for a person who still has a first or reset password.
// Desktop: a card in the middle. Phone: the page header. Its back link is left out: going back would need a sign-out first.
export default async function FirstSignInPage() {
  const person = await signedInPerson(await headers());
  if (!person) redirect('/sign-in');
  if (!person.mustChangePassword) redirect('/');
  const t = await getTranslations('firstSignIn');
  return (
    <div className="start-page">
      <div className="start-card">
        <div className="start-phone-only">
          <PageHeader title={t('title')} subtitle={t('subtitle')} />
        </div>
        <FirstSignInForm language={person.language === 'en' ? 'en' : 'si'} hello={t('hello', { name: person.name })} intro={t('intro')}
          words={{ newPassword: t('newPassword'), newPasswordPlaceholder: t('newPasswordPlaceholder'), repeat: t('repeat'), repeatPlaceholder: t('repeatPlaceholder'), required: t('required'), rule: t('rule'), language: t('language'), si: t('si'), en: t('en'), save: t('save'), tooShort: t('tooShort'), notSame: t('notSame'), signedOut: t('signedOut') }} />
      </div>
    </div>
  );
}
