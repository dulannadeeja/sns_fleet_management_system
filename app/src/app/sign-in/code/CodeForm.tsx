'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { Button, Notice, TextField } from '../../../ui';
import { checkCodeAction, resendCodeAction, type CodeState } from './actions';

export interface CodeWords { code: string; required: string; placeholder: string; submit: string; resend: string; sent: string; other: string; errors: Record<string, string> }

/** Screen 01.4's form: the 6-digit code, "send a new code", another account. */
export function CodeForm({ w }: { w: CodeWords }) {
  const [state, action, pending] = useActionState<CodeState, FormData>(checkCodeAction, {});
  const [resent, resend, resending] = useActionState<CodeState>(resendCodeAction, {});
  const resendNote = resent.error ? w.errors[resent.error] : resent.sent ? w.sent : undefined;
  return (
    <>
      <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {state.error === 'locked' ? <Notice tone="danger">{w.errors.locked}</Notice> : null}
        <TextField label={w.code} name="code" required requiredLabel={w.required} inputMode="numeric" autoComplete="one-time-code"
          placeholder={w.placeholder} maxLength={6} error={state.error && state.error !== 'locked' ? w.errors[state.error] : undefined} />
        <Button type="submit" icon="arrowRight" full disabled={pending}>{w.submit}</Button>
      </form>
      <form action={resend} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        {resendNote ? <span role="status" style={{ fontSize: 14, color: "var(--ink-muted)" }}>{resendNote}</span> : null}
        <button type="submit" className="rt-btn rt-btn-quiet" disabled={resending}>{w.resend}</button>
        <Link href="/sign-in" style={{ fontSize: 15 }}>{w.other}</Link>
      </form>
    </>
  );
}
