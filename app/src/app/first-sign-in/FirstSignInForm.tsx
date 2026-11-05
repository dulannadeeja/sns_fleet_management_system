'use client';
import { useActionState, useState } from 'react';
import { Button, Icon, TextField, bi, type Lang } from '../../ui';
import { firstSignInAction, type FirstSignInState } from './actions';

export interface FirstSignInWords {
  newPassword: string; newPasswordPlaceholder: string; repeat: string; repeatPlaceholder: string; required: string; rule: string;
  language: string; si: string; en: string; save: string; tooShort: string; notSame: string; signedOut: string;
}

/** Screen 01.2's form: two password fields, the rule, the language choice, and Save in the card's footer. */
export function FirstSignInForm({ words, language, hello, intro }: { words: FirstSignInWords; language: Lang; hello: string; intro: string }) {
  const [state, action, pending] = useActionState<FirstSignInState, FormData>(firstSignInAction, {});
  const [lang, setLang] = useState<Lang>(language);
  return (
    <form action={action} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
          <h1 style={{ margin: 0, fontSize: 22, lineHeight: '32px', fontWeight: 600 }}>{hello}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: '24px', color: 'var(--ink-muted)' }}>{intro}</p>
        </section>
        <TextField label={words.newPassword} name="password" type="password" autoComplete="new-password" placeholder={words.newPasswordPlaceholder}
          required requiredLabel={words.required} error={state.error === 'tooShort' ? words.tooShort : undefined} />
        <TextField label={words.repeat} name="repeat" type="password" autoComplete="new-password" placeholder={words.repeatPlaceholder}
          required requiredLabel={words.required} error={state.error === 'notSame' ? words.notSame : undefined} />
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sunken)', borderRadius: 12, fontSize: 14, lineHeight: '22px', color: 'var(--ink-muted)' }}>
          <span style={{ flex: 'none', display: 'flex' }}><Icon name="info" size={20} /></span>
          <span>{words.rule}</span>
        </div>
        <div role="group" aria-label={words.language} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="rt-field-label">{bi(words.language)}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="start-choice" lang="si" aria-pressed={lang === 'si'} onClick={() => setLang('si')}>{words.si}</button>
            <button type="button" className="start-choice" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>{words.en}</button>
          </div>
          <input type="hidden" name="language" value={lang} />
        </div>
      </div>
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--line)' }}>
        <Button type="submit" icon="check" full disabled={pending}>{words.save}</Button>
      </div>
    </form>
  );
}
