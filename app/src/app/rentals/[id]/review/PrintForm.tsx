'use client';
import { useActionState, useState } from 'react';
import { Button, Notice } from '../../../../ui';
import { useReady } from '../../../useReady';
import { printAgreementAction, uploadSignedAction, type PrintState } from '../../actions';

// 05.5: choose the agreement's language and print; and the signed copy's upload (#55). The server checks again.
type W = Record<string, string> & { errors: Record<string, string> };
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf';

export function PrintForm({ rentalId, defaultLanguage, disabled, w }: { rentalId: string; defaultLanguage: string; disabled: boolean; w: W }) {
  const [state, action, pending] = useActionState<PrintState, FormData>(printAgreementAction.bind(null, rentalId), {});
  const ready = useReady();
  const [lang, setLang] = useState(state.language ?? defaultLanguage);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="language" value={lang} />
      <fieldset className="set-card" style={{ border: 0, padding: 0, gap: 8, margin: 0 }}>
        <legend className="set-rules-title">{w.language}</legend>
        <div className="set-choices">
          {(['si', 'en'] as const).map((l) => (
            <label key={l} className="set-choice"><span className="set-choice-title"><input type="radio" name="langChoice" checked={lang === l} onChange={() => setLang(l)} />{w[l]}</span></label>
          ))}
        </div>
      </fieldset>
      {state.error ? <Notice tone="danger">{w.errors[state.error] ?? w.errors.failed}</Notice> : null}
      <div className="set-actions"><Button type="submit" icon="file" disabled={pending || !ready || disabled}>{w.print}</Button></div>
    </form>
  );
}

export function SignedForm({ rentalId, w }: { rentalId: string; w: W }) {
  const [state, action, pending] = useActionState<PrintState, FormData>(uploadSignedAction.bind(null, rentalId), {});
  const ready = useReady();
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-signed-form>
      <input type="file" name="file" accept={ACCEPT} aria-label={w.upload} />
      {state.error ? <span className="rt-field-error" role="alert">{w.errors[state.error] ?? w.errors.failed}</span> : null}
      <div><Button type="submit" variant="secondary" icon="camera" disabled={pending || !ready}>{w.upload}</Button></div>
    </form>
  );
}
