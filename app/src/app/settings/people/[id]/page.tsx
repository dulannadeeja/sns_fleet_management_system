import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requireOwner } from '../../../../auth/require';
import { defaultPermissions, type Role } from '../../../../auth/permissions';
import { getPerson } from '../../../../modules/people/people';
import { Icon } from '../../../../ui';
import { SettingsFrame } from '../../SettingsFrame';
import { needsEmail } from '../../../../modules/people/people';
import { EmailForm, ResetPasswordForm, TurnOffForm, TurnOnForm } from './PersonForms';

// Screen 15.6 Person (ST-15.2; board added 1 Nov 2026): details, reset password (AT-46), turn off or on (AT-47).
// Owner only. The owner's own account has neither: their reset is by email (#28) and they cannot be turned off.
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const person = await getPerson((await params).id);
  if (!person) notFound();
  const t = await getTranslations('settings');
  const format = await getFormatter();
  const name = person.name;
  const p = (key: string) => t(`person.${key}`, { name });
  const isDefaults = person.role !== 'owner' && [...person.permissions].sort().join() === defaultPermissions(person.role as Role).sort().join();
  const w = {
    required: t('requiredMark'), newPassword: p('newPassword'), newPasswordHint: p('newPasswordHint'), reset: p('reset'), resetDone: p('resetDone'),
    reason: p('reason'), reasonPlaceholder: p('reasonPlaceholder'), turnOff: p('turnOff'), turnOn: p('turnOn'), errors: t.raw('errors') as Record<string, string>,
    newEmail: p('newEmail'), newEmailHint: p('newEmailHint'), saveEmail: p('saveEmail'), emailSaved: p('emailSaved'),
  };
  return (
    <SettingsFrame person={owner} active="people" subtitle={`${t('people')} › ${name}`} backHref="/settings/people">
      <section className="set-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 22, lineHeight: '32px' }}>{name}</h2>
          <span className={person.disabledAt ? 'set-status set-status-off' : 'set-status'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name={person.disabledAt ? 'lock' : 'check'} size={18} />{person.disabledAt ? t('status.off') : t('status.active')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="set-muted">{p('phone')}</span><span className="rt-num" style={{ fontSize: 17 }}>{person.phone}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="set-muted">{p('role')}</span><span style={{ fontSize: 17 }}>{t(`roles.${person.role as 'staff'}`)}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="set-muted">{p('permissions')}</span>
            <Link href="/settings/permissions" style={{ fontSize: 17 }}>{person.role === 'owner' ? t('everything') : isDefaults ? t(`agreedDefaults.${person.role as 'staff'}`) : t('changed')}</Link></div>
          {needsEmail(person.role) ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}><span className="set-muted">{p('email')}</span>
              <span style={{ fontSize: 17 }}>{person.email ?? p('noEmail')}</span>
              {person.pendingEmail ? <span className="set-muted">{t('person.waiting', { email: person.pendingEmail })}</span> : null}</div>
          ) : null}
        </div>
        {person.role === 'owner' ? <p className="set-muted" style={{ margin: 0 }}>{p('ownerNote')}</p> : null}
      </section>
      {needsEmail(person.role) ? (
        <section className="set-card">
          <h2>{p('emailTitle')}</h2>
          <p className="set-muted" style={{ margin: 0 }}>{p('emailHint')}</p>
          <EmailForm personId={person.id} w={w} />
        </section>
      ) : null}
      {person.role === 'owner' ? null : (
        <>
          <section className="set-card">
            <h2>{p('resetTitle')}</h2>
            <p className="set-muted" style={{ margin: 0 }}>{p('resetHint')}</p>
            <ResetPasswordForm personId={person.id} w={w} />
          </section>
          <section className="set-card">
            <h2>{p('offTitle')}</h2>
            {person.disabledAt ? (
              <>
                <p style={{ margin: 0 }}>{t('person.offSince', { date: format.dateTime(person.disabledAt, { dateStyle: 'medium', timeZone: 'Asia/Colombo' }), reason: person.disabledReason ?? '' })}</p>
                <p className="set-muted" style={{ margin: 0 }}>{p('onHint')}</p>
                <TurnOnForm personId={person.id} w={w} />
              </>
            ) : (
              <>
                <p className="set-muted" style={{ margin: 0 }}>{p('offHint')}</p>
                <TurnOffForm personId={person.id} w={w} />
              </>
            )}
            <p className="set-muted" style={{ margin: 0 }}>{p('logNote')}</p>
          </section>
        </>
      )}
    </SettingsFrame>
  );
}
