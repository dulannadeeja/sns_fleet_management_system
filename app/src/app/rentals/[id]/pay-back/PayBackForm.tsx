'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { payBackAction, type PayBackState } from '../../actions';

// Pay back money above a lowered bill (#65): how much (all of it is filled in), and how.
type W = Record<string, string> & { errors: Record<string, string> };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const toNum = (s: string) => { const t = s.replace(/,/g, '').trim(); return /^\d{1,9}$/.test(t) ? Number(t) : 0; };

export function PayBackForm({ rentalId, formKey, above, w }: { rentalId: string; formKey: string; above: number; w: W }) {
  const [state, action, pending] = useActionState<PayBackState, FormData>(payBackAction.bind(null, rentalId, formKey), {});
  const ready = useReady();
  const [amount, setAmount] = useState(state.values?.amount ?? String(above));
  const [method, setMethod] = useState(state.values?.method ?? '');
  const [reference, setReference] = useState(state.values?.reference ?? '');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const n = toNum(amount);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-pay-back-form>
      <input type="hidden" name="amount" value={amount} /><input type="hidden" name="method" value={method} /><input type="hidden" name="reference" value={reference} />
      <section className="car-card" aria-label={w.above}>
        <dl className="ren-lines"><dt>{w.above}</dt><dd data-above={above}>{`LKR ${money(above)}`}</dd></dl>
        <span className="set-muted">{w.note}</span>
      </section>
      <TextField name="amountBox" label={w.amount} inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => setAmount(e.currentTarget.value)} />
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.how}</legend>
        <div className="set-choices">
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="methodChoice" checked={method === 'cash'} onChange={() => setMethod('cash')} />{w.cash}</span>
            <span className="set-muted">{w.cashHint}</span></label>
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="methodChoice" checked={method === 'bank'} onChange={() => setMethod('bank')} />{w.bank}</span>
            <span className="set-muted">{w.bankHint}</span></label>
        </div>
        {method === 'bank' ? <TextField name="referenceBox" label={w.reference} autoComplete="off" value={reference} onChange={(e) => setReference(e.currentTarget.value)} /> : null}
      </fieldset>
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="check" disabled={pending || !ready || n < 1 || n > above || !method || (method === 'bank' && !reference.trim())}>{fill(w.save, { amount: money(n) })}</Button>
      </div>
    </form>
  );
}
