'use server';
import { phoneProblem, type PhoneProblem } from '../../auth/phone';
import { requestResetByPhone } from '../../auth/reset';

export type ForgotState = { error?: PhoneProblem; sent?: boolean; phone?: string };

/** Screen 01.5: the same answer for any well-formed number, so it never shows which numbers have accounts. */
export async function forgotPasswordAction(_: ForgotState, form: FormData): Promise<ForgotState> {
  const phone = String(form.get('phone') ?? '').trim();
  const problem = phoneProblem(phone);
  if (problem) return { error: problem, phone };
  try {
    await requestResetByPhone(phone);
  } catch {
    // Email trouble must not show that the number has an account either.
  }
  return { sent: true };
}
