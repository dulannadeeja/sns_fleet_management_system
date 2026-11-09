'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { recordPaymentAction, type PayState } from '../../actions';

// 09.3 Record a payment and 09.4 Split payment (#53). Everything typed is kept in React state and sent as one JSON
// field: React resets a form's own fields after each save attempt (#24). The server checks everything again.
type W = Record<string, string> & { errors: Record<string, string>; methods: Record<string, string> };
type Row = { id: string; label: string; estimate: number; paid: number; unpaid: number; depositSet: number | null; depositReceived: number };
type Part = { method: 'cash' | 'bank' | 'card'; amount: string; reference: string };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const toNum = (s: string) => { const t = s.replace(/,/g, '').trim(); return /^\d{1,9}$/.test(t) ? Number(t) : 0; };
const PARTS_MAX = 5; // system design 8.1 (9 Nov 2026); the server checks it again

export function PayForm({ customerId, rentalId, formKey, rentals, w }: { customerId: string; rentalId: string; formKey: string; rentals: Row[]; w: W }) {
  const [state, action, pending] = useActionState<PayState, FormData>(recordPaymentAction.bind(null, customerId, rentalId, formKey), {});
  const ready = useReady();
  const here = rentals[0];
  const depositLeft = here.depositSet === null ? 0 : here.depositSet - here.depositReceived;
  const [payFor, setFor] = useState<'bill' | 'deposit'>('bill');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [depositAmount, setDepositAmount] = useState('');
  const [parts, setParts] = useState<Part[]>([{ method: 'cash', amount: '', reference: '' }]);
  const [reason, setReason] = useState('');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const targets = payFor === 'deposit' ? [{ rentalId: here.id, amount: depositAmount }] : rentals.map((r) => ({ rentalId: r.id, amount: amounts[r.id] ?? '' })).filter((x) => x.amount.trim());
  const total = targets.reduce((s, x) => s + toNum(x.amount), 0);
  // One part: it is the whole amount. Several (09.4): each is typed, and they must add up.
  const sentParts = parts.length === 1 ? [{ ...parts[0], amount: String(total) }] : parts;
  const partsTotal = sentParts.reduce((s, p) => s + toNum(p.amount), 0);
  const left = total - partsTotal;
  const missingRef = sentParts.some((p) => p.method !== 'cash' && !p.reference.trim());
  const payload = JSON.stringify({ for: payFor, rentals: targets, parts: sentParts, reason });
  const setPart = (i: number, p: Partial<Part>) => setParts(parts.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const err = state.error;
  const errText = err ? fill(w.errors[err] ?? w.errors.failed, { rental: rentals.find((r) => r.id === state.rentalId)?.label ?? '' }) : null;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="payload" value={payload} />
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.for}</legend>
        <div className="set-choices">
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="forChoice" checked={payFor === 'bill'} onChange={() => setFor('bill')} />{w.forBill}</span>
            <span className="set-muted">{w.forBillNote}</span></label>
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="forChoice" checked={payFor === 'deposit'} disabled={depositLeft <= 0} onChange={() => setFor('deposit')} />{w.forDeposit}</span>
            <span className="set-muted">{here.depositSet === null ? w.depositNone : fill(w.depositNote, { set: money(here.depositSet), received: money(here.depositReceived) })}</span></label>
        </div>
      </fieldset>
      {payFor === 'bill' ? (
        <section className="car-card" aria-labelledby="pay-bills">
          <h2 id="pay-bills">{w.bills}</h2>
          {rentals.map((r) => (
            <div key={r.id} data-pay-rental={r.label}>
              <TextField name={`amount-${r.id}`} label={fill(w.billAmount, { rental: r.label })} inputMode="numeric" autoComplete="off" value={amounts[r.id] ?? ''}
                onChange={(e) => setAmounts({ ...amounts, [r.id]: e.currentTarget.value })}
                hint={fill(w.billHint, { estimate: money(r.estimate), paid: money(r.paid), unpaid: money(r.unpaid) })} />
            </div>
          ))}
        </section>
      ) : (
        <section className="car-card" aria-labelledby="pay-dep">
          <h2 id="pay-dep">{w.forDeposit}</h2>
          <TextField name="depositAmount" label={w.amount} inputMode="numeric" autoComplete="off" value={depositAmount} onChange={(e) => setDepositAmount(e.currentTarget.value)}
            hint={fill(w.depositLeft, { left: money(depositLeft) })} />
          <span className="set-muted">{w.depositHeld}</span>
        </section>
      )}
      {parts.map((p, i) => (
        <fieldset key={i} className="car-card" style={{ margin: 0 }} data-part={i + 1}>
          <legend className="set-rules-title">{parts.length > 1 ? fill(w.part, { n: i + 1 }) : w.method}</legend>
          <div className="set-choices">
            {(['cash', 'bank', 'card'] as const).map((m) => (
              <label key={m} className="set-choice"><span className="set-choice-title"><input type="radio" name={`method-${i}`} checked={p.method === m} onChange={() => setPart(i, { method: m })} />{w.methods[m]}</span></label>
            ))}
          </div>
          {parts.length > 1 ? <TextField name={`part-${i}`} label={w.amount} inputMode="numeric" autoComplete="off" value={p.amount} onChange={(e) => setPart(i, { amount: e.currentTarget.value })} /> : null}
          {p.method !== 'cash' ? <TextField name={`ref-${i}`} label={p.method === 'bank' ? w.bankRef : w.cardRef} required autoComplete="off" value={p.reference}
            onChange={(e) => setPart(i, { reference: e.currentTarget.value })} hint={p.method === 'bank' ? w.bankRefHint : w.cardRefHint} /> : <span className="set-muted">{w.cashNote}</span>}
          {parts.length > 1 ? <div><Button variant="quiet" onClick={() => setParts(parts.filter((_, j) => j !== i))}>{w.removePart}</Button></div> : null}
        </fieldset>
      ))}
      {parts.length < PARTS_MAX ? <div><Button variant="secondary" onClick={() => setParts([...parts, { method: 'bank', amount: '', reference: '' }])}>{w.addPart}</Button></div> : null}
      <section className="car-card" aria-label={w.total}>
        <dl className="ren-lines" data-pay-total={total}>
          <dt className="ren-total">{w.total}</dt><dd className="ren-total">{fill(w.lkr, { amount: money(total) })}</dd>
          {parts.length > 1 ? <><dt>{w.leftToSplit}</dt><dd data-left={left}>{fill(w.lkr, { amount: money(left) })}</dd></> : null}
        </dl>
        <span className="set-muted">{w.afterSave}</span>
      </section>
      {err === 'sameReference' ? (
        <section className="car-card" aria-labelledby="pay-same">
          <Notice tone="warning">{w.sameReference}</Notice>
          <ul className="set-muted" style={{ margin: 0, paddingLeft: 18 }} id="pay-same">
            {(state.same ?? []).map((s, i) => <li key={i}>{fill(w.sameLine, { number: s.number, amount: money(s.amount), method: w.methods[s.method] ?? s.method, date: new Date(s.at).toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }) })}</li>)}
          </ul>
          <TextField name="sameReason" label={w.sameReason} autoComplete="off" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
        </section>
      ) : err ? <Notice tone="danger">{errText}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="arrowRight" disabled={pending || !ready || total <= 0 || left !== 0 || missingRef || (err === 'sameReference' && !reason.trim())}>
          {sentParts.length > 1 ? fill(w.saveMany, { n: sentParts.length }) : w.save}
        </Button>
      </div>
    </form>
  );
}
