'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { useReady } from '../../useReady';
import { Button, Notice, TextField } from '../../../ui';
import { addPackageAction, changeDefaultsAction, changePackageAction, type PackageFormState } from './actions';

// The forms of 04.6 Starting packages (ST-04.4): add a package, change one, change the defaults. Hidden "was.*" fields
// carry what the form showed, so only changed values are saved and a change made meanwhile is refused.
export interface PackageWords {
  fields: Record<string, { label: string; hint: string; range: string }>; errors: Record<string, string>;
  name: string; nameHint: string; models: string; modelsHint: string; addModel: string; addModelHint: string;
  onlyNew: string; commissionNote: string; save: string; cancel: string; requiredMark: string;
}
const RATES = ['dailyRate', 'kmPerDay', 'extraKmRate'];

function Numbers({ keys, start, state, w, readOnly = [] }: { keys: string[]; start: Record<string, number>; state: PackageFormState; w: PackageWords; readOnly?: string[] }) {
  return (
    <div className="car-fields">
      {keys.map((k) => (
        <TextField key={`${k}-${state.values?.[k] ?? start[k]}`} name={k} label={w.fields[k].label} inputMode="numeric" autoComplete="off" readOnly={readOnly.includes(k)}
          hint={w.fields[k].hint} defaultValue={state.values?.[k] ?? String(start[k] ?? '')}
          error={state.fields?.includes(k) ? (state.error === 'stale' ? w.errors.stale : w.fields[k].range) : undefined} />
      ))}
    </div>
  );
}
const Problem = ({ state, w }: { state: PackageFormState; w: PackageWords }) =>
  state.error && state.error !== 'invalid' && !state.error.startsWith('name') && !state.error.startsWith('model')
    ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null;
function Actions({ pending, w }: { pending: boolean; w: PackageWords }) {
  const ready = useReady();
  return (
    <div className="set-actions">
      <Link className="rt-btn rt-btn-quiet" href="/settings/packages">{w.cancel}</Link>
      <Button type="submit" icon="check" disabled={pending || !ready}>{w.save}</Button>
    </div>
  );
}
const nameError = (s: PackageFormState, w: PackageWords) => (s.error?.startsWith('name') ? w.errors[s.error] : undefined);
const modelError = (s: PackageFormState, w: PackageWords) => (s.error?.startsWith('model') ? w.errors[s.error] : undefined);

/** Add a package: its name, models and rates (a new model comes in this way). */
export function AddPackageForm({ w }: { w: PackageWords }) {
  const [state, action, pending] = useActionState<PackageFormState, FormData>(addPackageAction, {});
  return (
    <form action={action} noValidate className="car-card">
      <TextField name="name" label={w.name} required requiredLabel={w.requiredMark} autoComplete="off" hint={w.nameHint}
        defaultValue={state.values?.name} error={nameError(state, w)} />
      <TextField name="models" label={w.models} required requiredLabel={w.requiredMark} autoComplete="off" hint={w.modelsHint}
        defaultValue={state.values?.models} error={modelError(state, w)} />
      <Numbers keys={RATES} start={{}} state={state} w={w} />
      <Notice icon="lock">{w.onlyNew}</Notice>
      <Problem state={state} w={w} />
      <Actions pending={pending} w={w} />
    </form>
  );
}

/** Change a package: its name and rates, and add models (models are never taken out). */
export function ChangePackageForm({ id, pkg, w }: { id: string; pkg: { name: string; models: string[]; dailyRate: number; kmPerDay: number; extraKmRate: number }; w: PackageWords }) {
  const [state, action, pending] = useActionState<PackageFormState, FormData>(changePackageAction.bind(null, id), {});
  const start: Record<string, number> = { dailyRate: pkg.dailyRate, kmPerDay: pkg.kmPerDay, extraKmRate: pkg.extraKmRate };
  return (
    <form action={action} noValidate className="car-card">
      <input type="hidden" name="was.name" value={pkg.name} />
      {RATES.map((k) => <input key={k} type="hidden" name={`was.${k}`} value={String(start[k])} />)}
      <TextField name="name" label={w.name} required requiredLabel={w.requiredMark} autoComplete="off" defaultValue={state.values?.name ?? pkg.name}
        error={nameError(state, w) ?? (state.error === 'stale' && state.fields?.includes('name') ? w.errors.stale : undefined)} />
      <p className="set-muted" style={{ margin: 0 }}>{`${w.models}: ${pkg.models.join(', ')}`}</p>
      <TextField name="addModel" label={w.addModel} autoComplete="off" hint={w.addModelHint} defaultValue={state.values?.addModel} error={modelError(state, w)} />
      <Numbers keys={RATES} start={start} state={state} w={w} />
      <Notice icon="lock">{w.onlyNew}</Notice>
      <Problem state={state} w={w} />
      <Actions pending={pending} w={w} />
    </form>
  );
}

/** Change the defaults every new car starts with; the commission only for people who see partner terms. */
export function DefaultsForm({ defaults, seeCommission, editCommission, w }: { defaults: Record<string, number>; seeCommission: boolean; editCommission: boolean; w: PackageWords }) {
  const [state, action, pending] = useActionState<PackageFormState, FormData>(changeDefaultsAction, {});
  const keys = ['longRentalExtra', 'longRentalFromDay', 'garageDayCharge', ...(seeCommission ? ['commissionPercent'] : [])];
  return (
    <form action={action} noValidate className="car-card">
      {keys.map((k) => <input key={k} type="hidden" name={`was.${k}`} value={String(defaults[k])} />)}
      <Numbers keys={keys} start={defaults} state={state} w={w} readOnly={editCommission ? [] : ['commissionPercent']} />
      {seeCommission ? <span className="set-muted">{w.commissionNote}</span> : null}
      <Notice icon="lock">{w.onlyNew}</Notice>
      <Problem state={state} w={w} />
      <Actions pending={pending} w={w} />
    </form>
  );
}
