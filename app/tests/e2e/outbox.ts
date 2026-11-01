import { existsSync, readFileSync } from 'node:fs';

// The dev server's emails in browser journeys (MAIL_OUTBOX_FILE, set in playwright.config.ts). Sample addresses only.
function mails(to: string): { to: string; subject: string; text: string }[] {
  const file = process.env.MAIL_OUTBOX_FILE!;
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((m) => m.to === to);
}

/** Waits for a new email to this address (more than `seen`) and returns its text. */
export async function nextMail(to: string, seen: number, timeoutMs = 15_000): Promise<string> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const all = mails(to);
    if (all.length > seen) return all.at(-1)!.text;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no new email to ${to}`);
}

export const mailCount = (to: string) => mails(to).length;
