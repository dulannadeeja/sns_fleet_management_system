import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../auth/require';
import { mayDo } from '../../../auth/access';
import { listPackages, modelsInUse, readDefaults } from '../../../modules/cars/packages';
import { AppFrame } from '../../AppFrame';
import { AddCarForm } from '../CarForms';
import { carWords } from '../words-server';
import '../cars.css';

// Screen 04.8 Add a car (ST-04.3; Confirmed 5 Nov 2026: people who may add or edit cars (the admin by default).
export default async function NewCarPage() {
  const person = await requirePermission('editCarsAndPackages');
  const [t, w, seeCommission, editCommission, packages, models, d] = await Promise.all([
    getTranslations('cars'), carWords(), mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editPartners'), listPackages(), modelsInUse(), readDefaults(),
  ]);
  // The packages from 04.6 (#21); the commission default goes to the browser only for people who may see it.
  const defaults = { longRentalExtra: d.longRentalExtra, longRentalFromDay: d.longRentalFromDay, garageDayCharge: d.garageDayCharge, ...(seeCommission ? { commissionPercent: d.commissionPercent } : {}) };
  const starting = packages.map(({ id, name, models: m, dailyRate, kmPerDay, extraKmRate }) => ({ id, name, models: m, dailyRate, kmPerDay, extraKmRate }));
  return (
    <AppFrame person={person} active="cars" title={t('title')} subtitle={t('add')} backHref="/cars">
      <div className="car-cols">
        <div><AddCarForm models={models} packages={starting} defaults={defaults} seeCommission={seeCommission} editCommission={editCommission} w={w} /></div>
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
