import { MIN_PASSWORD_LENGTH } from './rules';
import { phoneProblem, type PhoneProblem } from './phone';

export type PasswordProblem = 'passwordMissing' | 'passwordShort';
export interface SignInProblems { phone?: PhoneProblem; password?: PasswordProblem }

/**
 * What is wrong with what was typed on the sign-in form, box by box, before anything is sent to be checked.
 * A password under 8 characters can never be right (DN-03), so saying so shows nothing about any account.
 */
export function signInProblems(phone: string, password: string): SignInProblems {
  const problems: SignInProblems = {};
  const p = phoneProblem(phone);
  if (p) problems.phone = p;
  if (!password) problems.password = 'passwordMissing';
  else if (password.length < MIN_PASSWORD_LENGTH) problems.password = 'passwordShort';
  return problems;
}
