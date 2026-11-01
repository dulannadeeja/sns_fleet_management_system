'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, TextField } from '../../../../ui';
import { changeSettingsAction, type ChangeState } from '../actions';
import { showSetting, type SettingWords } from '../show';

export interface Field { key: string; label: string; hint: string; type: 'time' | 'number'; saved: string; errors: Record<string, string> }
export interface ChangeWords extends SettingWords {
  check: string; noChange: string; changeLine: string; logNote: string; save: string; cancel: string; formErrors: Record<string, string>;
}

/** 15.7: one group of owner settings. The check box shows old → new as the owner types; the server checks again. */
export function ChangeForm({ group, fields, w, lang }: { group: string; fields: Field[]; w: ChangeWords; lang: string }) {
  const [state, action, pending] = useActionState<ChangeState, FormData>(changeSettingsAction.bind(null, group), {});
  const [typed, setTyped] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, f.saved])));
  const changes = fields.filter((f) => typed[f.key].trim() !== f.saved);
  const formError = state.errors?.form;
  return (
    <form action={action} noValidate className="set-card" style={{ gap: 18 }}>
      {formError ? <Notice tone="danger">{w.formErrors[formError] ?? w.formErrors.failed}</Notice> : null}
      {fields.map((f) => <input key={f.key} type="hidden" name={`was.${f.key}`} value={f.saved} />)}
      <div className="set-fields">
        {fields.map((f) => {
          const code = state.errors?.[f.key];
          return (
            <TextField key={f.key} label={f.label} name={f.key} type={f.type === 'time' ? 'time' : 'text'} hint={f.hint}
              inputMode={f.type === 'number' ? 'numeric' : undefined} autoComplete="off" step={f.type === 'time' ? 60 : undefined}
              value={typed[f.key]} onChange={(e) => setTyped((t) => ({ ...t, [f.key]: e.target.value }))}
              error={code ? f.errors[code] : undefined} />
          );
        })}
      </div>
      <div className="set-check" aria-live="polite">
        <span style={{ fontWeight: 600 }}>{w.check}</span>
        {changes.length ? changes.map((f) => (
          <span key={f.key} className="set-rule-value" data-change={f.key}>
            {w.changeLine.replace('{name}', f.label).replace('{old}', showSetting(f.key, f.saved, w, lang)).replace('{new}', showSetting(f.key, typed[f.key].trim(), w, lang))}
          </span>
        )) : <span>{w.noChange}</span>}
        <span className="set-muted">{w.logNote}</span>
      </div>
      <div className="set-actions">
        <Link className="rt-btn rt-btn-quiet" href="/settings/business-rules">{w.cancel}</Link>
        <Button type="submit" icon="check" disabled={pending || !changes.length}>{w.save}</Button>
      </div>
    </form>
  );
}
