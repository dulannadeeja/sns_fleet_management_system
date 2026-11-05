# TextField
A labelled text input, as on boards 01.1 Sign in and 01.2 First sign-in: the label (Sinhala, with a quieter English echo) above a 52px input, the required mark in words, then a hint or an error.

**Provide:** `label` ("සිංහල · English"), `name`, and any input attributes (`type`, `inputMode`, `autoComplete`, `placeholder`, `required`, `defaultValue`); optional `hint`, `error`, `requiredLabel`.

**Rules:**
- **Required is said in words**, after the label: "(අනිවාර්යයි · required)" in `overdue` colour (Dulan, 25 Oct 2026). Never a lone asterisk.
- **An error says what to fix**, in plain words, under the input; the input is marked invalid and points to it, so screen readers read it.
- **At least 52px tall, 17px text**, so it is easy to tap and read on a phone outdoors.
- **Phone numbers** use `inputMode="tel"`; passwords `type="password"` with `autoComplete` `current-password` or `new-password`.
