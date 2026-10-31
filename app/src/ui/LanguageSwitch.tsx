'use client';

import { cx } from './text';
import type { Lang } from './types';

/** "සිං | EN" switch; each option in its own script. `onLight` for the light top bar. */
/** Without onChange the buttons are marked aria-disabled (nothing to switch yet). `label`: the group's name for screen readers. */
export interface LanguageSwitchProps { lang?: Lang; onChange?: (lang: Lang) => void; onLight?: boolean; label?: string }

export function LanguageSwitch({ lang = 'si', onChange, onLight, label = 'භාෂාව · Language' }: LanguageSwitchProps) {
  const off = onChange ? undefined : true;
  return (
    <div className={cx('rt-lang', onLight && 'rt-lang-light')} role="group" aria-label={label}>
      <button type="button" aria-disabled={off} aria-pressed={lang === 'si'} lang="si" onClick={() => onChange?.('si')}>සිං</button>
      <button type="button" aria-disabled={off} aria-pressed={lang === 'en'} lang="en" onClick={() => onChange?.('en')}>EN</button>
    </div>
  );
}
