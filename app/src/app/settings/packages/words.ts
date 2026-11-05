import 'server-only';
import { getTranslations } from 'next-intl/server';
import { LIMITS } from '../../../modules/cars/rules';
import { DEFAULT_FIELDS, PACKAGE_FIELDS } from '../../../modules/cars/packages';
import { showNumber } from '../business-rules/show';
import type { PackageWords } from './PackageForms';

/** The words the package forms need, in the person's language. */
export async function packageWords(): Promise<PackageWords> {
  const t = await getTranslations('cars');
  const p = await getTranslations('cars.packages');
  const fields = [...PACKAGE_FIELDS, ...DEFAULT_FIELDS];
  return {
    fields: Object.fromEntries(fields.map((f) => [f, { label: t(`fields.${f}.label`), hint: [t(`fields.${f}.unit`), t(`fields.${f}.hint`),
      t('range', { min: showNumber(LIMITS[f][0]), max: showNumber(LIMITS[f][1]) })].filter(Boolean).join(' · '),
      range: t('range', { min: showNumber(LIMITS[f][0]), max: showNumber(LIMITS[f][1]) }) }])),
    errors: p.raw('errors') as Record<string, string>,
    name: p('name'), nameHint: p('nameHint'), models: p('models'), modelsHint: p('modelsHint'), addModel: p('addModel'), addModelHint: p('addModelHint'),
    onlyNew: p('onlyNew'), commissionNote: p('commissionNote'), save: p('save'), cancel: p('cancel'), requiredMark: (await getTranslations('settings'))('requiredMark'),
    removeModels: p('removeModels'), removeHint: p('removeHint'),
  };
}
