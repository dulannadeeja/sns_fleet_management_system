// Sign-in phone numbers (system design 3.1 "Sign-in phone numbers", Proposed): a Sri Lankan mobile number, 10 digits,
// 070 or 071 (SLT-Mobitel), 072 or 078 (Hutch), 074, 076 or 077 (Dialog), 075 (Airtel, now Dialog). Digits only.
export const PHONE_LENGTH = 10;
export const SRI_LANKA_MOBILE = /^07[0124-8]\d{7}$/;

/** Keeps the digits only and at most 10 of them: what the phone box allows while typing. */
export function phoneDigits(typed: string): string {
  return typed.replace(/\D/g, '').slice(0, PHONE_LENGTH);
}

export type PhoneProblem = 'phoneMissing' | 'phoneInvalid';

/** What is wrong with a typed sign-in phone number, or null when it is a Sri Lankan mobile number. */
export function phoneProblem(phone: string): PhoneProblem | null {
  if (!phone) return 'phoneMissing';
  return SRI_LANKA_MOBILE.test(phone) ? null : 'phoneInvalid';
}
