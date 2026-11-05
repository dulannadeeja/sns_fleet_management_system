import { ICON_PATHS } from './plate/icons';
import { cx } from './text';
import type { IconName } from './types';

/** Line icon on a 24px grid, drawn in currentColor. Always paired with a visible word. */
export interface IconProps { name: IconName; size?: number; title?: string; className?: string }

export const iconNames = Object.keys(ICON_PATHS) as IconName[];

export function Icon({ name, size = 20, title, className }: IconProps) {
  const label = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  // The drawings are fixed markup from design-system/components/bundle.js; an unknown name falls back to `info`.
  const paths = Object.hasOwn(ICON_PATHS, name) ? ICON_PATHS[name] : ICON_PATHS.info;
  return (
    <svg className={cx('rt-ico', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...label} dangerouslySetInnerHTML={{ __html: paths }} />
  );
}
