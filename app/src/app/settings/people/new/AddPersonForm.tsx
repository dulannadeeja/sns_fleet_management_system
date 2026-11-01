'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { phoneDigits } from '../../../../auth/phone';
import { Button, Icon, Notice, TextField } from '../../../../ui';
import { addPersonAction, type FormState } from '../actions';

export interface AddPersonWords {
  name: string; namePlaceholder: string; phone: string; phoneHint: string; password: string; passwordPlaceholder: string; passwordHint: string;
  role: string; staff: string; staffHint: string; admin: string; adminHint: string; partner: string; partnerHint: string;
  defaultsStaff: string; defaultsAdmin: string; defaultsHint: string; language: string; sinhala: string; sinhalaHint: string; english: string; englishHint: string;
  required: string; cancel: string; save: string; footer: string; errors: Record<string, string>;
}

/** Screen 15.4's form: name, phone (digits only, 10 at most), first password, Staff or Admin, language. */
export function AddPersonForm({ w }: { w: AddPersonWords }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addPersonAction, {});
  const [phone, setPhone] = useState(state.values?.phone ?? '');
  const [role, setRole] = useState(state.values?.role === 'admin' ? 'admin' : 'staff');
  const e = state.error;
  const err = (...keys: string[]) => (e && keys.includes(e) ? w.errors[e] : undefined);
  const other = e && !['nameMissing', 'phoneMissing', 'phoneInvalid', 'phoneTaken', 'passwordShort'].includes(e) ? w.errors[e] : undefined;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {other ? <Notice tone="danger">{other}</Notice> : null}
      <div className="set-choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        <TextField label={w.name} name="name" required requiredLabel={w.required} placeholder={w.namePlaceholder} autoComplete="off"
          defaultValue={state.values?.name} error={err('nameMissing')} />
        <TextField label={w.phone} name="phone" required requiredLabel={w.required} type="tel" inputMode="numeric" placeholder="07XXXXXXXX"
          autoComplete="off" hint={w.phoneHint} value={phone} onChange={(ev) => setPhone(phoneDigits(ev.target.value))}
          error={err('phoneMissing', 'phoneInvalid', 'phoneTaken')} />
      </div>
      <TextField label={w.password} name="password" type="password" required requiredLabel={w.required} autoComplete="new-password"
        placeholder={w.passwordPlaceholder} hint={w.passwordHint} error={err('passwordShort')} />
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend className="rt-field-label" style={{ marginBottom: 8 }}>{w.role} <span className="rt-field-req">{w.required}</span></legend>
        <div className="set-choices">
          {([['staff', w.staff, w.staffHint], ['admin', w.admin, w.adminHint]] as const).map(([value, label, hint]) => (
            <label key={value} className="set-choice">
              <span className="set-choice-title"><input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />{label}</span>
              <span className="set-choice-hint">{hint}</span>
            </label>
          ))}
          <label className="set-choice">
            <span className="set-choice-title"><input type="radio" name="role" value="partner" disabled />{w.partner}</span>
            <span className="set-choice-hint">{w.partnerHint}</span>
          </label>
        </div>
      </fieldset>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: 'var(--sunken)', borderRadius: 12 }}>
        <span style={{ flex: 'none', display: 'flex', marginTop: 2 }}><Icon name="users" size={20} /></span>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 15, lineHeight: '24px', fontWeight: 600 }}>{role === 'admin' ? w.defaultsAdmin : w.defaultsStaff}</span>
          <span className="set-muted">{w.defaultsHint}</span>
        </span>
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="rt-field-label" style={{ marginBottom: 8 }}>{w.language}</legend>
        <div className="set-choices">
          {([['si', w.sinhala, w.sinhalaHint], ['en', w.english, w.englishHint]] as const).map(([value, label, hint]) => (
            <label key={value} className="set-choice" lang={value}>
              <span className="set-choice-title"><input type="radio" name="language" value={value} defaultChecked={(state.values?.language ?? 'si') === value} />{label}</span>
              <span className="set-choice-hint">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="set-actions">
        <Link href="/settings/people" className="rt-btn rt-btn-quiet" style={{ textDecoration: 'none' }}>{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending}>{w.save}</Button>
      </div>
      <p className="set-muted" style={{ margin: 0 }}>{w.footer}</p>
    </form>
  );
}
