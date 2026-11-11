import { getFormatter, getTranslations } from 'next-intl/server';
import { rentalBill } from '../../../modules/rentals/returns';
import { GarageForm } from './GarageForm';

// 07.1 the bill of a returned rental (#63): each line, and who gets it for people who may see partner terms (4.2); the
// paid amount, the deposit held and what is unpaid. Admins with "Allocate damage proceeds" correct garage days here.
export async function BillSection({ rentalId, seeTerms, mayCorrect, partner, w }: { rentalId: string; seeTerms: boolean; mayCorrect: boolean; partner: boolean; w: Record<string, string> & { errors: Record<string, string> } }) {
  const bill = await rentalBill(rentalId);
  if (!bill) return null;
  const [t, format] = await Promise.all([getTranslations('rentals.bill'), getFormatter()]);
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
        <dt>{bill.unpaid > 0 ? t('unpaid') : t('toRefund')}</dt><dd>{money(Math.abs(bill.unpaid))}</dd>
      </dl>
      {bill.unpaid < 0 ? <span className="set-muted">{t('refundNote')}</span> : null}
      {mayCorrect && garageDays > 0 ? <GarageForm rentalId={rentalId} days={garageDays} partner={partner} w={w} /> : null}
    </section>
  );
}
