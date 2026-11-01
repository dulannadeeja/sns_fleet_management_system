# Plan: #17 Business rules settings (ST-15.3)

## Goal
Everyone who works at SNS reads the business rules on 15.2; the owner changes the business-wide settings in three groups on 15.7, each with a check of old → new before saving. Every change is in the activity log with the old and new values.

## Decided (system design 3.2 "Owner settings", Proposed: Dulan, 1 Nov 2026)
- Groups: day times (pickup cutoff 15:00, return deadline 08:00), reminders (insurance and licence 30 days, service 7 days, service 500 km, payroll 3 days), fuel price per litre (not set).
- Limits: reminder days 1–90, service km 100–5,000, fuel LKR 1–2,000 whole rupees, times to the minute.
- Owner, admin and staff read; partners do not. Only the owner changes (`requireOwner`, checked again in the transaction).
- A changed cutoff or deadline applies to new rentals only (PR-08): nothing reads it yet; rentals snapshot it later.

## Approach
- `setting` table: one row per changed key (`key` primary key, `value` text, `updated_at`, `updated_by`). Built-in starting values live in the catalogue until the owner changes one. Migration 0012 grants `sns_app` SELECT, INSERT, UPDATE (no DELETE).
- `src/modules/settings/settings.ts`: catalogue, `readSettings()`, `checkGroup()` (per-field errors), `changeGroup(actorId, group, input)` (owner check, compare, upsert, one `setting.change` entry per changed key with `{ key, old, new }`).
- `accessFor(headers, 'employee')` and `requireEmployee()`: owner, admin or staff.
- Pages: `/settings/business-rules` (15.2) and `/settings/business-rules/[group]` (15.7, owner only); a client form shows old → new live.
- SettingsFrame: Business rules for everyone; Activity log only for those who may see it; the rail and home page link non-owners to Business rules.
- Activity log sentence `setting.change` with the setting's name and formatted values.

## Seams under test
- `tests/at/at-45.test.ts` (settings part, partial): starts at 30 days; the owner changes it; it reads back; the log has old and new; admin and staff refused.
- `tests/settings.test.ts`: limits, times, fuel not set, unchanged values write nothing, unknown keys and groups ignored or refused.
- `tests/e2e/business-rules.spec.ts`: staff read 15.2 with no Change buttons and get 403 on 15.7; the owner changes a value, sees old → new, saves, and the log shows it (each project its own key, restored after).

## Out of scope
Reminders themselves (Phase 3), rentals reading the cutoff (Phase 2), fuel charges, per-car and per-partner settings.

## Validation
`validate`; screenshots against 15.2 and 15.7; `review-changes`; `ship` (closes #17).
