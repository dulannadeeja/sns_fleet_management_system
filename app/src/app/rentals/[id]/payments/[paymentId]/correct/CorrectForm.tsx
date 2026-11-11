'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../../../ui';
import { useReady } from '../../../../../useReady';
import { askCorrectionAction, type CorrectState } from '../../../../actions';

// 09.5 Payment correction request (#65). The choices stay in React state and go as one JSON field.
type W = Record<string, string> & { errors: Record<string, string>; fixes: Record<string, string> };
type Fix = 'amount' | 'method' | 'reference' | 'rental';
type Method = 'cash' | 'bank' | 'card';
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export function CorrectForm({ rentalId, paymentId, facts, methods, w }: { rentalId: string; paymentId: string; methods: Record<string, string>; w: W;
  facts: { rental: string; for: 'bill' | 'deposit'; method: Method; reference: string | null; amount: number; recordedBy: string; others: { id: string; label: string; unpaid: number }[] } }) {
  const [state, action, pending] = useActionState<CorrectState, FormData>(askCorrectionAction.bind(null, rentalId, paymentId), {});
  const ready = useReady();
  const [fix, setFix] = useState<Fix | ''>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method | ''>('');
  const [reference, setReference] = useState('');
  const [toRental, setToRental] = useState('');
  const [reason, setReason] = useState('');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const fixes: Fix[] = ['amount', 'method', ...(facts.method !== 'cash' ? ['reference' as const] : []), ...(facts.for === 'bill' ? ['rental' as const] : [])];
  const payload = JSON.stringify({ fix, amount, method, reference, toRental, reason });
  const filled = fix === 'amount' ? amount.trim() !== '' : fix === 'method' ? !!method && (method === 'cash' || !!reference.trim()) : fix === 'reference' ? !!reference.trim() : fix === 'rental' ? !!toRental : false;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-correct-form>
      <input type="hidden" name="payload" value={payload} />
      <section className="car-card" aria-labelledby="c-now">
        <h2 id="c-now" className="set-rules-title">{w.recordedNow} <span className="set-muted">· {w.kept}</span></h2>
        <dl className="ren-lines">
          <dt>{w.rental}</dt><dd>{`${facts.rental} · ${facts.for === 'deposit' ? w.deposit : w.bill}`}</dd>
          <dt>{w.how}</dt><dd>{`${methods[facts.method] ?? facts.method}${facts.reference ? ` · ${facts.reference}` : ''}`}</dd>
          <dt>{w.amount}</dt><dd data-part={facts.amount}>{`LKR ${money(facts.amount)}`}</dd>
          <dt>{w.recordedBy}</dt><dd>{facts.recordedBy}</dd>
        </dl>
      </section>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.what} <span className="ren-missing">({w.required})</span></legend>
        <div className="set-choices">
          {fixes.map((f) => <label key={f} className="set-choice"><span className="set-choice-title"><input type="radio" name="fixChoice" checked={fix === f} onChange={() => setFix(f)} />{w.fixes[f]}</span></label>)}
        </div>
      </fieldset>
      {fix ? (
        <fieldset className="car-card" style={{ margin: 0 }}>
          <legend className="set-rules-title">{w.should} <span className="ren-missing">({w.required})</span></legend>
          {fix === 'amount' ? <TextField name="amountBox" label={w.newAmount} hint={w.newAmountHint} inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => setAmount(e.currentTarget.value)} /> : null}
          {fix === 'method' ? (
            <>
              <div className="set-choices">
                {(['cash', 'bank', 'card'] as const).filter((m) => m !== facts.method).map((m) => (
                  <label key={m} className="set-choice"><span className="set-choice-title"><input type="radio" name="methodChoice" checked={method === m} onChange={() => setMethod(m)} />{methods[m] ?? m}</span></label>
                ))}
              </div>
              {method && method !== 'cash' ? <TextField name="referenceBox" label={w.newReference} hint={w.referenceHint} autoComplete="off" value={reference} onChange={(e) => setReference(e.currentTarget.value)} /> : null}
            </>
          ) : null}
          {fix === 'reference' ? <TextField name="referenceBox" label={w.newReference} hint={w.referenceHint} autoComplete="off" value={reference} onChange={(e) => setReference(e.currentTarget.value)} /> : null}
          {fix === 'rental' ? (facts.others.length ? (
            <div className="set-choices">
              {facts.others.map((o) => <label key={o.id} className="set-choice"><span className="set-choice-title"><input type="radio" name="rentalChoice" checked={toRental === o.id} onChange={() => setToRental(o.id)} />{fill(w.otherLine, { number: o.label, unpaid: money(o.unpaid) })}</span></label>)}
            </div>
          ) : <span className="set-muted">{w.noOther}</span>) : null}
        </fieldset>
      ) : null}
      <TextField name="reasonBox" label={w.reason} hint={w.reasonHint} autoComplete="off" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
      <Notice>{w.note}</Notice>
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="stamp" disabled={pending || !ready || !fix || !filled || !reason.trim()}>{w.send}</Button>
      </div>
    </form>
  );
}
