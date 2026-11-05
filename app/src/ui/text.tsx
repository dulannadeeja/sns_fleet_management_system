import type { ReactNode } from 'react';

/** "සිංහල · English" → the Sinhala is the label, the English a quieter echo (class rt-en). Other text is returned unchanged. */
export function bi(text: string): ReactNode {
  const i = text.indexOf(' · ');
  if (i < 0 || !/[඀-෿]/.test(text.slice(0, i)) || !/^[A-Za-z]/.test(text.slice(i + 3))) return text;
  return [text.slice(0, i), <span key="en" className="rt-en">{' · ' + text.slice(i + 3)}</span>];
}

/** Record ids (R-0218, HNB-509377) never break across lines: a non-breaking hyphen. */
export function nb(text: string): string {
  return text.replace(/([A-Za-z]+)-(\d)/g, '$1‑$2');
}

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
