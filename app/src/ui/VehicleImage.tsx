import { cx } from './text';

/** The car's model image from the SNS vehicle pack v2 (design-system/components/VehicleImage): picked by model name;
 *  any other model shows the generic car. It fills its slot (object-fit: contain), so give the slot a size. Decorative
 *  unless `label` is given. */
export interface VehicleImageProps { model: string; size?: 'sm' | 'lg'; label?: string; className?: string }

const KEYS: Record<string, string> = { 'wagon r': 'wagon-r', wagonr: 'wagon-r', 'wagon-r': 'wagon-r', alto: 'alto', every: 'every', prius: 'prius', axio: 'axio', spacia: 'spacia' };
export const vehicleKey = (model: string) => KEYS[String(model ?? '').toLowerCase().trim()] ?? 'generic';

export function VehicleImage({ model, size, label, className }: VehicleImageProps) {
  const src = `/plate/vehicles/${size === 'lg' ? 512 : 256}/sns-vehicle-${vehicleKey(model)}.png`;
  // A plain img, as in Plate: the pack's files are already sized (256px and 512px).
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={cx('rt-vimg', className)} src={src} alt={label ?? ''} loading="lazy" decoding="async" draggable={false} />;
}
