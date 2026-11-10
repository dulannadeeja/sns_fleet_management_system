'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { addHandoverPhotoAction, freeCarAction, handOverAction, type FreeState, type HandoverState, type PrintState } from '../../actions';

// 06.4 Handover checklist (#57). Everything typed is kept in React state and sent as one JSON field: React resets a
// form's own fields after each save attempt (#24). The server checks everything again.
type W = Record<string, string> & { errors: Record<string, string> };
const FUELS = ['empty', 'quarter', 'half', 'threeQuarters', 'full'] as const;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export function HandoverForm({ rentalId, accessories, lastKm, blocked, papersExpired, mayOverride, w }: {
  rentalId: string; accessories: string[]; lastKm: number | null; blocked: boolean; papersExpired: boolean; mayOverride: boolean; w: W & { fuels: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<HandoverState, FormData>(handOverAction.bind(null, rentalId), {});
  const ready = useReady();
  const [km, setKm] = useState('');
  const [fuel, setFuel] = useState('');
  // Every item starts unticked: staff tick what is in the car, then confirm they checked (10 Nov 2026).
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState('');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const payload = JSON.stringify({ outKm: km, fuel, accessories: accessories.map((item) => ({ item, present: present[item] === true })), checked, papersReason: reason });
  const missingItems = accessories.filter((a) => present[a] !== true);
  const err = state.error;
  const kmErr = err === 'kmInvalid' ? w.errors.kmInvalid : err === 'kmLower' ? fill(w.errors.kmLower, { km: money(state.lastKm ?? 0) }) : undefined;
  const papersBlocked = papersExpired && !mayOverride;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="payload" value={payload} />
      <section className="car-card" aria-labelledby="h-km">
        <h2 id="h-km">{w.odometer}</h2>
        <TextField name="outKm" label={w.odometerLabel} inputMode="numeric" autoComplete="off" required value={km} onChange={(e) => setKm(e.currentTarget.value)}
          hint={lastKm === null ? w.odometerHintNone : fill(w.odometerHint, { km: money(lastKm) })} error={kmErr} />
      </section>
      <fieldset className="car-card" style={{ margin: 0 }}>
        <legend className="set-rules-title">{w.fuel}</legend>
        <div className="set-choices" role="radiogroup">
          {FUELS.map((f) => (
            <label key={f} className="set-choice"><span className="set-choice-title"><input type="radio" name="fuelChoice" checked={fuel === f} onChange={() => setFuel(f)} />{w.fuels[f]}</span></label>
          ))}
        </div>
        <span className="set-muted">{w.fuelNote}</span>
      </fieldset>
      <fieldset className="car-card" style={{ margin: 0 }} data-accessories>
        <legend className="set-rules-title">{fill(w.accessories, { there: accessories.length - missingItems.length, total: accessories.length })}</legend>
        <div className="set-choices">
          {accessories.map((a) => (
            <label key={a} className="set-choice"><span className="set-choice-title" style={{ fontWeight: 400 }}>
              <input type="checkbox" checked={present[a] === true} onChange={(e) => { const on = e.currentTarget.checked; setPresent((p) => ({ ...p, [a]: on })); }} />{a}</span></label>
          ))}
        </div>
        <span className="set-muted">{w.accessoriesNote}</span>
        <label className="set-choice-title" data-checked-box><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.currentTarget.checked)} />{w.checkedBox}</label>
        {checked && missingItems.length ? <span className="set-muted">{fill(w.accessoriesMissing, { list: missingItems.join(', ') })}</span> : null}
      </fieldset>
      {papersExpired ? (
        <section className="car-card" aria-labelledby="h-papers">
          <h2 id="h-papers">{w.papers}</h2>
          {papersBlocked ? <Notice tone="warning">{w.papersNotAllowed}</Notice>
            : <TextField name="papersReason" label={w.papersReason} autoComplete="off" required value={reason} onChange={(e) => setReason(e.currentTarget.value)}
              hint={w.papersHint} error={err === 'reasonMissing' ? w.errors.reasonMissing : err === 'tooLong' ? w.errors.tooLong : undefined} />}
        </section>
      ) : null}
      {err && !['kmInvalid', 'kmLower', 'reasonMissing', 'tooLong'].includes(err) ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Button type="submit" icon="arrowRight" disabled={pending || !ready || blocked || papersBlocked || !km.trim() || !fuel || !checked || (papersExpired && !reason.trim())}>{w.handOver}</Button>
      </div>
      <span className="set-muted">{blocked ? w.blockedNote : w.readyNote}</span>
    </form>
  );
}

export function PhotoForm({ rentalId, w }: { rentalId: string; w: W }) {
  const [state, action, pending] = useActionState<PrintState, FormData>(addHandoverPhotoAction.bind(null, rentalId), {});
  const ready = useReady();
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-photo-form>
      <input type="file" name="file" accept="image/jpeg,image/png,image/webp" aria-label={w.addPhoto} />
      {state.error ? <span className="rt-field-error" role="alert">{w.errors[state.error] ?? w.errors.failed}</span> : null}
      <div><Button type="submit" variant="secondary" icon="camera" disabled={pending || !ready}>{w.addPhoto}</Button></div>
    </form>
  );
}

/** Frees the car of a rental not collected, nothing paid (#57; 10 Nov 2026). */
export function FreeCarForm({ rentalId, w }: { rentalId: string; w: W }) {
  const [state, action, pending] = useActionState<FreeState, FormData>(freeCarAction.bind(null, rentalId), {});
  const ready = useReady();
  const [reason, setReason] = useState(state.reason ?? '');
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-free-form>
      <input type="hidden" name="reason" value={reason} />
      <TextField name="reasonBox" label={w.freeReason} autoComplete="off" required value={reason} onChange={(e) => setReason(e.currentTarget.value)} hint={w.freeHint}
        error={state.error === 'reasonMissing' || state.error === 'tooLong' ? w.errors[state.error] : undefined} />
      {state.error && !['reasonMissing', 'tooLong'].includes(state.error) ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div><Button type="submit" variant="danger" disabled={pending || !ready || !reason.trim()}>{w.freeCar}</Button></div>
    </form>
  );
}
