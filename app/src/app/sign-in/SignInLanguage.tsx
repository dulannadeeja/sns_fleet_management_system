'use client';
import { useTransition } from 'react';
import { LanguageSwitch, type Lang } from '../../ui';
import { chooseSignedOutLanguage } from './language';

export function SignInLanguage({ lang, label }: { lang: Lang; label: string }) {
  const [, start] = useTransition();
  return <LanguageSwitch lang={lang} onLight label={label} onChange={(next) => start(() => chooseSignedOutLanguage(next))} />;
}
