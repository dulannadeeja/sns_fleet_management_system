import { appendFileSync } from 'node:fs';

// Email (TRD §6, T8): Resend's HTTPS API from the SNS domain when RESEND_API_KEY and EMAIL_FROM are set. Without them,
// outside production, emails go to a local outbox file (MAIL_OUTBOX_FILE, which tests read) and, in development, to
// the dev server's console so a developer can sign in. Production without them refuses to send.
export interface Mail { to: string; subject: string; text: string }

export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    if (!res.ok) throw new Error(`Email not sent (Resend answered ${res.status})`);
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Email is not set up: RESEND_API_KEY and EMAIL_FROM are needed');
  const outbox = process.env.MAIL_OUTBOX_FILE;
  if (outbox) appendFileSync(outbox, JSON.stringify({ ...mail, at: new Date().toISOString() }) + '\n');
  if (process.env.NODE_ENV === 'development') console.log(`[mail, not sent: development] to ${mail.to}: ${mail.subject}\n${mail.text}`);
}
