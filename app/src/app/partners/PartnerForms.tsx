'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, PlateBadge, TextField, type Lang } from '../../ui';
import { addPartnerAction, recordSignedAction, type PartnerFormState } from './actions';

export interface FreeCar { id: string; plate: string; model: string; commission: number; perDay: string }
export interface PartnerWords {
  name: string; nic: string; nicHint: string; phone: string; phoneHint: string; password: string; passwordHint: string; bank: string; bankHint: string;
  chooseCars: string; chooseCarsHint: string; noFreeCars: string; termsFor: string; perDayNote: string; commission: string; commissionHint: string;
  ownerPays: string; ownerPaysNote: string; costs: Record<string, string>; save: string; cancel: string; requiredMark: string; errors: Record<string, string>;
  signedLabel: string; record: string;
}
const FIELD_ERRORS: Record<string, string> = { nameMissing: 'name', nicInvalid: 'nic', nicTaken: 'nic', phoneMissing: 'phone', phoneInvalid: 'phone', phoneTaken: 'phone', passwordShort: 'password', bankTooLong: 'bankAccount' };

/** 11.3: a partner, their account and their cars, each with its commission and the costs the owner pays. */
export function AddPartnerForm({ cars, w, lang }: { cars: FreeCar[]; w: PartnerWords; lang: Lang }) {
  const [state, action, pending] = useActionState<PartnerFormState, FormData>(addPartnerAction, {});
  const [chosen, setChosen] = useState<string[]>(state.chosen ?? []);
  // Each chosen car's commission and costs, kept by React so a refused save does not lose them.
  const [terms, setTerms] = useState<Record<string, { commission: string; costs: string[] }>>({});
  const termsOf = (c: FreeCar) => terms[c.id] ?? { commission: String(c.commission), costs: [] };
  const setTerm = (c: FreeCar, patch: Partial<{ commission: string; costs: string[] }>) => setTerms((s) => ({ ...s, [c.id]: { ...termsOf(c), ...patch } }));
  const err = state.error;
  const fieldError = (f: string) => (err && FIELD_ERRORS[err] === f ? w.errors[err] : undefined);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* What is sent comes from React's state, not the boxes: React resets a form's fields after each save attempt. */}
      {chosen.map((id) => <input key={id} type="hidden" name="car" value={id} />)}
      {cars.filter((c) => chosen.includes(c.id)).flatMap((c) => termsOf(c).costs.map((k) => <input key={`${c.id}.${k}`} type="hidden" name={`ownerPays.${c.id}`} value={k} />))}
      <section className="car-card">
        <TextField name="name" label={w.name} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={state.values?.name} error={fieldError('name')} />
        <div className="car-fields">
          <TextField name="nic" label={w.nic} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={state.values?.nic} hint={w.nicHint} error={fieldError('nic')} />
          <TextField name="phone" label={w.phone} required requiredLabel={w.requiredMark} inputMode="tel" maxLength={10} autoComplete="off" defaultValue={state.values?.phone} hint={w.phoneHint} error={fieldError('phone')} />
        </div>
        <TextField name="password" type="password" label={w.password} required requiredLabel={w.requiredMark} autoComplete="new-password" hint={w.passwordHint} error={fieldError('password')} />
        <TextField name="bankAccount" label={w.bank} autoComplete="off" defaultValue={state.values?.bankAccount} hint={w.bankHint} error={fieldError('bankAccount')} />
      </section>
      <section className="car-card">
        <h2>{`${w.chooseCars} ${w.requiredMark}`}</h2>
        {cars.length ? (
          <div className="ptn-cars">
            {cars.map((c) => (
              <label key={c.id} className="ptn-car">
                <input type="checkbox" value={c.id} checked={chosen.includes(c.id)}
                  onChange={(e) => setChosen((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))} />
                <span style={{ display: 'flex', flexDirection: 'column' }}><PlateBadge plate={c.plate} size="sm" lang={lang} /><span className="car-sub">{c.model}</span></span>
              </label>
            ))}
          </div>
        ) : <Notice tone="warning">{w.noFreeCars}</Notice>}
        <span className="set-muted">{w.chooseCarsHint}</span>
        {err === 'carsMissing' || err === 'carNotFree' ? <span className="rt-field-error" role="alert">{w.errors[err]}</span> : null}
        {cars.filter((c) => chosen.includes(c.id)).map((c) => (
          <div key={c.id} className="ptn-terms">
            <h3>{w.termsFor.replace('{plate}', c.plate)}</h3>
            <div className="car-fields">
              <TextField name={`commission.${c.id}`} label={w.commission} inputMode="numeric" value={termsOf(c).commission} onChange={(e) => setTerm(c, { commission: e.target.value })} hint={w.commissionHint}
                error={err === 'carsInvalid' ? w.errors.carsInvalid : undefined} />
              <span className="set-muted" style={{ alignSelf: 'center' }}>{w.perDayNote.replace('{rate}', c.perDay)}</span>
            </div>
            <fieldset className="car-costs">
              <legend>{w.ownerPays}</legend>
              {Object.entries(w.costs).map(([k, label]) => (
                <label key={k}><input type="checkbox" value={k} checked={termsOf(c).costs.includes(k)}
                  onChange={(e) => setTerm(c, { costs: e.target.checked ? [...termsOf(c).costs, k] : termsOf(c).costs.filter((x) => x !== k) })} />{label}</label>
              ))}
              <span className="set-muted">{w.ownerPaysNote}</span>
            </fieldset>
          </div>
        ))}
      </section>
      {err && !FIELD_ERRORS[err] && !['carsMissing', 'carNotFree', 'carsInvalid'].includes(err) ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href="/partners">{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !cars.length}>{w.save}</Button>
      </div>
    </form>
  );
}

/** 11.2: the date the paper agreement was signed. */
export function SignedForm({ partnerId, w, today }: { partnerId: string; w: PartnerWords; today: string }) {
  const [state, action, pending] = useActionState<PartnerFormState, FormData>(recordSignedAction.bind(null, partnerId), {});
  return (
    <form action={action} noValidate style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 200px', maxWidth: 320 }}>
        <TextField name="signedOn" type="date" label={w.signedLabel} max={today} error={state.error ? w.errors[state.error] ?? w.errors.failed : undefined} />
      </div>
      <Button type="submit" variant="secondary" icon="check" disabled={pending}>{w.record}</Button>
    </form>
  );
}
