'use client';
import { useActionState, useState, type FormEvent } from 'react';
import { phoneDigits } from '../../auth/phone';
import { signInProblems, type SignInProblems } from '../../auth/sign-in-check';
import { Button, Notice, TextField } from '../../ui';
import { signInAction, type SignInState } from './actions';

type Problem = NonNullable<SignInProblems['phone'] | SignInProblems['password']>;
export type SignInWords = { phone: string; password: string; submit: string; wrong: string; locked: string } & Record<Problem, string>;

/** Screen 01.1's form. Each box says exactly what is wrong with what was typed; the phone box takes digits only, 10 at most.
 *  No maxLength on the box: it would cut a pasted "077 123 4567" before the spaces are removed; phoneDigits keeps 10. */
export function SignInForm({ words }: { words: SignInWords }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});
  const [phone, setPhone] = useState(state.phone ?? '');
  const [problems, setProblems] = useState<SignInProblems>({});
  // A new answer from the server replaces the box messages (set during render, as React advises, not in an effect).
  const [answered, setAnswered] = useState(state);
  const [typedSince, setTypedSince] = useState(false);
  if (answered !== state) {
    setAnswered(state);
    setProblems(state.problems ?? {});
    setTypedSince(false);
  }

  // The same check the server makes, so a mistake is named before anything is sent.
  function check(event: FormEvent<HTMLFormElement>) {
    const found = signInProblems(phone, String(new FormData(event.currentTarget).get('password') ?? ''));
    if (found.phone || found.password) {
      event.preventDefault();
      setProblems(found);
    }
  }

  // The server's answer shows until the person types again.
  const error = !typedSince && state.error ? words[state.error] : undefined;
  return (
    <form action={action} onSubmit={check} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <TextField label={words.phone} name="phone" type="tel" inputMode="numeric" autoComplete="username" placeholder="07XXXXXXXX"
        value={phone} error={problems.phone ? words[problems.phone] : undefined}
        onChange={(e) => { setPhone(phoneDigits(e.target.value)); setTypedSince(true); setProblems((p) => ({ ...p, phone: undefined })); }} />
      <TextField label={words.password} name="password" type="password" autoComplete="current-password"
        error={problems.password ? words[problems.password] : undefined}
        onChange={() => { setTypedSince(true); setProblems((p) => ({ ...p, password: undefined })); }} />
      <Button type="submit" icon="arrowRight" full disabled={pending}>{words.submit}</Button>
    </form>
  );
}
