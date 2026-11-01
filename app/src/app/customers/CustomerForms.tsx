'use client';
import { useActionState, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Notice, TextField } from '../../ui';
import { useReady } from '../useReady';
import { addCopyAction, addCustomerAction, correctCustomerAction, correctNicAction, type CustomerFormState } from './actions';

export interface CustomerWords {
  who: string; name: string; nic: string; nicHint: string; phone: string; phoneHint: string; address: string; licence: string; licenceNumber: string;
  licenceExpires: string; licenceNote: string; copies: string; copiesNote: string; copiesLater: string; kinds: Record<string, string>;
  chooseFile: string; reference: string; referenceNote: string; save: string; saveChanges: string; cancel: string; requiredMark: string;
  replace: string; addCopy: string; errors: Record<string, string>;
}
const FIELD_ERRORS: Record<string, string> = { nameMissing: 'name', nicInvalid: 'nic', phoneInvalid: 'phone', licenceNumberMissing: 'licenceNumber', licenceExpiresInvalid: 'licenceExpires' };
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf';

function Details({ w, values, err, withNic }: { w: CustomerWords; values?: Record<string, string>; err?: string; withNic: boolean }) {
  const e = (f: string) => (err && FIELD_ERRORS[err] === f ? w.errors[err] : undefined);
  return (
    <>
      <section className="car-card"><h2>{w.who}</h2>
        <TextField name="name" label={w.name} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={values?.name} error={e('name')} />
        <div className="car-fields">
          {withNic ? <TextField name="nic" label={w.nic} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={values?.nic} hint={w.nicHint} error={e('nic')} /> : null}
          <TextField name="phone" label={w.phone} required requiredLabel={w.requiredMark} inputMode="tel" autoComplete="off" defaultValue={values?.phone} hint={w.phoneHint} error={e('phone')} />
        </div>
        <TextField name="address" label={w.address} autoComplete="off" defaultValue={values?.address} />
      </section>
      <section className="car-card"><h2>{w.licence}</h2>
        <div className="car-fields">
          <TextField name="licenceNumber" label={w.licenceNumber} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={values?.licenceNumber} error={e('licenceNumber')} />
          <TextField name="licenceExpires" type="date" label={w.licenceExpires} required requiredLabel={w.requiredMark} defaultValue={values?.licenceExpires} error={e('licenceExpires')} />
        </div>
        <span className="set-muted">{w.licenceNote}</span>
      </section>
    </>
  );
}

