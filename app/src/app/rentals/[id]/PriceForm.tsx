'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../ui';
import { useReady } from '../../useReady';
import { askAction, withdrawAction, type FormState } from '../../approvals/actions';

// 05.7 Ask for a different price (#56): a new daily rate for the whole rental or a discount off the bill, with a
// reason. The effect is shown as typed; the server checks the limits again. Kept in React state (#24).
type W = Record<string, string> & { errors: Record<string, string> };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const toNum = (s: string) => { const t = s.replace(/,/g, '').trim(); return /^\d{1,9}$/.test(t) ? Number(t) : NaN; };

export function PriceForm({ rentalId, rate, days, estimate, partner, w }: { rentalId: string; rate: number; days: number; estimate: number; partner: boolean; w: W }) {
  const [state, action, pending] = useActionState<FormState, FormData>(askAction.bind(null, rentalId), {});
  const ready = useReady();
  const [kind, setKind] = useState(state.values?.kind ?? 'rate');
  const [amount, setAmount] = useState(state.values?.amount ?? '');
  const [reason, setReason] = useState(state.values?.reason ?? '');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const n = toNum(amount);
  const effect = Number.isFinite(n) ? (kind === 'rate' ? (n - rate) * days : -n) : null;
  const err = state.error;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-price-form>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="reason" value={reason} />
      <div className="set-choices" role="radiogroup" aria-label={w.kind}>
        <label className="set-choice"><span className="set-choice-title"><input type="radio" name="kindChoice" checked={kind === 'rate'} onChange={() => setKind('rate')} />{w.kindRate}</span></label>
        <label className="set-choice"><span className="set-choice-title"><input type="radio" name="kindChoice" checked={kind === 'discount'} onChange={() => setKind('discount')} />{w.kindDiscount}</span></label>
      </div>
      <TextField name="amountBox" label={kind === 'rate' ? w.newRate : w.discountAmount} inputMode="numeric" autoComplete="off" required value={amount}
        onChange={(e) => setAmount(e.currentTarget.value)} hint={kind === 'rate' ? fill(w.rateHint, { rate: money(rate), days }) : fill(w.discountHint, { estimate: money(estimate) })}
        error={err === 'amountInvalid' || err === 'sameRate' ? w.errors[err] : undefined} />
      {effect !== null ? <span data-effect={effect}>{fill(w.effect, { effect: effect < 0 ? `− ${money(-effect)}` : `+ ${money(effect)}` })} · {partner ? w.bearsPartner : w.bearsSns}</span> : null}
      <TextField name="reasonBox" label={w.reason} autoComplete="off" required value={reason} onChange={(e) => setReason(e.currentTarget.value)}
        error={err === 'reasonMissing' || err === 'tooLong' ? w.errors[err] : undefined} />
      {err && !['amountInvalid', 'sameRate', 'reasonMissing', 'tooLong'].includes(err) ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <span className="set-muted">{w.nothingChanges}</span>
      <div><Button type="submit" disabled={pending || !ready || !Number.isFinite(n) || !reason.trim()}>{w.send}</Button></div>
    </form>
  );
}

export function WithdrawForm({ rentalId, requestId, label }: { rentalId: string; requestId: string; label: string }) {
  const [, action, pending] = useActionState<FormState, FormData>(withdrawAction.bind(null, rentalId, requestId), {});
  const ready = useReady();
  return <form action={action}><Button type="submit" variant="quiet" disabled={pending || !ready}>{label}</Button></form>;
}
