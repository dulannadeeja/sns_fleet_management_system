'use client';
import { useActionState, useState } from 'react';
import { phoneDigits } from '../../auth/phone';
import { Button, Notice, TextField } from '../../ui';
import { forgotPasswordAction, type ForgotState } from './actions';

export interface ForgotWords { phone: string; required: string; submit: string; sent: string; errors: Record<string, string> }

export function ForgotForm({ w }: { w: ForgotWords }) {
  const [state, action, pending] = useActionState<ForgotState, FormData>(forgotPasswordAction, {});
  const [phone, setPhone] = useState(state.phone ?? '');
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {state.sent ? <Notice>{w.sent}</Notice> : null}
      <TextField label={w.phone} name="phone" type="tel" inputMode="numeric" autoComplete="username" placeholder="07XXXXXXXX" required requiredLabel={w.required}
        value={phone} onChange={(e) => setPhone(phoneDigits(e.target.value))} error={state.error ? w.errors[state.error] : undefined} />
      <Button type="submit" icon="arrowRight" full disabled={pending}>{w.submit}</Button>
    </form>
  );
}
