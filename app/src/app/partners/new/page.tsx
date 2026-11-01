import { getLocale, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { forbidden } from 'next/navigation';
import { unlinkedPartnerCars } from '../../../modules/partners/partners';
import type { Lang } from '../../../ui';
import { AppFrame } from '../../AppFrame';
import { showTerm } from '../../cars/words';
import { AddPartnerForm } from '../PartnerForms';
import { partnerWords } from '../words';
import '../../cars/cars.css';
import '../partners.css';

// Screen 11.3 Add a partner (ST-11.2; system design 3.2 "Partner accounts", Proposed): people who may add or edit
// partners and see partner terms (the admin by default) add a partner, their account and their cars.
export default async function NewPartnerPage() {
  const person = await requirePermission('editPartners');
  // Choosing cars shows their commission, a partner term: both permissions (#20 review).
  if (!(await mayDo(person, 'seePartnerEarnings'))) forbidden();
  const [cars, t, tc, w, lang] = await Promise.all([unlinkedPartnerCars(), getTranslations('partners'), getTranslations('cars'), partnerWords(), getLocale()]);
  const tcf = tc as unknown as (k: string, v?: Record<string, string>) => string;
  const free = cars.map((c) => ({ id: c.id, plate: c.registration, model: c.model, commission: c.terms.commissionPercent ?? 15, perDay: showTerm(tcf, 'dailyRate', c.terms.dailyRate) }));
  return (
    <AppFrame person={person} active="partners" title={t('title')} subtitle={t('add')} backHref="/partners">
      <div className="car-cols">
        <div><AddPartnerForm cars={free} w={w} lang={lang as Lang} /></div>
        <div>
          <section className="car-card"><h2>{t('afterTitle')}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(t.raw('after') as string[]).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
