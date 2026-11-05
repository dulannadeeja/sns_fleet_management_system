import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sendMail } from '../src/mail/send';
import { mailsTo } from './helpers/outbox';

// TRD §6: without Resend set up, outside production, emails go to the outbox file; production refuses.
describe('sending email', () => {
  it('writes to the test outbox, never out', async () => {
    const to = `sample-${randomUUID()}@example.com`;
    await sendMail({ to, subject: 'Sample', text: 'Sample 123456' });
    expect(mailsTo(to)).toEqual([expect.objectContaining({ to, subject: 'Sample', text: 'Sample 123456' })]);
  });
  it('refuses in production without Resend set up', async () => {
    const env = process.env as Record<string, string | undefined>;
    const before = env.NODE_ENV;
    env.NODE_ENV = 'production';
    try {
      await expect(sendMail({ to: 'sample@example.com', subject: 'x', text: 'x' })).rejects.toThrow(/not set up/);
    } finally {
      env.NODE_ENV = before;
    }
  });
});
