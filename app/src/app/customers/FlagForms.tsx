'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useReady } from '../useReady';
import { Button, Notice, TextField } from '../../ui';
import { addFlagAction, closeFlagAction, goAheadAction, type FlagFormState } from './actions';

// 08.5 Add a customer flag, closing a flag (AT-48), and 08.4 the check before a rental (ST-08.4).
export interface FlagWords { kinds: Record<string, string>; errors: Record<string, string>; [k: string]: string | Record<string, string> }
const s = (w: FlagWords, k: string) => w[k] as string;
const err = (w: FlagWords, state: FlagFormState) => (state.error ? (w.errors[state.error] ?? w.errors.failed) : undefined);

export function AddFlagForm({ customerId, w }: { customerId: string; w: FlagWords }) {
  const [state, action, pending] = useActionState<FlagFormState, FormData>(addFlagAction.bind(null, customerId), {});
  const ready = useReady();
  // The chosen reason (why) is sent from React's state: React resets a form's fields after each save attempt.
  const [kind, setKind] = useState(state.values?.kind ?? '');
  return (
    <form action={action} noValidate className="car-card">
      <input type="hidden" name="kind" value={kind} />
      <fieldset className="set-card" style={{ border: 0, padding: 0, gap: 8 }}>
        <legend className="set-rules-title">{`${s(w, 'why')} (${s(w, 'required')})`}</legend>
        <div className="set-choices">
          {Object.entries(w.kinds).map(([k, label]) => (
            <label key={k} className="set-choice"><span className="set-choice-title">
              <input type="radio" name="kindChoice" value={k} checked={kind === k} onChange={() => setKind(k)} />{label}</span></label>
          ))}
        </div>
        {state.error === 'kindInvalid' ? <span className="rt-field-error" role="alert">{w.errors.kindInvalid}</span> : null}
      </fieldset>
      <TextField name="details" label={s(w, 'what')} required requiredLabel={`(${s(w, 'required')})`} autoComplete="off" hint={s(w, 'whatHint')}
        defaultValue={state.values?.details} error={state.error === 'detailsMissing' || state.error === 'tooLong' ? err(w, state) : undefined} />
      <span className="set-muted">{s(w, 'addNote')}</span>
      {state.error && !['kindInvalid', 'detailsMissing', 'tooLong'].includes(state.error) ? <Notice tone="danger">{err(w, state)}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/customers/${customerId}`}>{s(w, 'cancel')}</Link>
        <Button type="submit" icon="flag" disabled={pending || !ready}>{s(w, 'save')}</Button>
      </div>
    </form>
  );
}

export function CloseFlagForm({ customerId, flagId, w }: { customerId: string; flagId: string; w: FlagWords }) {
  const [state, action, pending] = useActionState<FlagFormState, FormData>(closeFlagAction.bind(null, customerId, flagId), {});
  const ready = useReady();
  return (
    <form action={action} noValidate style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <TextField name="reason" label={s(w, 'closeReason')} autoComplete="off" hint={s(w, 'closeHint')} defaultValue={state.values?.reason}
        error={err(w, state)} style={{ minWidth: 0 }} className="cus-close-reason" />
      <Button type="submit" variant="secondary" disabled={pending || !ready}>{s(w, 'close')}</Button>
    </form>
  );
}

export function GoAheadForm({ customerId, flagIds, licenceExpired, mayContinue, w }: { customerId: string; flagIds: string[]; licenceExpired: boolean; mayContinue: boolean; w: FlagWords }) {
  const [state, action, pending] = useActionState<FlagFormState, FormData>(goAheadAction.bind(null, customerId), {});
  const ready = useReady();
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {flagIds.map((id) => <input key={id} type="hidden" name="shownFlag" value={id} />)}
      <input type="hidden" name="shownLicenceExpired" value={licenceExpired ? '1' : '0'} />
      <TextField name="reason" label={s(w, 'reason')} required requiredLabel={`(${s(w, 'required')})`} autoComplete="off" hint={s(w, 'reasonNote')}
        defaultValue={state.values?.reason} disabled={!mayContinue}
        error={state.error === 'reasonMissing' || state.error === 'tooLong' ? err(w, state) : undefined} />
      {state.error && !['reasonMissing', 'tooLong'].includes(state.error) ? <Notice tone="danger">{err(w, state)}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/customers/${customerId}`}>{s(w, 'dontRent')}</Link>
        <Button type="submit" icon="check" disabled={pending || !ready || !mayContinue}>{s(w, 'continue')}</Button>
      </div>
    </form>
  );
}
