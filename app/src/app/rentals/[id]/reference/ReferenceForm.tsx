'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { addReferenceAction, addRefCopyAction, type RefState } from '../../actions';

// 05.6 Reference person (ST-05.5): name, NIC and phone are needed; how they know the customer is optional; the three
// copies may come later (system design 6, Confirmed 8 Nov 2026). The server checks every field and file again.
type W = Record<string, string> & { errors: Record<string, string>; relationships: Record<string, string> };
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf';
const FIELD: Record<string, string> = { nameMissing: 'name', nicInvalid: 'nic', phoneInvalid: 'phone' };

export function ReferenceForm({ rentalId, kinds, w }: { rentalId: string; kinds: Record<string, string>; w: W }) {
  const [state, action, pending] = useActionState<RefState, FormData>(addReferenceAction.bind(null, rentalId), {});
  const ready = useReady();
  const [rel, setRel] = useState(state.values?.relationship ?? '');
  const e = (f: string) => (state.error && FIELD[state.error] === f ? w.errors[state.error] : undefined);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="relationship" value={rel} />
      <section className="car-card" aria-labelledby="ref-h">
        <h2 id="ref-h">{w.title}</h2>
        <span className="set-muted">{w.note}</span>
        <TextField name="name" label={w.name} required requiredLabel="*" autoComplete="off" defaultValue={state.values?.name} error={e('name')} />
        <div className="car-fields">
          <TextField name="nic" label={w.nic} required requiredLabel="*" autoComplete="off" defaultValue={state.values?.nic} hint={w.nicHint} error={e('nic')} />
          <TextField name="phone" label={w.phone} required requiredLabel="*" inputMode="tel" autoComplete="off" defaultValue={state.values?.phone} error={e('phone')} />
        </div>
        <fieldset className="set-card" style={{ border: 0, padding: 0, gap: 8 }}>
          <legend className="set-rules-title">{w.relationship}</legend>
          <div className="set-choices">
            {Object.entries(w.relationships).map(([k, label]) => (
              <label key={k} className="set-choice"><span className="set-choice-title"><input type="radio" name="relChoice" checked={rel === k} onChange={() => setRel(k)} />{label}</span></label>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="car-card" aria-labelledby="copies-h">
        <h2 id="copies-h">{w.copies}</h2>
        <div className="cus-copies">
          {Object.entries(kinds).map(([k, label]) => (
            <label key={k} className="cus-copy">
              <span style={{ fontWeight: 600 }}>{label}</span>
              <input type="file" name={k} accept={ACCEPT} aria-label={label} />
              {state.kind === k && state.error ? <span className="rt-field-error" role="alert">{w.errors[state.error] ?? w.errors.failed}</span> : null}
            </label>
          ))}
        </div>
        <span className="set-muted">{w.copiesNote}</span>
      </section>
      {state.error && !FIELD[state.error] && !state.kind ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/rentals/${rentalId}/terms`}>{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !ready}>{w.save}</Button>
      </div>
    </form>
  );
}

/** Adds one missing reference copy from the rental's page. */
export function RefCopyForm({ rentalId, referenceId, kind, label, w }: { rentalId: string; referenceId: string; kind: string; label: string; w: W }) {
  const [state, action, pending] = useActionState<RefState, FormData>(addRefCopyAction.bind(null, rentalId, referenceId, kind), {});
  const ready = useReady();
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-ref-copy={kind}>
      <input type="file" name="file" accept={ACCEPT} aria-label={label} />
      {state.error ? <span className="rt-field-error" role="alert">{w.errors[state.error] ?? w.errors.failed}</span> : null}
      <div><Button type="submit" variant="secondary" disabled={pending || !ready}>{w.addCopy}</Button></div>
    </form>
  );
}
