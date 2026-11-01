import { describe, it, expect } from 'vitest';
import { phoneDigits, phoneProblem } from '../src/auth/phone';
import { signInProblems } from '../src/auth/sign-in-check';

// System design 3.1 "Sign-in phone numbers" (Proposed): Sri Lankan mobiles, 10 digits; the form names the wrong box.
describe('sign-in phone numbers', () => {
  it.each(['0701234567', '0711234567', '0721234567', '0741234567', '0751234567', '0761234567', '0771234567', '0781234567'])(
    'accepts the mobile number %s', (n) => expect(phoneProblem(n)).toBeNull());

  it.each([
    ['0731234567', 'a code no network uses'],
    ['0791234567', 'a code no network uses'],
    ['0112345678', 'a landline'],
    ['077123456', '9 digits'],
    ['07712345678', '11 digits'],
    ['077 123 4567', 'spaces'],
    ['+94771234567', '+94'],
    ['771234567', 'no leading 0'],
  ])('refuses %s (%s)', (n) => expect(phoneProblem(n)).toBe('phoneInvalid'));

  it('says when the number is missing', () => expect(phoneProblem('')).toBe('phoneMissing'));

  it('keeps only digits, at most 10, while typing', () => {
    expect(phoneDigits('077 123-4567')).toBe('0771234567');
    expect(phoneDigits('07712345678999')).toBe('0771234567');
    expect(phoneDigits('abc')).toBe('');
  });
});

describe('sign-in form problems, box by box', () => {
  it('none when both are well formed', () => expect(signInProblems('0771234567', 'eight-ch')).toEqual({}));
  it('names each empty box', () => expect(signInProblems('', '')).toEqual({ phone: 'phoneMissing', password: 'passwordMissing' }));
  it('a password under 8 characters', () => expect(signInProblems('0771234567', 'seven-c')).toEqual({ password: 'passwordShort' }));
  it('a number not in the form', () => expect(signInProblems('0731234567', 'eight-ch')).toEqual({ phone: 'phoneInvalid' }));
});
