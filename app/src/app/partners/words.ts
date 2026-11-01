import { getTranslations } from 'next-intl/server';
import { LIMITS } from '../../modules/cars/cars';
import type { PartnerWords } from './PartnerForms';

/** The words the partner forms need, in the person's language. */
export async function partnerWords(): Promise<PartnerWords> {
  const t = await getTranslations('partners');
  const tc = await getTranslations('cars');
  const ts = await getTranslations('settings');
  const keys = ['notAllowed', 'notFound', 'nameMissing', 'phoneMissing', 'phoneInvalid', 'phoneTaken', 'passwordShort', 'nicInvalid', 'nicTaken', 'bankTooLong', 'carsMissing', 'carsInvalid', 'carNotFree', 'dateInvalid', 'failed'] as const;
  return {
    name: t('name'), nic: t('nic'), nicHint: t('nicHint'), phone: t('phone'), phoneHint: t('phoneHint'), password: t('password'), passwordHint: t('passwordHint'),
    bank: t('bank'), bankHint: t('bankHint'), chooseCars: t('chooseCars'), chooseCarsHint: t('chooseCarsHint'), noFreeCars: t('noFreeCars'),
    termsFor: t.raw('termsFor') as string, perDayNote: t.raw('perDayNote') as string,
    commission: tc('fields.commissionPercent.label'), commissionHint: `% · ${tc('range', { min: String(LIMITS.commissionPercent[0]), max: String(LIMITS.commissionPercent[1]) })}`,
    ownerPays: tc('ownerPays.label'), ownerPaysNote: tc('ownerPays.note'), costs: tc.raw('costs') as Record<string, string>,
    save: t('save'), cancel: t('cancel'), requiredMark: ts('requiredMark'), errors: Object.fromEntries(keys.map((k) => [k, t(`errors.${k}`)])),
    signedLabel: t('signedLabel'), record: t('record'), addCarSave: t('addCarSave'),
  };
}
