'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { saveTermsAction, type TermsState } from '../../actions';

// 05.4 Deposit and payment (ST-05.4, ST-05.5). Choices are kept in React state and sent as hidden fields: React resets
// a form's own fields after each save attempt (#24). The server checks everything again.
type W = Record<string, string> & { errors: Record<string, string> };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export function TermsForm({ rentalId, saved, fuelPrice, references, preselect, w }: {
  rentalId: string; fuelPrice: number | null; preselect: string | null; w: W;
  saved: { deposit: string; waive: boolean; waiveReason: string; rentPaid: string; fuel: string; referenceRequired: boolean | null; referencePersonId: string };
  references: { id: string; name: string; nic: string; missing: string }[];
}) {
  const [state, action, pending] = useActionState<TermsState, FormData>(saveTermsAction.bind(null, rentalId), {});
  const ready = useReady();
  const sv = state.values;
  const [waive, setWaive] = useState(sv ? sv.waive === '1' : saved.waive);
  const [rentPaid, setRentPaid] = useState(sv?.rentPaid ?? saved.rentPaid);
  const [fuel, setFuel] = useState(sv?.fuel ?? (saved.fuel || 'notCounted'));
  const [refReq, setRefReq] = useState(sv ? sv.referenceRequired === '1' : preselect ? true : saved.referenceRequired);
  const [refId, setRefId] = useState(sv?.referencePersonId ?? preselect ?? saved.referencePersonId);
  const e = (k: string) => (state.error === k ? w.errors[k] : undefined);
  const other = state.error && !['depositInvalid', 'reasonMissing', 'tooLong'].includes(state.error) ? (w.errors[state.error] ?? w.errors.failed) : null;
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="waive" value={waive ? '1' : '0'} />
      <input type="hidden" name="rentPaid" value={rentPaid} />
      <input type="hidden" name="fuel" value={fuel} />
      <input type="hidden" name="referenceRequired" value={refReq === null ? '' : refReq ? '1' : '0'} />
      <input type="hidden" name="referencePersonId" value={refReq ? refId : ''} />
      <section className="car-card" aria-labelledby="dep-h">
        <h2 id="dep-h">{w.deposit}</h2>
        {!waive ? <TextField name="deposit" label={w.depositLabel} inputMode="numeric" autoComplete="off" defaultValue={sv?.deposit ?? saved.deposit} hint={w.depositHint} error={e('depositInvalid')} /> : null}
        <span className="set-muted">{w.depositNote}</span>
        <label className="set-choice-title" style={{ fontWeight: 400 }}><input type="checkbox" checked={waive} onChange={(ev) => setWaive(ev.currentTarget.checked)} />{w.waive}</label>
        {waive ? <TextField name="waiveReason" label={w.waiveReason} autoComplete="off" defaultValue={sv?.waiveReason ?? saved.waiveReason} error={e('reasonMissing') ?? e('tooLong')} /> : null}
      </section>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.rentPaid}</legend>
        <div className="set-choices">
          {([['return', w.rentReturn, w.rentReturnNote], ['now', w.rentNow, '']] as const).map(([k, label, note]) => (
            <label key={k} className="set-choice"><span className="set-choice-title"><input type="radio" name="rentPaidChoice" checked={rentPaid === k} onChange={() => setRentPaid(k)} />{label}</span>
              {note ? <span className="set-muted">{note}</span> : null}</label>
          ))}
        </div>
      </fieldset>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.fuel}</legend>
        <div className="set-choices">
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="fuelChoice" checked={fuel === 'notCounted'} onChange={() => setFuel('notCounted')} />{w.fuelNotCounted}</span>
            <span className="set-muted">{w.fuelNotCountedNote}</span></label>
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="fuelChoice" checked={fuel === 'sameLevel'} disabled={fuelPrice === null} onChange={() => setFuel('sameLevel')} />{w.fuelSame}</span>
            <span className="set-muted">{fuelPrice === null ? w.fuelNoPrice : fill(w.fuelSameNote, { price: money(fuelPrice) })}</span></label>
        </div>
      </fieldset>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.reference}</legend>
        <div className="set-choices">
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="refChoice" checked={refReq === false} onChange={() => setRefReq(false)} />{w.refNo}</span></label>
          <label className="set-choice"><span className="set-choice-title"><input type="radio" name="refChoice" checked={refReq === true} onChange={() => setRefReq(true)} />{w.refYes}</span>
            <span className="set-muted">{w.refYesNote}</span></label>
        </div>
        {refReq ? (
          <div className="set-choices" role="radiogroup" aria-label={w.refPick}>
            {references.length ? references.map((r) => (
              <label key={r.id} className="set-choice" data-reference={r.nic}><span className="set-choice-title"><input type="radio" name="refPerson" checked={refId === r.id} onChange={() => setRefId(r.id)} />{r.name}</span>
                <span className="set-muted">{`NIC ${r.nic}${r.missing ? ` · ${fill(w.refCopiesMissing, { list: r.missing })}` : ''}`}</span></label>
            )) : <span className="set-muted">{w.refNone}</span>}
          </div>
        ) : null}
        {refReq ? <div><Link className="rt-btn rt-btn-secondary" href={`/rentals/${rentalId}/reference`}>{w.refAdd}</Link></div> : null}
      </fieldset>
      {other ? <Notice tone="danger">{other}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="arrowRight" disabled={pending || !ready || refReq === null || !rentPaid}>{w.save}</Button>
      </div>
    </form>
  );
}
