'use client';
import { useActionState } from 'react';
import { useReady } from '../../useReady';
import { Button, TextField } from '../../../ui';
import { tickAction, type TickState } from './actions';

// "Mark done", or "Mark not done" with a reason (ST-01.3; Proposed: Dulan, 4 Nov 2026).
export function TickForm({ item, done, w }: { item: string; done: boolean; w: { tick: string; untick: string; reason: string; errors: Record<string, string> } }) {
  const [state, action, pending] = useActionState<TickState, FormData>(tickAction.bind(null, item, done), {});
  const ready = useReady();
  const error = state.error ? (w.errors[state.error] ?? w.errors.failed) : undefined;
  return (
    <form action={action} noValidate style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <input type="hidden" name="done" value={done ? '0' : '1'} />
      {done ? <TextField id={`reason-${item}`} name="reason" label={w.reason} autoComplete="off" defaultValue={state.values?.reason} error={error} className="gl-reason" /> : null}
      <Button type="submit" variant={done ? 'quiet' : 'secondary'} icon={done ? undefined : 'check'} disabled={pending || !ready}>{done ? w.untick : w.tick}</Button>
      {!done && error ? <span className="rt-field-error" role="alert">{error}</span> : null}
    </form>
  );
}
