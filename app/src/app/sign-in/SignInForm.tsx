'use client';
import { useActionState } from 'react';
import { Button, Notice, TextField } from '../../ui';
import { signInAction, type SignInState } from './actions';

export interface SignInWords { phone: string; password: string; submit: string; wrong: string; locked: string; missing: string }

export function SignInForm({ words }: { words: SignInWords }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});
  const error = state.error ? words[state.error] : undefined;
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <TextField label={words.phone} name="phone" inputMode="tel" autoComplete="username" placeholder="07X XXX XXXX" defaultValue={state.phone} />
      <TextField label={words.password} name="password" type="password" autoComplete="current-password" />
      <Button type="submit" icon="arrowRight" full disabled={pending}>{words.submit}</Button>
    </form>
  );
}
