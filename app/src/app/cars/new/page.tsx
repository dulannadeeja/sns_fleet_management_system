import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { DEFAULT_TERMS, MODELS, STARTING_PACKAGES } from '../../../modules/cars/cars';
import { AppFrame } from '../../AppFrame';
import { AddCarForm } from '../CarForms';
import { carWords } from '../words-server';
import '../cars.css';

// Screen 04.8 Add a car (ST-04.3; Proposed: Dulan, 1 Nov 2026): people who may add or edit cars (the admin by default).
export default async function NewCarPage() {
  const person = await requirePermission('editCarsAndPackages');
  const [t, w, seeCommission, editCommission] = await Promise.all([
    getTranslations('cars'), carWords(), mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editPartners'),
  ]);
  return (
    <AppFrame person={person} active="cars" title={t('title')} subtitle={t('add')} backHref="/cars">
      <div className="car-cols">
        <div><AddCarForm models={[...MODELS]} starting={STARTING_PACKAGES} defaults={DEFAULT_TERMS} seeCommission={seeCommission} editCommission={editCommission} w={w} /></div>
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
