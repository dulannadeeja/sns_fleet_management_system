import { getTranslations } from 'next-intl/server';

/** "Step 1 of 3 · Customer" above each New rental screen (boards 05.1 to 05.3). */
export async function Step({ n, name }: { n: 1 | 2 | 3 | 4 | 5; name: 'customer' | 'car' | 'dates' | 'terms' | 'review' }) {
  const t = await getTranslations('rentals');
  return <p className="ren-step" aria-current="step"><span>{t('step', { n })}</span><b>{t(`steps.${name}`)}</b></p>;
}
