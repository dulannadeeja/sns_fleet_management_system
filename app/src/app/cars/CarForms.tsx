'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, TextField } from '../../ui';
import { addCarAction, editCarAction, type CarFormState } from './actions';

export interface FieldWords { label: string; unit: string; hint: string; range: string }
export interface CarWords {
  fields: Record<string, FieldWords>; errors: Record<string, string>; package: string; packageFrom: string; partnerTerms: string; partnerNote: string;
  newRentalsOnly: string; save: string; saveChanges: string; cancel: string; car: string; registration: string; registrationHint: string;
  model: string; modelHint: string; owner: string; sns: string; snsHint: string; partner: string; partnerHint: string; requiredMark: string;
  costs: Record<string, string>; ownerPays: string; ownerPaysNote: string;
}
type Pkg = Record<string, number | null>;
const PACKAGE = ['dailyRate', 'kmPerDay', 'extraKmRate', 'longRentalExtra', 'longRentalFromDay', 'garageDayCharge'];

function Fields({ keys, values, onChange, w, bad, readOnly }: {
  keys: string[]; values: Record<string, string>; onChange: (k: string, v: string) => void; w: CarWords; bad: string[]; readOnly?: boolean;
}) {
  return (
    <div className="car-fields">
      {keys.map((k) => (
        <TextField key={k} name={k} label={w.fields[k].label} inputMode="numeric" autoComplete="off" readOnly={readOnly}
          hint={[w.fields[k].unit, w.fields[k].hint, w.fields[k].range].filter(Boolean).join(' · ')} value={values[k] ?? ''}
          onChange={(e) => onChange(k, e.target.value)} error={bad.includes(k) ? w.fields[k].range : undefined} />
      ))}
    </div>
  );
}
/** Which costs the partner pays on this car: ticked boxes; "ownerPaysShown" tells the server they were on the form. */
function Costs({ w, chosen, onChange, readOnly }: { w: CarWords; chosen: string[]; onChange: (c: string[]) => void; readOnly?: boolean }) {
  return (
    <fieldset className="car-costs">
      <legend>{w.ownerPays}</legend>
      <input type="hidden" name="ownerPaysShown" value="1" />
      {/* Sent from React's state, not the boxes: React resets a form's fields after each save attempt. */}
      {chosen.map((k) => <input key={k} type="hidden" name="ownerPays" value={k} />)}
      {Object.entries(w.costs).map(([k, label]) => (
        <label key={k}><input type="checkbox" value={k} checked={chosen.includes(k)} disabled={readOnly}
          onChange={(e) => onChange(e.target.checked ? [...chosen, k] : chosen.filter((c) => c !== k))} />{label}</label>
      ))}
      <span className="set-muted">{w.ownerPaysNote}</span>
    </fieldset>
  );
}
const asText = (p: Pkg) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v === null ? '' : String(v)]));

