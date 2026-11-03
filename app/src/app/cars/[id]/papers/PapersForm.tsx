'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { useReady } from '../../../useReady';
import { Button, Notice, TextField } from '../../../../ui';
import { changePapersAction, type PapersFormState } from '../../actions';

// The papers and service form: hidden "was.*" fields carry what it showed, so only changed boxes are saved and a change
// made meanwhile is refused. An empty box means "not recorded".
export interface PapersWords { labels: Record<string, string>; hint: string; kmHint: string; note: string; save: string; cancel: string; errors: Record<string, string> }
const DATES = ['insuranceExpires', 'licenceExpires', 'nextServiceOn'] as const;

export function PapersForm({ carId, was, w }: { carId: string; was: Record<string, string>; w: PapersWords }) {
  const [state, action, pending] = useActionState<PapersFormState, FormData>(changePapersAction.bind(null, carId), {});
  const ready = useReady();
  const bad = (k: string) => (state.fields?.includes(k) ? (state.error === 'stale' ? w.errors.stale : w.errors.invalid) : undefined);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(was).map(([k, v]) => <input key={k} type="hidden" name={`was.${k}`} value={v} />)}
      <div className="car-fields">
        {DATES.map((k) => (
          <TextField key={k} name={k} type="date" label={w.labels[k]} hint={w.hint} defaultValue={state.values?.[k] ?? was[k]} error={bad(k)} />
        ))}
        <TextField name="nextServiceKm" inputMode="numeric" autoComplete="off" label={w.labels.nextServiceKm} hint={w.kmHint}
          defaultValue={state.values?.nextServiceKm ?? was.nextServiceKm} error={bad('nextServiceKm')} />
      </div>
      <span className="set-muted">{w.note}</span>
      {state.error && !state.fields ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/cars/${carId}`}>{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !ready}>{w.save}</Button>
      </div>
    </form>
  );
}
