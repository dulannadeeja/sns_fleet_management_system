import { ICON_PATHS } from './plate/icons';
import { cx } from './text';
import type { IconName } from './types';

/** Line icon on a 24px grid, drawn in currentColor. Always paired with a visible word. */
export interface IconProps { name: IconName; size?: number; title?: string; className?: string; stroke?: number }

export const iconNames = Object.keys(ICON_PATHS) as IconName[];

export function Icon({ name, size = 20, title, className, stroke = 1.75 }: IconProps) {
  const label = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  return (
    <svg className={cx('rt-ico', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...label}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] ?? ICON_PATHS.info }} />
  );
}