/** 04.4: a car's package and terms. Hidden fields carry what the form showed, so only changed values are saved. */
export function EditCarForm({ carId, terms, costs, partnerCar, seeCommission, editCommission, w }: {
  carId: string; terms: Pkg; costs: string[]; partnerCar: boolean; seeCommission: boolean; editCommission: boolean; w: CarWords;
}) {
  const [chosen, setChosen] = useState(costs);
  const [state, action, pending] = useActionState<CarFormState, FormData>(editCarAction.bind(null, carId), {});
  const [values, setValues] = useState(() => asText(terms));
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const keysShown = [...PACKAGE, ...(partnerCar && seeCommission ? ['commissionPercent'] : [])];
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {state.error && state.error !== 'invalid' ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      {keysShown.map((k) => <input key={k} type="hidden" name={`was.${k}`} value={terms[k] === null ? '' : String(terms[k])} />)}
      <section className="car-card"><h2>{w.package}</h2>
        <Fields keys={PACKAGE} values={values} onChange={set} w={w} bad={state.fields ?? []} />
        <Notice icon="lock">{w.newRentalsOnly}</Notice>
      </section>
      {partnerCar && seeCommission ? (
        <section className="car-card"><h2>{w.partnerTerms}</h2>
          <Fields keys={['commissionPercent']} values={values} onChange={set} w={w} bad={state.fields ?? []} readOnly={!editCommission} />
          <input type="hidden" name="was.ownerPays" value={costs.join(',')} />
          <Costs w={w} chosen={chosen} onChange={setChosen} readOnly={!editCommission} />
          <span className="set-muted">{w.partnerNote}</span>
        </section>
      ) : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={`/cars/${carId}`}>{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending}>{w.saveChanges}</Button>
      </div>
    </form>
  );
}

/** 04.8: a new car. Choosing a model fills its starting package, which can be changed before saving. */
export function AddCarForm({ models, starting, defaults, seeCommission, editCommission, w }: {
  models: string[]; starting: Record<string, Pkg>; defaults: Pkg; seeCommission: boolean; editCommission: boolean; w: CarWords;
}) {
  const [state, action, pending] = useActionState<CarFormState, FormData>(addCarAction, {});
  const [model, setModel] = useState(state.values?.model ?? models[0]);
  const [ownership, setOwnership] = useState(state.values?.ownership ?? 'sns');
  const [values, setValues] = useState(() => asText({ ...defaults, ...starting[models[0]] }));
  const [chosen, setChosen] = useState<string[]>([]);
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const pick = (m: string) => { setModel(m); setValues((s) => ({ ...s, ...asText(starting[m]) })); };
  const err = state.error;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section className="car-card"><h2>{w.car}</h2>
        <TextField name="registration" label={w.registration} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={state.values?.registration}
          hint={w.registrationHint} error={err && err.startsWith('registration') ? w.errors[err] : undefined} style={{ maxWidth: 320 }} />
        <fieldset className="set-card" style={{ border: 0, padding: 0, gap: 8 }}>
          <legend className="set-rules-title">{`${w.model} ${w.requiredMark}`}</legend>
          <div className="set-choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {models.map((m) => (
              <label key={m} className="set-choice"><span className="set-choice-title">
                <input type="radio" name="model" value={m} checked={model === m} onChange={() => pick(m)} />{m}</span></label>
            ))}
          </div>
          <span className="set-muted">{w.modelHint}</span>
        </fieldset>
        <fieldset className="set-card" style={{ border: 0, padding: 0, gap: 8 }}>
          <legend className="set-rules-title">{w.owner}</legend>
          <div className="set-choices">
            {[['sns', w.sns, w.snsHint], ['partner', w.partner, w.partnerHint]].map(([v, label, hint]) => (
              <label key={v} className="set-choice"><span className="set-choice-title">
                <input type="radio" name="ownership" value={v} checked={ownership === v} onChange={() => setOwnership(v)} />{label}</span>
                <span className="set-choice-hint">{hint}</span></label>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="car-card"><h2>{w.package}</h2>
        <span className="set-muted">{w.packageFrom.replace('{model}', model)}</span>
        <Fields keys={PACKAGE} values={values} onChange={set} w={w} bad={state.fields ?? []} />
        <Notice icon="lock">{w.newRentalsOnly}</Notice>
      </section>
      {ownership === 'partner' && seeCommission ? (
        <section className="car-card"><h2>{w.partnerTerms}</h2>
          <Fields keys={['commissionPercent']} values={values} onChange={set} w={w} bad={state.fields ?? []} readOnly={!editCommission} />
          {editCommission ? <Costs w={w} chosen={chosen} onChange={setChosen} /> : null}
          <span className="set-muted">{w.partnerNote}</span>
        </section>
      ) : null}
      {err && !err.startsWith('registration') ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href="/cars">{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending}>{w.save}</Button>
      </div>
    </form>
  );
}
