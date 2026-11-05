import type { InputHTMLAttributes } from 'react';
import { bi, cx } from './text';

/** A labelled text input (boards 01.1, 01.2): `label` "සිංහල · English", the required mark in words, a hint, an error that says what to fix. Other props go to the <input>. */
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; name: string; hint?: string; error?: string; requiredLabel?: string; className?: string }

export function TextField({ label, hint, error, requiredLabel, className, id: idProp, type = 'text', ...input }: TextFieldProps) {
  const id = idProp ?? input.name;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cx('rt-field', className)}>
      <label className="rt-field-label" htmlFor={id}>
        {bi(label)}
        {input.required ? <span className="rt-field-req">{` ${requiredLabel ?? '(අනිවාර්යයි · required)'}`}</span> : null}
      </label>
      <input {...input} id={id} type={type} className="rt-input" aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined} />
      {error ? <span className="rt-field-error" id={errorId} role="alert">{error}</span> : null}
      {hint ? <span className="rt-field-hint" id={hintId}>{hint}</span> : null}
    </div>
  );
}
