'use client';
import { useActionState, useState } from 'react';
import { Button, Notice } from '../../../ui';
import { useReady } from '../../useReady';
import { addWordingAction, approveWordingAction, type WordingState } from './actions';

// The two forms of Settings › Agreement wording (#55). Typed text is kept in React state (React resets a form after a
// save attempt). The server checks everything again.
type W = Record<string, string> & { errors: Record<string, string> };

export function AddWordingForm({ w }: { w: W }) {
  const [state, action, pending] = useActionState<WordingState, FormData>(addWordingAction, {});
  const ready = useReady();
  const [si, setSi] = useState(state.values?.textSi ?? '');
  const [en, setEn] = useState(state.values?.textEn ?? '');
  return (
    <form action={action} noValidate className="car-card" style={{ gap: 12 }}>
      <h2>{w.add}</h2>
      <span className="set-muted">{w.hint}</span>
      <div className="rt-field"><label className="rt-field-label" htmlFor="textSi">{w.si}</label>
        <textarea id="textSi" name="textSi" rows={10} value={si} onChange={(e) => setSi(e.currentTarget.value)} className="rt-input" style={{ minHeight: 180 }} /></div>
      <div className="rt-field"><label className="rt-field-label" htmlFor="textEn">{w.en}</label>
        <textarea id="textEn" name="textEn" rows={10} value={en} onChange={(e) => setEn(e.currentTarget.value)} className="rt-input" style={{ minHeight: 180 }} /></div>
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions"><Button type="submit" icon="check" disabled={pending || !ready}>{w.save}</Button></div>
    </form>
  );
}

export function ApproveForm({ id, label, w }: { id: string; label: string; w: W }) {
  const [state, action, pending] = useActionState<WordingState, FormData>(approveWordingAction.bind(null, id), {});
  const ready = useReady();
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div><Button type="submit" icon="stamp" disabled={pending || !ready}>{label}</Button></div>
    </form>
  );
}
