import { cx } from './text';

/** The SNS Rent Car logo (supplied file). `variant="mark"`: the yellow "S" alone, for app icons only. */
export interface BrandMarkProps { size?: 'sm' | 'lg'; variant?: 'full' | 'mark'; className?: string }

const LOGO = { full: '/plate/brand/sns-logo.png', mark: '/plate/brand/sns-logo-mark.png' };

export function BrandMark({ size, variant, className }: BrandMarkProps) {
  const v = variant === 'mark' ? 'mark' : 'full';
  return (
    <span className={cx('rt-mark', `rt-mark-${v}`, size && `rt-mark-${size}`, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the supplied logo file, shown as drawn */}
      <img src={LOGO[v]} alt="SNS Rent Car" draggable={false} />
    </span>
  );
}
