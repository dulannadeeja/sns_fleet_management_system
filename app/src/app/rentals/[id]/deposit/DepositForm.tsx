'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { planDeposit } from '../../../../lib/deposit-plan';
import { settleDepositAction, type DepositState } from '../../actions';

// 07.3 Use deposit and refund (#64). The choices stay in React state and go as one JSON field with the amounts shown;
// the server works them out again and refuses if anything changed since (`stale`).
type W = Record<string, string> & { errors: Record<string, string> };
type Older = { rentalId: string; number: number; unpaid: number; label: string };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export function DepositForm({ rentalId, mayRefund, facts, w }: { rentalId: string; mayRefund: boolean; w: W;
  facts: { number: string; billTotal: number; billUnpaid: number; held: number; older: Older[] } }) {
  const [state, action, pending] = useActionState<DepositState, FormData>(settleDepositAction.bind(null, rentalId), {});
  const ready = useReady();
  const [agreed, setAgreed] = useState(false);
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<'' | 'cash' | 'bank'>('');
  const [reference, setReference] = useState('');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const plan = planDeposit(facts.held, facts.billUnpaid, facts.older, agreed);
  const label = (id: string) => facts.older.find((o) => o.rentalId === id)?.label ?? '';
  const payload = JSON.stringify({ agreed, note, method: plan.refund > 0 ? method : '', reference,
    shown: { held: facts.held, here: plan.here, older: plan.olderTotal, refund: plan.refund } });
  const blocked = (agreed && !note.trim()) || (plan.refund > 0 && (!mayRefund || !method || (method === 'bank' && !reference.trim())));
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-deposit-form>
      <input type="hidden" name="payload" value={payload} />
      <section className="car-card" aria-label={facts.number}>
        <dl className="ren-lines">
          <dt>{w.bill}</dt><dd>{money(facts.billTotal)}</dd>
          <dt>{w.paid}</dt><dd>{money(facts.billTotal - facts.billUnpaid)}</dd>
          <dt>{w.held}</dt><dd data-held={facts.held}>{money(facts.held)}</dd>
        </dl>
      </section>
      {/* Older bills only matter when something is left after this bill. */}
      {facts.older.length && facts.held > facts.billUnpaid ? (
        <section className="car-card" aria-labelledby="dep-older">
          <h2 id="dep-older" className="set-rules-title">{w.olderTitle}</h2>
          <ul className="set-muted" style={{ margin: 0, paddingLeft: 18 }}>
            {facts.older.map((o) => <li key={o.rentalId}>{fill(w.olderLine, { number: o.label, amount: money(o.unpaid) })}</li>)}
          </ul>
          <label className="set-choice"><span className="set-choice-title">
            <input type="checkbox" name="agreedBox" checked={agreed} onChange={(e) => setAgreed(e.currentTarget.checked)} />{w.agreed}</span></label>
          {agreed ? <TextField name="noteBox" label={w.agreementNote} hint={w.agreementHint} autoComplete="off" value={note} onChange={(e) => setNote(e.currentTarget.value)} /> : null}
        </section>
      ) : null}
      <section className="car-card" aria-labelledby="dep-what" data-plan-here={plan.here} data-plan-refund={plan.refund}>
        <h2 id="dep-what" className="set-rules-title">{w.whatHappens}</h2>
        <dl className="ren-lines">
          <dt>{w.usedHere}</dt><dd>{money(plan.here)}</dd>
          {plan.older.map((o) => <span key={o.rentalId} style={{ display: 'contents' }}><dt>{fill(w.usedOlder, { number: label(o.rentalId) })}</dt><dd>{money(o.amount)}</dd></span>)}
          <dt>{w.back}</dt><dd>{money(plan.refund)}</dd>
          <dt className="ren-total">{w.left}</dt><dd className="ren-total">0</dd>
        </dl>
        <span className="set-muted">{w.note}</span>
      </section>
      {plan.refund > 0 ? (
        mayRefund ? (
          <fieldset className="car-card" style={{ margin: 0 }}>
            <legend className="set-rules-title">{fill(w.refundHow, { amount: money(plan.refund) })} <span className="ren-missing">({w.required})</span></legend>
            <div className="set-choices">
              <label className="set-choice"><span className="set-choice-title"><input type="radio" name="methodChoice" checked={method === 'cash'} onChange={() => setMethod('cash')} />{w.cash}</span>
                <span className="set-muted">{w.cashHint}</span></label>
              <label className="set-choice"><span className="set-choice-title"><input type="radio" name="methodChoice" checked={method === 'bank'} onChange={() => setMethod('bank')} />{w.bank}</span>
                <span className="set-muted">{w.bankHint}</span></label>
            </div>
            {method === 'bank' ? <TextField name="referenceBox" label={w.reference} autoComplete="off" value={reference} onChange={(e) => setReference(e.currentTarget.value)} /> : null}
            <span className="set-muted">{w.refundNote}</span>
          </fieldset>
        ) : <Notice tone="warning">{w.noRefundRight}</Notice>
      ) : null}
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="check" disabled={pending || !ready || blocked}>{plan.refund > 0 ? fill(w.save, { amount: money(plan.refund) }) : w.saveNoRefund}</Button>
      </div>
    </form>
  );
}
