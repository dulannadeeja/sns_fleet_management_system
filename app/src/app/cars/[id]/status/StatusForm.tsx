'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useReady } from '../../../useReady';
import { Button, Notice, TextField } from '../../../../ui';
import { changeStatusAction, type StatusFormState } from '../../actions';

// 04.5: the statuses this person may set, a reason (not for Available, except bringing a retired car back), the
// expected return date (optional) for Under repair and Unavailable, and the retire date (today or earlier).
export interface StatusWords {
  names: Record<string, string>; hints: Record<string, string>; reason: string; reasonHint: string; reasonBack: string; expectedBack: string;
  expectedHint: string; retiredOn: string; retiredHint: string; save: string; cancel: string; note: string; errors: Record<string, string>; requiredMark: string;
}
export function StatusForm({ carId, now, nowReason, nowBack, choices, start, today, w }: {
  carId: string; now: string; nowReason: string; nowBack: string; choices: string[]; start: string; today: string; w: StatusWords;
}) {
  const [state, action, pending] = useActionState<StatusFormState, FormData>(changeStatusAction.bind(null, carId), {});
  const ready = useReady();
  const [chosen, setChosen] = useState(state.values?.status ?? start);
  const away = chosen === 'repair' || chosen === 'unavailable';
  const back = now === 'retired';
  const field = (e: string) => (state.error === e ? w.errors[e] : undefined);
  const dateError = ['dateInvalid', 'retireDateFuture', 'retireDateBeforeAdded'].includes(state.error ?? '') ? w.errors[state.error!] : undefined;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input type="hidden" name="was" value={now} />
      <input type="hidden" name="status" value={chosen} />
      <fieldset className="set-card" style={{ border: 0, padding: 0, gap: 8 }}>
        <div className="set-choices" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          {choices.map((s) => (
            <label key={s} className="set-choice"><span className="set-choice-title">
              <input type="radio" name="statusChoice" value={s} checked={chosen === s} onChange={() => setChosen(s)} />{w.names[s]}</span>
              <span className="set-choice-hint">{w.hints[s]}</span></label>
          ))}
        </div>
      </fieldset>
      {chosen !== 'available' || back ? (
        <TextField name="reason" label={back ? w.reasonBack : w.reason} required requiredLabel={w.requiredMark} autoComplete="off" hint={w.reasonHint}
          defaultValue={state.values?.reason ?? (away && chosen === now ? nowReason : '')} error={field('reasonMissing') ?? field('reasonTooLong')} />
      ) : null}
      {away ? (
        <TextField name="expectedBack" type="date" label={w.expectedBack} hint={w.expectedHint}
          defaultValue={state.values?.expectedBack ?? (chosen === now ? nowBack : '')} error={dateError} />
      ) : null}
      {chosen === 'retired' ? (
        <TextField name="retiredOn" type="date" label={w.retiredOn} hint={w.retiredHint} max={today} defaultValue={state.values?.retiredOn ?? today} error={dateError} />
      ) : null}
      <span className="set-muted">{w.note}</span>
      {state.error && !['reasonMissing', 'reasonTooLong', 'dateInvalid', 'retireDateFuture', 'retireDateBeforeAdded'].includes(state.error)
        ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/cars/${carId}`}>{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !ready}>{w.save}</Button>
      </div>
    </form>
  );
}
