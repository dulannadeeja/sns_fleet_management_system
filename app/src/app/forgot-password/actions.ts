'use server';
import { after } from 'next/server';
import { phoneProblem, type PhoneProblem } from '../../auth/phone';
import { requestResetByPhone } from '../../auth/reset';

export type ForgotState = { error?: PhoneProblem; sent?: boolean; phone?: string };

/** Screen 01.5: the same answer for any well-formed number, so it never shows which numbers have accounts. */
export async function forgotPasswordAction(_: ForgotState, form: FormData): Promise<ForgotState> {
  const phone = String(form.get('phone') ?? '').trim();
  const problem = phoneProblem(phone);
  if (problem) return { error: problem, phone };
  // The answer goes back at once; the lookup and the email happen after it, so neither the time nor an email error
  // shows whether the number has an account (#28 review).
  after(() => requestResetByPhone(phone).catch(() => {}));
  return { sent: true };
}
