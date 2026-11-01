import { getTranslations } from 'next-intl/server';
import type { CustomerWords } from './CustomerForms';

/** The words the customer forms need, in the person's language. */
export async function customerWords(): Promise<CustomerWords> {
  const t = await getTranslations('customers');
  const ts = await getTranslations('settings');
  const keys = ['notAllowed', 'notFound', 'nameMissing', 'nicInvalid', 'phoneInvalid', 'licenceNumberMissing', 'licenceExpiresInvalid', 'kindInvalid', 'fileType', 'fileTooBig', 'stale', 'failed'] as const;
  return {
    who: t('who'), name: t('name'), nic: t('nic'), nicHint: t('nicHint'), phone: t('phone'), phoneHint: t('phoneHint'), address: t('address'),
    licence: t('licence'), licenceNumber: t('licenceNumber'), licenceExpires: t('licenceExpires'), licenceNote: t('licenceNote'),
    copies: t('copies'), copiesNote: t('copiesNote'), copiesLater: t('copiesLater'), kinds: t.raw('kinds') as Record<string, string>,
    chooseFile: t('chooseFile'), reference: t('reference'), referenceNote: t('referenceNote'), save: t('save'), saveChanges: t('saveChanges'),
    cancel: t('cancel'), requiredMark: ts('requiredMark'), replace: t('replace'), addCopy: t('addCopy'), errors: Object.fromEntries(keys.map((k) => [k, t(`errors.${k}`)])),
  };
}
