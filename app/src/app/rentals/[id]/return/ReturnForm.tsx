'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { receiveCarAction, type ReturnState } from '../../actions';

// 07.1 Return and payment, 07.2 Garage days (#63). Everything typed is kept in React state and sent as one JSON field
// (React resets a form's own fields after each save attempt, #24). The bill shown here is a preview; the server works
// it out again from the rental's saved terms and checks every rule.
type W = Record<string, string> & { errors: Record<string, string>; states: Record<string, string> };
type Facts = { outKm: number; outFuel: string; accessories: { item: string; present: boolean }[]; days: number; kmPerDay: number; extraKmRate: number; sameLevel: boolean;
  fuelPrice: number; garageRate: number; partner: boolean; lateMinutes: number; deadline: string; estimate: number; paid: number; depositHeld: number; mayPayLater: boolean };
const FUELS = ['empty', 'quarter', 'half', 'threeQuarters', 'full'] as const;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const toNum = (s: string) => { const t = s.replace(/,/g, '').trim(); return /^\d{1,9}$/.test(t) ? Number(t) : NaN; };

export function ReturnForm({ rentalId, facts: f, w, fuels }: { rentalId: string; facts: Facts; w: W; fuels: Record<string, string> }) {
  const [state, action, pending] = useActionState<ReturnState, FormData>(receiveCarAction.bind(null, rentalId), {});
  const ready = useReady();
  const [inKm, setInKm] = useState('');
  const [fuel, setFuel] = useState('');
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [lateWaive, setLateWaive] = useState(false);
  const [late, setLate] = useState({ amount: '', reason: '' });
  const [fuelWaive, setFuelWaive] = useState(false);
  const [fuelCharge, setFuelCharge] = useState({ litres: '', reason: '' });
  const [takenOut, setTakenOut] = useState('');
  const [items, setItems] = useState<Record<string, { amount: string; reason: string }>>({});
  const [hasDamage, setHasDamage] = useState(false);
  const [damage, setDamage] = useState({ what: '', amount: '' });
  const [garage, setGarage] = useState('');
  const [next, setNext] = useState('');
  const [nextReason, setNextReason] = useState('');
  const [note, setNote] = useState('');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const km = toNum(inKm);
  const driven = Number.isFinite(km) ? km - f.outKm : NaN;
  const extraKm = Number.isFinite(driven) ? Math.max(0, driven - f.days * f.kmPerDay) : 0;
  const lower = fuel ? FUELS.indexOf(fuel as (typeof FUELS)[number]) < FUELS.indexOf(f.outFuel as (typeof FUELS)[number]) : false;
  const newlyMissing = f.accessories.filter((a) => a.present && present[a.item] !== true).map((a) => a.item);
  const itemTotal = newlyMissing.reduce((n, i) => n + (toNum(items[i]?.amount ?? '') || 0), 0);
  const preview = f.estimate + extraKm * f.extraKmRate + (f.lateMinutes > 0 && !lateWaive ? toNum(late.amount) || 0 : 0)
    + (f.sameLevel && lower && !fuelWaive ? (toNum(fuelCharge.litres) || 0) * f.fuelPrice : 0) + (checked ? itemTotal : 0) + (hasDamage ? toNum(damage.amount) || 0 : 0);
  const unpaid = preview - f.paid - f.depositHeld;
  const payload = JSON.stringify({
    inKm, fuel, checked, accessories: f.accessories.map((a) => ({ item: a.item, present: present[a.item] === true })), fuelTakenOut: takenOut,
    ...(f.lateMinutes > 0 ? { late: { waive: lateWaive, amount: late.amount, reason: late.reason } } : {}),
    ...(f.sameLevel && lower ? { fuelCharge: { waive: fuelWaive, litres: fuelCharge.litres, reason: fuelCharge.reason } } : {}),
    accessoryCharges: newlyMissing.map((item) => ({ item, amount: items[item]?.amount ?? '', reason: items[item]?.reason ?? '' })),
    ...(hasDamage ? { damage } : {}), ...(hasDamage && garage.trim() ? { garageDays: garage } : {}),
    nextState: next, nextReason, payLaterNote: note,
  });
  const err = state.error;
  const errText = err ? fill(w.errors[err] ?? w.errors.failed, { km: money(state.outKm ?? 0), item: state.item ?? '', unpaid: money(state.unpaid ?? 0), minutes: state.lateMinutes ?? 0 }) : null;
  const h = Math.floor(f.lateMinutes / 60); const m = String(f.lateMinutes % 60).padStart(2, '0');
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="payload" value={payload} />
      <section className="car-card" aria-labelledby="r-km">
        <h2 id="r-km">{w.odometer}</h2>
        <TextField name="inKm" label={w.inKm} inputMode="numeric" autoComplete="off" required value={inKm} onChange={(e) => setInKm(e.currentTarget.value)}
          hint={fill(w.inKmHint, { km: money(f.outKm) })} error={err === 'kmLower' || err === 'kmInvalid' ? errText ?? undefined : undefined} />
        {Number.isFinite(driven) && driven >= 0 ? <span className="set-muted" data-driven={driven}>{fill(w.driven, { driven: money(driven), included: money(f.days * f.kmPerDay), extra: money(extraKm), rate: f.extraKmRate })}</span> : null}
      </section>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{fill(w.fuel, { out: fuels[f.outFuel] ?? f.outFuel })}</legend>
        <div className="set-choices" role="radiogroup">
          {FUELS.map((x) => <label key={x} className="set-choice"><span className="set-choice-title"><input type="radio" name="fuelChoice" checked={fuel === x} onChange={() => setFuel(x)} />{fuels[x]}</span></label>)}
        </div>
        {f.sameLevel && lower ? (
          <div data-fuel-charge style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!fuelWaive ? <TextField name="litres" label={w.litres} inputMode="numeric" autoComplete="off" value={fuelCharge.litres} onChange={(e) => { const v = e.currentTarget.value; setFuelCharge((s) => ({ ...s, litres: v })); }}
              hint={fill(w.litresHint, { price: money(f.fuelPrice) })} /> : null}
            <label className="set-choice-title" style={{ fontWeight: 400 }}><input type="checkbox" checked={fuelWaive} onChange={(e) => setFuelWaive(e.currentTarget.checked)} />{w.fuelWaive}</label>
            {fuelWaive ? <TextField name="fuelReason" label={w.reason} autoComplete="off" value={fuelCharge.reason} onChange={(e) => { const v = e.currentTarget.value; setFuelCharge((s) => ({ ...s, reason: v })); }} /> : null}
          </div>
        ) : <span className="set-muted">{f.sameLevel ? w.fuelSameNote : w.fuelNotCounted}</span>}
        <TextField name="takenOut" label={w.takenOut} inputMode="numeric" autoComplete="off" value={takenOut} onChange={(e) => setTakenOut(e.currentTarget.value)} hint={w.takenOutHint} />
      </fieldset>
      <fieldset className="car-card" style={{ margin: 0 }} data-accessories>
        <legend className="set-rules-title">{w.accessories}</legend>
        <div className="set-choices">
          {f.accessories.map((a) => (
            <label key={a.item} className="set-choice"><span className="set-choice-title" style={{ fontWeight: 400 }}>
              <input type="checkbox" checked={present[a.item] === true} onChange={(e) => { const on = e.currentTarget.checked; setPresent((p) => ({ ...p, [a.item]: on })); }} />
              {a.present ? a.item : `${a.item} · ${w.missingAtHandover}`}</span></label>
          ))}
        </div>
        <label className="set-choice-title" data-checked-box><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.currentTarget.checked)} />{w.checkedBox}</label>
        {checked && newlyMissing.map((item) => (
          <div key={item} data-missing-item={item} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <TextField name={`item-${item}`} label={fill(w.itemAmount, { item })} inputMode="numeric" autoComplete="off" value={items[item]?.amount ?? ''}
              onChange={(e) => { const v = e.currentTarget.value; setItems((s) => ({ ...s, [item]: { amount: v, reason: s[item]?.reason ?? '' } })); }} hint={f.partner ? w.itemHintPartner : w.itemHint} />
            {items[item]?.amount?.trim() === '0' ? <TextField name={`itemReason-${item}`} label={w.itemReason} autoComplete="off" value={items[item]?.reason ?? ''}
              onChange={(e) => { const v = e.currentTarget.value; setItems((s) => ({ ...s, [item]: { amount: s[item]?.amount ?? '', reason: v } })); }} /> : null}
          </div>
        ))}
      </fieldset>
      {f.lateMinutes > 0 ? (
        <section className="car-card" aria-labelledby="r-late" data-late>
          <h2 id="r-late" className="ren-overdue">{fill(w.late, { h, m, deadline: f.deadline })}</h2>
          {!lateWaive ? <TextField name="lateAmount" label={w.lateAmount} inputMode="numeric" autoComplete="off" value={late.amount} onChange={(e) => { const v = e.currentTarget.value; setLate((s) => ({ ...s, amount: v })); }} hint={w.lateHint} /> : null}
          <label className="set-choice-title" style={{ fontWeight: 400 }}><input type="checkbox" checked={lateWaive} onChange={(e) => setLateWaive(e.currentTarget.checked)} />{w.lateWaive}</label>
          {lateWaive ? <TextField name="lateReason" label={w.reason} autoComplete="off" value={late.reason} onChange={(e) => { const v = e.currentTarget.value; setLate((s) => ({ ...s, reason: v })); }} /> : null}
        </section>
      ) : null}
      <section className="car-card" aria-labelledby="r-dmg">
        <h2 id="r-dmg">{w.damage}</h2>
        <label className="set-choice-title" style={{ fontWeight: 400 }}><input type="checkbox" checked={hasDamage} onChange={(e) => setHasDamage(e.currentTarget.checked)} />{w.damageFound}</label>
        {hasDamage ? <>
          <TextField name="damageWhat" label={w.damageWhat} autoComplete="off" value={damage.what} onChange={(e) => { const v = e.currentTarget.value; setDamage((s) => ({ ...s, what: v })); }} />
          <TextField name="damageAmount" label={w.damageAmount} inputMode="numeric" autoComplete="off" value={damage.amount} onChange={(e) => { const v = e.currentTarget.value; setDamage((s) => ({ ...s, amount: v })); }} hint={f.partner ? w.itemHintPartner : w.itemHint} />
          <TextField name="garageDays" label={w.garageDays} inputMode="numeric" autoComplete="off" value={garage} onChange={(e) => setGarage(e.currentTarget.value)} hint={fill(w.garageHint, { rate: money(f.garageRate) })} />
        </> : null}
      </section>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.next}</legend>
        <span className="set-muted">{w.nextNote}</span>
        <div className="set-choices" role="radiogroup">
          {(['available', 'repair', 'unavailable'] as const).map((x) => <label key={x} className="set-choice"><span className="set-choice-title"><input type="radio" name="nextChoice" checked={next === x} onChange={() => setNext(x)} />{w.states[x]}</span></label>)}
        </div>
        {next && next !== 'available' ? <TextField name="nextReason" label={w.reason} autoComplete="off" value={nextReason} onChange={(e) => setNextReason(e.currentTarget.value)} /> : null}
      </fieldset>
      <section className="car-card" aria-labelledby="r-bill" data-preview={preview}>
        <h2 id="r-bill">{w.billPreview}</h2>
        <span>{fill(w.previewLine, { total: money(preview), paid: money(f.paid), deposit: money(f.depositHeld) })}</span>
        {unpaid > 0 ? (f.mayPayLater
          ? <TextField name="payLaterNote" label={fill(w.payLater, { unpaid: money(unpaid) })} autoComplete="off" value={note} onChange={(e) => setNote(e.currentTarget.value)} hint={w.payLaterHint} />
          : <Notice tone="warning">{fill(w.payLaterNotAllowed, { unpaid: money(unpaid) })}</Notice>) : null}
        <span className="set-muted">{w.billNote}</span>
      </section>
      {err && err !== 'kmLower' && err !== 'kmInvalid' ? <Notice tone="danger">{errText}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="arrowRight" disabled={pending || !ready || !inKm.trim() || !fuel || !checked || !next}>{w.save}</Button>
      </div>
    </form>
  );
}
