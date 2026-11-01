import { getTranslations } from 'next-intl/server';
import { TERM_FIELDS } from '../../modules/cars/cars';
import type { CarWords } from './CarForms';

/** The words the car forms need, in the person's language. */
export async function carWords(): Promise<CarWords> {
  const t = await getTranslations('cars');
  const ts = await getTranslations('settings');
  const keys = ['registrationMissing', 'registrationInvalid', 'registrationTaken', 'modelInvalid', 'ownershipInvalid', 'notAllowed', 'notFound', 'invalid', 'stale', 'failed'] as const;
  return {
    fields: Object.fromEntries(TERM_FIELDS.map((f) => [f, { label: t(`fields.${f}.label`), unit: t(`fields.${f}.unit`), hint: t(`fields.${f}.hint`) }])),
    errors: Object.fromEntries(keys.map((k) => [k, t(`errors.${k}`)])),
    package: t('package'), packageFrom: t.raw('packageFrom') as string, partnerTerms: t('partnerTerms'), partnerNote: t('partnerNote'),
    newRentalsOnly: t('newRentalsOnly'), save: t('save'), saveChanges: t('saveChanges'), cancel: t('cancel'), car: t('car'),
    registration: t('registration'), registrationHint: t('registrationHint'), model: t('model'), modelHint: t('modelHint'), owner: t('owner'),
    sns: t('sns'), snsHint: t('snsHint'), partner: t('partner'), partnerHint: t('partnerHint'), requiredMark: ts('requiredMark'),
  };
}
