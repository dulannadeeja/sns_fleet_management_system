import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../../../auth/require';
import { db } from '../../../../../../db/client';
import { partOf } from '../../../../../../modules/money/corrections';
import { payableRentals, paymentNumber, rentalMoney } from '../../../../../../modules/money/payments';
import { rentalTerms } from '../../../../../../modules/rentals/rentals';
import { rentalNumber } from '../../../../../../modules/rentals/agreements';
import { AppFrame } from '../../../../../AppFrame';
import { rentalWords } from '../../../../words';
import { CorrectForm } from './CorrectForm';
import '../../../../../cars/cars.css';
import '../../../../rentals.css';

// Screen 09.5 Payment correction request (ST-09.2; system design 8.3, Confirmed 11 Nov 2026): what is recorded now, what
// is wrong, what it should be and why. Sent to an admin on Approvals. Needs Customer access; the module checks it all.
export default async function CorrectPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const person = await requirePermission('customerAccess');
  const { id, paymentId } = await params;
  const r = await rentalTerms(id);
  if (!r) notFound();
  const part = await partOf(db, paymentId, r.id);
  if (!part) notFound();
  const [money, others, w, t, format] = await Promise.all([rentalMoney(r.id), payableRentals(r.customerId), rentalWords(), getTranslations('rentals'), getFormatter()]);
  const p = money?.payments.find((x) => x.id === part.paymentId);
  const when = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  return (
    <AppFrame person={person} active="rentals" title={t('correct.title')} subtitle={`${paymentNumber(part.number)} · ${rentalNumber(r.number)}`} backHref={`/rentals/${r.id}`}>
      <CorrectForm rentalId={r.id} paymentId={part.paymentId} w={w.correct as unknown as Record<string, string> & { errors: Record<string, string>; fixes: Record<string, string> }}
        methods={(w.pay as unknown as { methods: Record<string, string> }).methods}
        facts={{ rental: rentalNumber(r.number), for: part.for, method: part.method, reference: part.reference, amount: part.amount,
          recordedBy: p ? `${p.createdByName} · ${when(p.createdAt)}` : '',
          others: part.for === 'bill' ? others.filter((o) => o.id !== r.id && o.unpaid > 0).map((o) => ({ id: o.id, label: rentalNumber(o.number), unpaid: o.unpaid })) : [] }} />
    </AppFrame>
  );
}
