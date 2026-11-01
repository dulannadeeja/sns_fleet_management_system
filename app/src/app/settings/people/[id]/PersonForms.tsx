'use client';
import { useActionState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { resetPasswordAction, setEmailAction, turnOffAction, turnOnAction, type FormState } from '../actions';

export interface PersonWords {
  required: string; newPassword: string; newPasswordHint: string; reset: string; resetDone: string;
  reason: string; reasonPlaceholder: string; turnOff: string; turnOn: string; errors: Record<string, string>;
  newEmail: string; newEmailHint: string; saveEmail: string; emailSaved: string;
}

/** 15.6: the owner types a new first password; the person changes it at the next sign-in (AT-46). */
export function ResetPasswordForm({ personId, w }: { personId: string; w: PersonWords }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction.bind(null, personId), {});
  const ready = useReady();
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {state.done ? <Notice>{w.resetDone}</Notice> : null}
      <TextField label={w.newPassword} name="password" type="password" required requiredLabel={w.required} autoComplete="new-password"
        hint={w.newPasswordHint} error={state.error ? w.errors[state.error] : undefined} />
      <div className="set-actions"><Button type="submit" variant="secondary" icon="key" disabled={pending || !ready}>{w.reset}</Button></div>
    </form>
  );
}

/** 15.6: turning the account off needs a reason (AT-47). */
export function TurnOffForm({ personId, w }: { personId: string; w: PersonWords }) {
  const [state, action, pending] = useActionState<FormState, FormData>(turnOffAction.bind(null, personId), {});
  const ready = useReady();
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TextField label={w.reason} name="reason" required requiredLabel={w.required} placeholder={w.reasonPlaceholder} autoComplete="off"
        defaultValue={state.values?.reason} error={state.error ? w.errors[state.error] : undefined} />
      <div className="set-actions"><Button type="submit" variant="danger" icon="lock" disabled={pending || !ready}>{w.turnOff}</Button></div>
    </form>
  );
}

export function TurnOnForm({ personId, w }: { personId: string; w: PersonWords }) {
  const [state, action, pending] = useActionState<FormState>(turnOnAction.bind(null, personId), {});
  const ready = useReady();
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {state.error ? <Notice tone="danger">{w.errors[state.error]}</Notice> : null}
      <div className="set-actions"><Button type="submit" variant="secondary" icon="check" disabled={pending || !ready}>{w.turnOn}</Button></div>
    </form>
  );
}

/** 15.6: the owner's or an admin's email (#28). */
export function EmailForm({ personId, w }: { personId: string; w: PersonWords }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setEmailAction.bind(null, personId), {});
  const ready = useReady();
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {state.done ? <Notice>{w.emailSaved}</Notice> : null}
      <TextField label={w.newEmail} name="email" type="email" required requiredLabel={w.required} autoComplete="off" placeholder="name@example.com"
        defaultValue={state.values?.email} hint={w.newEmailHint} error={state.error ? w.errors[state.error] : undefined} />
      <div className="set-actions"><Button type="submit" variant="secondary" icon="check" disabled={pending || !ready}>{w.saveEmail}</Button></div>
    </form>
  );
}
