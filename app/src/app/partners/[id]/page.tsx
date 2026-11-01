import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { getPartner } from '../../../modules/partners/partners';
import { Notice, PlateBadge, type Lang } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import { showTerm } from '../../cars/words';
import { SignedForm } from '../PartnerForms';
import { partnerWords } from '../words';
import '../../cars/cars.css';
import '../partners.css';

// Screen 11.2 Partner details (ST-11.3): cars and terms, account and agreement. Partner terms: people who may see them
// (the owner and the admin by default). Earnings, cash-outs and the starting balance come with their own tickets.
export default async function PartnerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const person = await requirePermission('seePartnerEarnings');
  const { id } = await params;
  const partner = await getPartner(id);
  if (!partner) notFound();
  const [t, tc, w, lang, format, q, mayEdit] = await Promise.all([getTranslations('partners'), getTranslations('cars'), partnerWords(), getLocale(), getFormatter(), searchParams, mayDo(person, 'editPartners')]);
  const tcf = tc as unknown as (k: string, v?: Record<string, string>) => string;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const costs = (c: string[]) => (c.length ? t('costsPaid', { costs: c.map((x) => tc(`costs.${x}`)).join(', ') }) : t('costsNone'));
  return (
    <AppFrame person={person} active="partners" title={t('title')} subtitle={partner.name} backHref="/partners">
      {q.saved === '1' ? <Notice>{t('saved')}</Notice> : null}
      <section className="car-card">
        <div className="car-top">
          <span className="set-avatar">{partner.name.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ fontSize: 18 }}>{partner.name}</b>
            <span className="set-muted">{`${t('owner')} · ${t('carsCount', { n: partner.cars.length })} · NIC ${partner.nic}`}</span>
          </span>
          {partner.phone ? <a className="rt-btn rt-btn-secondary" style={{ marginLeft: 'auto', textDecoration: 'none' }} href={`tel:${partner.phone}`}>{`${t('call')} · ${partner.phone}`}</a> : null}
        </div>
        <span className="set-muted">{partner.bankAccount ? `${t('bank')}: ${partner.bankAccount}` : t('bankNone')}</span>
      </section>
      <section className="car-card" aria-labelledby="cars"><h2 id="cars">{`${t('cars')} · ${partner.cars.length}`}</h2>
        {partner.cars.map((c) => (
          <Link key={c.id} className="ptn-line" href={`/cars/${c.id}`}>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><PlateBadge plate={c.registration} size="sm" lang={lang as Lang} />{`${c.model} · ${showTerm(tcf, 'dailyRate', c.terms.dailyRate)}`}</span>
            <span className="set-muted" data-terms={c.registration}>{t('termsLine', { commission: String(c.terms.commissionPercent ?? 0), costs: costs(c.terms.ownerPays) })}</span>
          </Link>
        ))}
        <span className="set-muted">{t('startingBalance')}</span>
      </section>
      <section className="car-card" aria-labelledby="account"><h2 id="account">{t('account', { name: partner.name })}</h2>
        <span><span className={`set-status${partner.active ? '' : ' set-status-off'}`}>{partner.active ? t('active') : t('off')}</span></span>
        <span className="set-muted">{t('accountNote', { name: partner.name })}</span>
      </section>
      <section className="car-card" aria-labelledby="agreement"><h2 id="agreement">{t('agreement')}</h2>
        <span className="set-muted">{t('agreementNote')}</span>
        <span data-agreement>{partner.agreementSignedOn
          ? t('signedOn', { date: format.dateTime(new Date(`${partner.agreementSignedOn}T00:00:00Z`), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) })
          : t('notSigned')}</span>
        {mayEdit ? <SignedForm partnerId={partner.id} w={w} today={today} /> : null}
        <span className="set-muted">{t('printLater')}</span>
      </section>
    </AppFrame>
  );
}
