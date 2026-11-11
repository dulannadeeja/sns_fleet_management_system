'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { writeOffAction, type WriteOffState } from '../../actions';

// 08.6 Write off a debt (#65): the reason, all of the debt or part of it. The debt shown goes with the form; the server
// refuses if it changed since (`stale`).
type W = Record<string, string> & { errors: Record<string, string> };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const toNum = (s: string) => { const t = s.replace(/,/g, '').trim(); return /^\d{1,9}$/.test(t) ? Number(t) : 0; };

export function WriteOffForm({ customerId, debt, rentals, w }: { customerId: string; debt: number; rentals: { label: string; unpaid: number }[]; w: W }) {
  const [state, action, pending] = useActionState<WriteOffState, FormData>(writeOffAction.bind(null, customerId, debt), {});
  const ready = useReady();
  const [reason, setReason] = useState(state.values?.reason ?? '');
  const [part, setPart] = useState(state.values?.part === '1');
  const [amount, setAmount] = useState(state.values?.amount ?? '');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const total = part ? toNum(amount) : debt;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-write-off-form>
      <input type="hidden" name="reason" value={reason} /><input type="hidden" name="part" value={part ? '1' : ''} /><input type="hidden" name="amount" value={part ? amount : String(debt)} />
      <section className="car-card" aria-label={w.debt}>
        <span className="set-muted">{w.debt}</span>
        <b style={{ fontSize: 24, color: 'var(--overdue)' }} data-debt={debt}>{`LKR ${money(debt)}`}</b>
        <span className="set-muted">{rentals.map((r) => `${r.label}: ${money(r.unpaid)}`).join(' · ')}</span>
      </section>
      <TextField name="reasonBox" label={w.reason} hint={w.reasonHint} autoComplete="off" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.howMuch}</legend>
        <div className="set-choices">
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="howMuch" checked={!part} onChange={() => setPart(false)} />{w.all}</span>
            <span className="set-muted">{`LKR ${money(debt)}`}</span></label>
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="howMuch" checked={part} onChange={() => setPart(true)} />{w.part}</span>
            <span className="set-muted">{w.partHint}</span></label>
        </div>
        {part ? <TextField name="amountBox" label={w.amount} inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => setAmount(e.currentTarget.value)} /> : null}
      </fieldset>
      <section className="car-card" aria-labelledby="wo-what">
        <h2 id="wo-what" className="set-rules-title">{w.whatTitle}</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}><li>{w.what1}</li><li>{w.what2}</li><li>{w.what3}</li><li>{w.what4}</li></ul>
      </section>
      <Notice>{w.only}</Notice>
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" variant="danger" disabled={pending || !ready || !reason.trim() || total < 1 || total > debt}>{fill(w.save, { amount: money(total) })}</Button>
      </div>
    </form>
  );
}
