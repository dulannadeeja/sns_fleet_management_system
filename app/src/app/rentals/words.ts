import { getTranslations } from 'next-intl/server';

export type RentalWords = Record<string, string> & { errors: Record<string, string>; steps: Record<string, string> };

/** The words of New rental (#51) that a client form needs, in the person's language, unformatted. */
export async function rentalWords(): Promise<RentalWords> {
  const t = await getTranslations();
  return t.raw('rentals') as RentalWords;
}
