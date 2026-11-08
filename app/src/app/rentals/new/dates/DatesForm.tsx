'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, TextField } from '../../../../ui';
import { useReady } from '../../../useReady';
import { deadlineFor, estimate, type RateTerms } from '../../../../lib/rental-days';
import { saveRentalAction, type SaveState } from '../../actions';
import type { RentalWords } from '../../words';

// 05.3 Dates and estimate (ST-05.3): the days, the return deadline and the estimate, worked out with the same functions
// the server uses (src/lib/rental-days.ts). The server works it all out again at the save, from the car's terms then.
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export function DatesForm({ customerId, vehicleId, goAheadId, plate, terms, cutoff, deadline, lang, back, w }: {
  customerId: string; vehicleId: string; goAheadId: string | null; plate: string; terms: RateTerms; cutoff: string; deadline: string;
  lang: string; back: string; w: RentalWords;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveRentalAction.bind(null, customerId, vehicleId, goAheadId), {});
  const ready = useReady();
  const [daysText, setDaysText] = useState(state.days ?? '1');
  const days = /^\d{1,2}$/.test(daysText) && Number(daysText) >= 1 && Number(daysText) <= 90 ? Number(daysText) : null;
  const now = new Date();
  const locale = lang === 'si' ? 'si-LK' : 'en-GB';
  const when = (d: Date) => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' }).format(d);
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const e = days ? estimate(terms, days) : null;
  const err = state.error ? (w.errors[state.error] ?? w.errors.failed) : null;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section className="car-card" aria-labelledby="days-h">
        <h2 id="days-h">{w.days}</h2>
        <div className="ren-days">
          <TextField name="days" label={w.days} inputMode="numeric" value={daysText} onChange={(ev) => setDaysText(ev.currentTarget.value.replace(/\D/g, '').slice(0, 2))}
            hint={w.daysHint} error={state.error === 'daysInvalid' || (daysText && !days) ? w.errors.daysInvalid : undefined} />
        </div>
        <dl className="ren-lines">
          <dt>{w.pickup}</dt><dd>{fill(w.pickupNow, { time: when(now) })}</dd>
          <dt>{w.backBy}</dt><dd data-deadline>{days ? when(deadlineFor(now, days, cutoff, deadline)) : '—'}</dd>
        </dl>
        <span className="set-muted">{fill(w.dayRule, { cutoff, deadline })}</span>
      </section>
      <section className="car-card" aria-labelledby="est-h">
        <h2 id="est-h">{w.estimate}</h2>
        {e ? (
          <dl className="ren-lines" data-estimate={e.total}>
            <dt>{fill(w.base, { days: e.days, rate: money(terms.dailyRate) })}</dt><dd>{money(e.base)}</dd>
            {e.longRental ? <><dt>{w.longRental}</dt><dd>{`${fill(w.longRentalValue, { n: e.longRentalDays, rate: money(terms.longRentalExtra) })} = ${money(e.longRental)}`}</dd></> : null}
            <dt>{w.includedKm}</dt><dd>{fill(w.kmValue, { km: money(e.includedKm) })}</dd>
            <dt>{w.extraKm}</dt><dd>{fill(w.extraKmValue, { rate: money(terms.extraKmRate) })}</dd>
            <dt className="ren-total">{w.total}</dt><dd className="ren-total">{fill(w.totalValue, { total: money(e.total) })}</dd>
          </dl>
        ) : null}
        <span className="set-muted">{fill(w.lockNote, { plate })}</span>
      </section>
      {err && state.error !== 'daysInvalid' ? <Notice tone="danger">{err}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href={back}>{w.steps.car}</Link>
        <Button type="submit" icon="arrowRight" disabled={pending || !ready || !days}>{fill(w.save, { plate })}</Button>
      </div>
    </form>
  );
}
