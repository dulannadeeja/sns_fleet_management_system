import { getFormatter, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { rentalBill } from '../../../modules/rentals/returns';
import { depositState } from '../../../modules/money/deposits';
import { paidAbove, paidBackOn } from '../../../modules/money/writeoffs';
import { Notice } from '../../../ui';
import { GarageForm } from './GarageForm';
import { rentalNumber } from '../../../modules/rentals/agreements';

// 07.1 the bill of a returned rental (#63): each line, and who gets it for people who may see partner terms (4.2); the
// paid amount, the deposit held and what is unpaid; then the deposit's settlement (07.3, #64), or the way to it. Admins with "Allocate damage proceeds" correct garage days here.
export async function BillSection({ rentalId, seeTerms, mayCorrect, mayPayBack, partner, w }: { rentalId: string; seeTerms: boolean; mayCorrect: boolean; mayPayBack: boolean; partner: boolean; w: Record<string, string> & { errors: Record<string, string> } }) {
  const [bill, dep] = await Promise.all([rentalBill(rentalId), depositState(rentalId)]);
  if (!bill || !dep) return null;
  const [t, td, tb, format, above, paidBack] = await Promise.all([getTranslations('rentals.bill'), getTranslations('rentals.deposit'), getTranslations('rentals.payBack'), getFormatter(),
    paidAbove(rentalId), paidBackOn(rentalId)]);
  const when = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const settled = dep.settlement;
  const money = (n: number) => (n < 0 ? `− ${format.number(-n)}` : format.number(n));
  const who = (l: (typeof bill.lines)[number]) => l.waiting ? t('waiting') : l.allocation === 'sns' ? t('sns') : l.partnerShare !== null ? t('split', { partner: format.number(l.partnerShare), sns: format.number(l.amount - l.partnerShare) }) : '';
  const garageDays = bill.lines.filter((l) => l.kind === 'garageDays').reduce((n, l) => n + Number(l.details.days ?? 0), 0);
  return (
    <section className="car-card" aria-labelledby="b-h" data-bill={bill.total} data-unpaid={bill.unpaid}>
      <h2 id="b-h">{t('title')}</h2>
      <dl className="ren-lines">
        {bill.lines.map((l) => (
          <span key={l.id} style={{ display: 'contents' }} data-line={l.kind}>
            <dt>{t(`kinds.${l.kind}`, { days: String(l.details.days ?? ''), km: String(l.details.extraKm ?? ''), item: String(l.details.item ?? ''), what: String(l.details.what ?? ''),
              litres: String(l.details.litres ?? '') })}{l.reason ? ` · ${l.reason}` : ''}{seeTerms ? ` · ${who(l)}` : l.waiting ? ` · ${t('waiting')}` : ''}</dt>
            <dd>{money(l.amount)}</dd>
          </span>
        ))}
        <dt className="ren-total">{t('total')}</dt><dd className="ren-total">{money(bill.total)}</dd>
        <dt>{t('paid')}</dt><dd>{money(bill.paid)}</dd>
        <dt>{t('depositHeld')}</dt><dd>{money(bill.depositHeld)}</dd>
        {bill.writtenOff ? <><dt>{t('writtenOff')}</dt><dd data-written-off={bill.writtenOff}>{money(bill.writtenOff)}</dd></> : null}
        {bill.refunded ? <><dt>{t('paidBack')}</dt><dd data-paid-back={bill.refunded}>{money(bill.refunded)}</dd></> : null}
        <dt>{bill.unpaid > 0 ? t('unpaid') : t('toRefund')}</dt><dd>{money(Math.abs(bill.unpaid))}</dd>
      </dl>
      {bill.unpaid < 0 && !settled ? <span className="set-muted">{t('refundNote')}</span> : null}
      {above > 0 && mayPayBack ? <div><Link className="rt-btn rt-btn-secondary" href={`/rentals/${rentalId}/pay-back`} data-pay-back-link>{tb('link')}</Link></div> : null}
      {paidBack.length ? <ul className="set-muted" style={{ margin: 0, paddingLeft: 18 }}>{paidBack.map((p) => <li key={p.id}>{tb('line', { amount: money(p.amount), method: p.method === 'bank' ? `${tb('bank')} · ${p.reference ?? ''}` : tb('cash'), when: when(p.createdAt), by: p.byName ?? '' })}</li>)}</ul> : null}
      {settled ? (
        <div data-deposit-settled={settled.refund} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>{td('settled')}</span>
          <span className="set-muted">{td('settledLine', { when: when(settled.createdAt), by: settled.byName ?? '' })}</span>
          <dl className="ren-lines">
            <dt>{td('usedHere')}</dt><dd>{money(settled.here)}</dd>
            {settled.older.map((o) => <span key={o.rentalId} style={{ display: 'contents' }}><dt>{td('usedOlder', { number: rentalNumber(o.number) })}</dt><dd>{money(o.amount)}</dd></span>)}
            <dt>{td('back')}</dt><dd>{money(settled.refund)}</dd>
          </dl>
          {settled.refund ? <span className="set-muted">{settled.method === 'bank' ? td('refundedRef', { reference: settled.reference ?? '' }) : td('refundedBy', { method: td('cash') })}</span> : null}
          {settled.olderAgreed ? <span className="set-muted">{td('agreedNote', { note: settled.agreementNote ?? '' })}</span> : null}
        </div>
      ) : dep.garageWaiting && dep.held > 0 ? <Notice tone="warning">{td('garageWaiting')}</Notice>
        : dep.held > 0 ? <div><Link className="rt-btn rt-btn-primary" href={`/rentals/${rentalId}/deposit`}>{td('open')}</Link></div> : null}
      {mayCorrect && garageDays > 0 ? <GarageForm rentalId={rentalId} days={garageDays} partner={partner} w={w} /> : null}
    </section>
  );
}
