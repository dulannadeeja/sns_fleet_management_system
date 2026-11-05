'use client';
import { useActionState } from 'react';
import { Button, Notice, TextField } from '../../ui';
import { resetPasswordAction, type ResetState } from './actions';

export interface ResetWords { password: string; repeat: string; required: string; rule: string; save: string; errors: Record<string, string> }

export function ResetForm({ token, w }: { token: string; w: ResetWords }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPasswordAction.bind(null, token), {});
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {state.error === 'linkOld' ? <Notice tone="danger">{w.errors.linkOld}</Notice> : null}
      <TextField label={w.password} name="password" type="password" autoComplete="new-password" required requiredLabel={w.required}
        error={state.error === 'tooShort' ? w.errors.tooShort : undefined} />
      <TextField label={w.repeat} name="repeat" type="password" autoComplete="new-password" required requiredLabel={w.required}
        error={state.error === 'notSame' ? w.errors.notSame : undefined} />
      <Notice>{w.rule}</Notice>
      <Button type="submit" icon="check" full disabled={pending}>{w.save}</Button>
    </form>
  );
}
