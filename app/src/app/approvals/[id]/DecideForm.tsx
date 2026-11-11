'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button, Notice, TextField } from '../../../ui';
import { useReady } from '../../useReady';
import { decideAction, type FormState } from '../actions';

// The confirm step of 10.2, 10.3 and 10.4 (#56). Typed values are kept in React state: React resets a form's own fields
// after each save attempt (#24). The partner's share of the extra is in rupees (11 Nov 2026); the server checks again.
type W = Record<string, string> & { errors: Record<string, string> };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const toNum = (s: string) => { const t = s.replace(/,/g, '').trim(); return /^\d{1,9}$/.test(t) ? Number(t) : NaN; };

export function DecideForm({ requestId, approve, split, w, history }: {
  requestId: string; approve: boolean; split: { extra: number; packageRate: number; days: number; commission: number | null; may: boolean; line?: boolean } | null; w: W; history: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideAction.bind(null, requestId, approve), {});
  const ready = useReady();
  const [note, setNote] = useState(state.values?.note ?? '');
  const [partnerExtra, setPartnerExtra] = useState(state.values?.partnerExtra ?? '');
  const [splitReason, setSplitReason] = useState(state.values?.splitReason ?? '');
  const money = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const pe = toNum(partnerExtra);
  const splitOk = !split || (Number.isFinite(pe) && pe >= 0 && pe <= split.extra && splitReason.trim().length > 0);
  const err = state.error;
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="note" value={note} />
      <input type="hidden" name="partnerExtra" value={partnerExtra} />
      <input type="hidden" name="splitReason" value={splitReason} />
      {split ? (
        <section className="car-card" aria-labelledby="s-h" data-split>
          <h2 id="s-h">{fill(split.line ? w.lineSplitTitle : w.splitTitle, { extra: money(split.extra) })}</h2>
          {!split.may ? <Notice tone="warning">{w.errors.splitNotAllowed}</Notice> : null}
          <TextField name="partnerExtraBox" label={w.partnerExtra} inputMode="numeric" autoComplete="off" required value={partnerExtra} onChange={(e) => setPartnerExtra(e.currentTarget.value)}
            hint={split.line ? fill(w.lineHint, { extra: money(split.extra) }) : split.commission === null ? fill(w.partnerExtraHintPlain, { extra: money(split.extra) }) : fill(w.partnerExtraHint, { extra: money(split.extra), commission: split.commission })} error={err === 'splitInvalid' ? w.errors.splitInvalid : undefined} />
          {Number.isFinite(pe) && pe <= split.extra ? <span className="set-muted" data-split-shown>{fill(w.splitShown, { sns: money(split.extra - pe), partner: money(pe) })}</span> : null}
          <TextField name="splitReasonBox" label={w.splitReason} autoComplete="off" required value={splitReason} onChange={(e) => setSplitReason(e.currentTarget.value)}
            error={err === 'splitReasonMissing' ? w.errors.splitReasonMissing : undefined} />
          {!split.line ? <span className="set-muted">{w.partnerSees}</span> : null}
        </section>
      ) : null}
      <section className="car-card">
        <TextField name="noteBox" label={approve ? w.noteOptional : w.noteRequired} autoComplete="off" required={!approve} value={note} onChange={(e) => setNote(e.currentTarget.value)}
          hint={history} error={err === 'noteMissing' || err === 'tooLong' ? w.errors[err] : undefined} />
      </section>
      {err && !['noteMissing', 'tooLong', 'splitInvalid', 'splitReasonMissing'].includes(err) ? <Notice tone="danger">{w.errors[err] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href="/approvals">{w.back}</Link>
        <Button type="submit" variant={approve ? 'primary' : 'danger'} disabled={pending || !ready || (!approve && !note.trim()) || !splitOk || (!!split && !split.may)}>
          {approve ? (split ? w.approveSplit : w.approve) : w.reject}
        </Button>
      </div>
    </form>
  );
}
