import { notFound, redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { handoverOf } from '../../../../modules/rentals/handover';
import { minutesLate } from '../../../../modules/rentals/list';
import { rentalEstimate, rentalTerms } from '../../../../modules/rentals/rentals';
import { rentalNumber } from '../../../../modules/rentals/agreements';
import { rentalReadiness } from '../../../../modules/rentals/terms';
import { rentalMoney } from '../../../../modules/money/payments';
import { getCar } from '../../../../modules/cars/cars';
import { getCustomer } from '../../../../modules/customers/customers';
import { AppFrame } from '../../../AppFrame';
import { rentalWords } from '../../words';
import { ReturnForm } from './ReturnForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screens 07.1 Return and payment and 07.2 Garage days (ST-07.1, ST-07.2; system design 7.4 "Receiving the car",
// Confirmed 11 Nov 2026). The incoming reading, fuel and accessories, late, fuel, accessory and damage charges, garage
// days and the car's next state; the module works out the bill and checks it all again. Needs Customer access.
export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  if (r.status !== 'active') redirect(`/rentals/${r.id}`);
  const [h, est, money, c, car, t, w, format, mayPayLater, ready] = await Promise.all([handoverOf(r.id), rentalEstimate(r.id), rentalMoney(r.id), getCustomer(r.customerId),
    getCar(r.segments[0].vehicleId), getTranslations('rentals.return'), rentalWords(), getFormatter(), mayDo(person, 'allowPaymentAfterReturn'), rentalReadiness(r.id)]);
  if (!h || !est) notFound();
  const seg = r.segments[0];
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={`${rentalNumber(r.number)} · ${c?.name ?? ''} · ${car?.registration ?? ''}`} backHref={`/rentals/${r.id}`}>
      <ReturnForm rentalId={r.id} w={w.return as unknown as Record<string, string> & { errors: Record<string, string>; fuels: Record<string, string>; states: Record<string, string> }}
        fuels={(w.handover as unknown as { fuels: Record<string, string> }).fuels}
        facts={{ outKm: h.outKm, outFuel: h.fuel, accessories: h.accessories, days: r.days, kmPerDay: seg.kmPerDay, extraKmRate: seg.extraKmRate, sameLevel: ready?.fuel === 'sameLevel',
          fuelPrice: r.fuelPricePerLitre ?? 0, garageRate: seg.garageDayCharge, partner: seg.commissionPercent !== null, lateMinutes: minutesLate({ status: r.status, deadlineAt: r.deadlineAt }),
          deadline: when(r.deadlineAt), estimate: est.total, paid: money?.paid ?? 0, depositHeld: money?.depositReceived ?? 0, mayPayLater }} />
    </AppFrame>
  );
}

