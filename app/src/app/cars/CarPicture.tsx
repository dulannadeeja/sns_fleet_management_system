import { VehicleImage } from '../../ui';

/** A car's picture (ST-04.7, CR-001): its catalogue photo through the app's private route, or, until one is added, the
 *  model's standard image. Decorative: the plate and model beside it name the car. */
export function CarPicture({ carId, model, photoId, size, className }: { carId: string; model: string; photoId: string | null; size?: 'sm' | 'lg'; className?: string }) {
  return (
    <span className={['car-pic', size === 'lg' ? 'car-pic-lg' : '', className].filter(Boolean).join(' ')} aria-hidden="true" data-photo={photoId ? 'own' : 'standard'}>
      {/* A plain img: next/image would fetch the private photo without the person's sign-in, and the route refuses that. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photoId ? <img className="car-pic-photo" src={`/cars/${carId}/photo/${photoId}`} alt="" loading="lazy" decoding="async" /> : <VehicleImage model={model} size={size} />}
    </span>
  );
}
