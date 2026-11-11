import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { approvalsList } from '../../../modules/approvals/approvals';
import { rentalMoney } from '../../../modules/money/payments';
import { rentalNumber } from '../../../modules/rentals/agreements';
import { AppFrame } from '../../AppFrame';
import { bearer } from '../bearer';
import { DecideForm } from './DecideForm';
import '../../cars/cars.css';
import '../../rentals/rentals.css';

// Screens 10.2 Approve · confirm, 10.3 Reject · confirm and 10.4 Approve a higher price on a partner car (ST-10.2,
// ST-10.3): the confirm step repeats the effect and who bears it. Rejecting needs a note; a rate above a partner car's
// package needs the partner's rupees of the extra, with a reason. The module checks everything again.
export default async function DecidePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ do?: string }> }) {
  const person = await requirePermission('changePriceOrDiscount');
  const { id } = await params;
  const approve = (await searchParams).do !== 'reject';
  const a = (await approvalsList(person.id, 'waiting')).find((x) => x.id === id);
  if (!a) notFound();
  const [t, format, money, mayShare, seeTerms] = await Promise.all([getTranslations('approvals'), getFormatter(), rentalMoney(a.rentalId), mayDo(person, 'sharePartnerCarSurcharge'), mayDo(person, 'seePartnerEarnings')]);
  const tt = t as unknown as (k: string, v?: Record<string, string | number>) => string;
  const m = (n: number) => format.number(n);
  const signed = (n: number) => (n < 0 ? `− ${m(-n)}` : `+ ${m(n)}`);
  const estimateAfter = Math.max(0, a.estimateWas + a.effect);
  const paidAbove = money && approve && money.paid > (money.estimate + a.effect) ? money.paid - (money.estimate + a.effect) : 0;
  const w = t.raw('form') as Record<string, string> & { errors: Record<string, string> };
  return (
    <AppFrame person={person} active="approvals" title={approve ? (a.aboveTheirPackage ? t('confirm.higher') : t('confirm.approve')) : t('confirm.reject')} subtitle={rentalNumber(a.number)} backHref="/approvals">
      <section className="car-card" aria-labelledby="c-h" data-confirm={approve ? 'approve' : 'reject'}>
        <h2 id="c-h">{approve ? (a.aboveTheirPackage ? t('confirm.higher') : t('confirm.approve')) : t('confirm.reject')}</h2>
        <dl className="ren-lines">
          <dt>{t('rental')}</dt><dd>{`${rentalNumber(a.number)} · ${a.registration} · ${a.model}`}</dd>
          {a.kind === 'rate' ? <><dt>{t('rate')}</dt><dd>{t('rateValue', { was: m(a.rateWas), now: m(a.newDailyRate!), days: a.days })}</dd></>
            : <><dt>{t('discount')}</dt><dd>{m(a.discount!)}</dd></>}
          <dt>{approve ? t('effect') : t('billStays')}</dt><dd>{approve ? signed(a.effect) : t('billStaysValue', { amount: m(a.estimateWas) })}</dd>
          {approve ? <><dt>{t('whoBears')}</dt><dd>{bearer(a, tt, seeTerms)}</dd><dt>{t('estimateAfter')}</dt><dd>{m(estimateAfter)}</dd></> : null}
        </dl>
        <span><span style={{ fontWeight: 600 }}>{t('reason', { name: a.byName })}</span> <q>{a.reason}</q></span>
        {paidAbove ? <span className="set-muted" data-paid-above>{t('paidAbove', { amount: m(paidAbove) })}</span> : null}
      </section>
      <DecideForm requestId={a.id} approve={approve} split={approve && a.aboveTheirPackage ? { extra: a.extra, packageRate: a.packageRate, days: a.days, commission: seeTerms ? a.commissionPercent : null, may: mayShare } : null}
        w={w} history={t('history', { number: rentalNumber(a.number), name: a.byName })} />
    </AppFrame>
  );
}
