'use client';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../ui';
import { useReady } from '../../useReady';
import { correctGarageAction, type GarageState } from '../actions';

// 07.2 the admin corrects the garage days when the car is back (#63): a dated line for the difference; the first stays.
type W = Record<string, string> & { errors: Record<string, string> };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export function GarageForm({ rentalId, days, partner, w }: { rentalId: string; days: number; partner: boolean; w: W }) {
  const [state, action, pending] = useActionState<GarageState, FormData>(correctGarageAction.bind(null, rentalId), {});
  const ready = useReady();
  const [v, setV] = useState({ days: state.values?.days ?? String(days), reason: state.values?.reason ?? '', partnerRupees: state.values?.partnerRupees ?? '' });
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-garage-form>
      <input type="hidden" name="days" value={v.days} /><input type="hidden" name="reason" value={v.reason} /><input type="hidden" name="partnerRupees" value={v.partnerRupees} />
      <span style={{ fontWeight: 600 }}>{fill(w.garageTitle, { days })}</span>
      <TextField name="daysBox" label={w.garageDaysNow} inputMode="numeric" autoComplete="off" value={v.days} onChange={(e) => { const x = e.currentTarget.value; setV((s) => ({ ...s, days: x })); }} />
      {partner ? <TextField name="partnerBox" label={w.garagePartner} autoComplete="off" value={v.partnerRupees} onChange={(e) => { const x = e.currentTarget.value; setV((s) => ({ ...s, partnerRupees: x })); }} hint={w.garagePartnerHint} /> : null}
      <TextField name="reasonBox" label={w.garageReason} autoComplete="off" value={v.reason} onChange={(e) => { const x = e.currentTarget.value; setV((s) => ({ ...s, reason: x })); }} />
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div><Button type="submit" variant="secondary" disabled={pending || !ready || !v.reason.trim()}>{w.garageSave}</Button></div>
    </form>
  );
}
