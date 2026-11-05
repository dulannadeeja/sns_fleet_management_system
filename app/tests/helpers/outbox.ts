import { existsSync, readFileSync } from 'node:fs';

/** The emails written to the test outbox (MAIL_OUTBOX_FILE, set in vitest.config.ts) for one address. */
export function mailsTo(to: string): { to: string; subject: string; text: string }[] {
  const file = process.env.MAIL_OUTBOX_FILE!;
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((m) => m.to === to);
}

/** The 6-digit code in the latest email to this address. */
export function lastCode(to: string): string {
  const m = mailsTo(to).at(-1);
  const code = m?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error(`no code mailed to ${to}`);
  return code;
}