/** 08.3: a new customer with any copies already taken. A NIC already recorded opens that customer (AT-51). */
export function NewCustomerForm({ w }: { w: CustomerWords }) {
  const [state, action, pending] = useActionState<CustomerFormState, FormData>(addCustomerAction, {});
  const ready = useReady();
  // Checked in the browser first, so a refused save rarely happens: React empties the file boxes after a save attempt
  // (#19 review). The server checks everything again, the files from their own bytes.
  const [local, setLocal] = useState<{ error: string; kind?: string } | null>(null);
  const check = (e: FormEvent<HTMLFormElement>) => {
    const f = new FormData(e.currentTarget);
    const missing = (['name', 'nic', 'phone', 'licenceNumber', 'licenceExpires'] as const).find((k) => !String(f.get(k) ?? '').trim());
    const tooBig = Object.keys(w.kinds).find((k) => { const v = f.get(k); return v instanceof File && v.size > 10 * 1024 * 1024; });
    const badType = Object.keys(w.kinds).find((k) => { const v = f.get(k); return v instanceof File && v.size > 0 && !/\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(v.name); });
    const problem = missing ? { error: { name: 'nameMissing', nic: 'nicInvalid', phone: 'phoneInvalid', licenceNumber: 'licenceNumberMissing', licenceExpires: 'licenceExpiresInvalid' }[missing] }
      : tooBig ? { error: 'fileTooBig', kind: tooBig } : badType ? { error: 'fileType', kind: badType } : null;
    setLocal(problem);
    if (problem) e.preventDefault();
  };
  const err = local?.error ?? state.error;
  const errKind = local ? local.kind : state.kind;
  return (
    <form action={action} onSubmit={check} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Details w={w} values={state.values} err={err} withNic />
      <section className="car-card"><h2>{w.copies}</h2>
        <div className="cus-copies">
          {Object.entries(w.kinds).map(([k, label]) => (
            <label key={k} className="cus-copy">
              <span style={{ fontWeight: 600 }}>{label}</span>
              <input type="file" name={k} accept={ACCEPT} aria-label={`${label} · ${w.chooseFile}`} />
              {errKind === k && err ? <span className="rt-field-error" role="alert">{w.errors[err]}</span> : null}
            </label>
          ))}
        </div>
        <span className="set-muted">{w.copiesNote}</span>
        <span className="set-muted">{w.copiesLater}</span>
      </section>
      <section className="car-card" style={{ background: 'var(--sunken)' }}>
        <h2>{w.reference}</h2><span className="set-muted">{w.referenceNote}</span>
      </section>
      {err && !FIELD_ERRORS[err] && !errKind ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href="/customers">{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !ready}>{w.save}</Button>
      </div>
    </form>
  );
}

/** 08.2 "Correct details": not the NIC. Hidden fields carry what the form showed, so only changed details are saved. */
export function CorrectCustomerForm({ customerId, saved, w }: { customerId: string; saved: Record<string, string>; w: CustomerWords }) {
  const [state, action, pending] = useActionState<CustomerFormState, FormData>(correctCustomerAction.bind(null, customerId), {});
  const ready = useReady();
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(saved).map(([k, v]) => <input key={k} type="hidden" name={`was.${k}`} value={v} />)}
      <Details w={w} values={state.values ?? saved} err={state.error} withNic={false} />
      {state.error && !FIELD_ERRORS[state.error] ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/customers/${customerId}`}>{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !ready}>{w.saveChanges}</Button>
      </div>
    </form>
  );
}

/** 08.2: add or replace one copy. */
export function AddCopyForm({ customerId, kind, has, w }: { customerId: string; kind: string; has: boolean; w: CustomerWords }) {
  const [state, action, pending] = useActionState<CustomerFormState, FormData>(addCopyAction.bind(null, customerId, kind), {});
  const ready = useReady();
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input type="file" name="file" accept={ACCEPT} aria-label={`${w.kinds[kind]} · ${w.chooseFile}`} />
      {state.error ? <span className="rt-field-error" role="alert">{w.errors[state.error] ?? w.errors.failed}</span> : null}
      <div><Button type="submit" variant="secondary" disabled={pending || !ready}>{has ? w.replace : w.addCopy}</Button></div>
    </form>
  );
}

export interface NicWords { nicNew: string; nicHint: string; reason: string; save: string; requiredMark: string; errors: Record<string, string> }

/** 08.2: correct a mistyped NIC (the owner or the admin; the module checks). */
export function CorrectNicForm({ customerId, w }: { customerId: string; w: NicWords }) {
  const [state, action, pending] = useActionState<CustomerFormState, FormData>(correctNicAction.bind(null, customerId), {});
  const ready = useReady();
  const err = state.error;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="car-fields">
        <TextField name="nic" label={w.nicNew} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={state.values?.nic} hint={w.nicHint}
          error={err === 'nicInvalid' || err === 'nicTaken' ? w.errors[err] : undefined} />
        <TextField name="reason" label={w.reason} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={state.values?.reason}
          error={err === 'reasonMissing' ? w.errors[err] : undefined} />
      </div>
      {err && !['nicInvalid', 'nicTaken', 'reasonMissing'].includes(err) ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions"><Button type="submit" variant="secondary" disabled={pending || !ready}>{w.save}</Button></div>
    </form>
  );
}
