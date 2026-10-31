'use client';

import { cx } from './text';
import type { Lang } from './types';

/** "සිං | EN" switch; each option in its own script. `onLight` for the light top bar. */
export interface LanguageSwitchProps { lang?: Lang; onChange?: (lang: Lang) => void; onLight?: boolean }

export function LanguageSwitch({ lang = 'si', onChange, onLight }: LanguageSwitchProps) {
  return (
    <div className={cx('rt-lang', onLight && 'rt-lang-light')} role="group" aria-label="භාෂාව · Language">
      <button type="button" aria-pressed={lang === 'si'} lang="si" onClick={() => onChange?.('si')}>සිං</button>
      <button type="button" aria-pressed={lang === 'en'} lang="en" onClick={() => onChange?.('en')}>EN</button>
    </div>
  );
}
