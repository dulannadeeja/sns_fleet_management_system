'use client';
import { useActionState } from 'react';
import { Button, Notice, TextField } from '../../ui';
import { confirmEmailAction, confirmLaterAction, sendConfirmCodeAction, type ConfirmState } from './actions';

export interface ConfirmWords { code: string; required: string; placeholder: string; send: string; sent: string; confirm: string; later: string; errors: Record<string, string> }

export function ConfirmForm({ w }: { w: ConfirmWords }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmEmailAction, {});
  const [sent, send, sending] = useActionState<ConfirmState>(sendConfirmCodeAction, {});
  const sendNote = sent.error ? w.errors[sent.error] : sent.sent ? w.sent : undefined;
  return (
    <>
      <form action={send} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        {sendNote ? <Notice tone={sent.error ? 'warning' : 'info'}>{sendNote}</Notice> : null}
        <Button type="submit" variant="secondary" icon="arrowRight" disabled={sending}>{w.send}</Button>
      </form>
      <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextField label={w.code} name="code" required requiredLabel={w.required} inputMode="numeric" autoComplete="one-time-code"
          placeholder={w.placeholder} maxLength={6} error={state.error ? w.errors[state.error] : undefined} />
        <Button type="submit" icon="check" full disabled={pending}>{w.confirm}</Button>
      </form>
      <form action={confirmLaterAction}><button type="submit" className="rt-btn rt-btn-quiet">{w.later}</button></form>
    </>
  );
}
