import { cx } from './text';
import type { Lang } from './types';

/** The registration number on a yellow plate face; the primary identifier of every car. Shown exactly as written. */
export interface PlateBadgeProps { plate: string; size?: 'sm' | 'lg'; lang?: Lang; className?: string }

export function PlateBadge({ plate, size, lang, className }: PlateBadgeProps) {
  return <span className={cx('rt-plate', size && `rt-plate-${size}`, className)} aria-label={`${lang === 'en' ? 'Registration ' : 'අංකය '}${plate}`}>{plate}</span>;
}
