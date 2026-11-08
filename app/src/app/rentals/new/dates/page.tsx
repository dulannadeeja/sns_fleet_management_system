import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCar } from '../../../../modules/cars/cars';
import { getCustomer } from '../../../../modules/customers/customers';
import { readSettings } from '../../../../modules/settings/settings';
import { AppFrame } from '../../../AppFrame';
import { Step } from '../../Step';
import { rentalWords } from '../../words';
import { DatesForm } from './DatesForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screen 05.3 Dates and estimate (ST-05.3): how many days, the deadline from the owner's cutoff and deadline (AT-01,
// AT-02) and the estimate from the car's package (AT-03, AT-04). Saving copies the terms onto the rental (AT-05) and
// holds the car (system design 7.1, Confirmed 7 Nov 2026).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewRentalDates({ searchParams }: { searchParams: Promise<{ customer?: string; car?: string; ok?: string }> }) {
  const person = await requirePermission('customerAccess');
  const sp = await searchParams;
  const [c, car] = await Promise.all([
    typeof sp.customer === 'string' && UUID.test(sp.customer) ? getCustomer(sp.customer) : null,
    typeof sp.car === 'string' && UUID.test(sp.car) ? getCar(sp.car) : null,
  ]);
  if (!c || !car) notFound();
  const ok = typeof sp.ok === 'string' && UUID.test(sp.ok) ? sp.ok : null;
  const [t, w, settings, lang] = await Promise.all([getTranslations('rentals'), rentalWords(), readSettings(), getLocale()]);
  const { dailyRate, kmPerDay, extraKmRate, longRentalExtra, longRentalFromDay } = car.terms;
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={`${c.name} · ${car.registration}`}
      backHref={`/rentals/new/car?customer=${c.id}${ok ? `&ok=${ok}` : ''}`}>
      <Step n={3} name="dates" />
      <DatesForm customerId={c.id} vehicleId={car.id} goAheadId={ok} plate={car.registration} lang={lang}
        terms={{ dailyRate, kmPerDay, extraKmRate, longRentalExtra, longRentalFromDay }} cutoff={settings.pickupCutoff} deadline={settings.returnDeadline}
        back={`/rentals/new/car?customer=${c.id}${ok ? `&ok=${ok}` : ''}`} w={w} />
    </AppFrame>
  );
}
