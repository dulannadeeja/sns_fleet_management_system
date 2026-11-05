// Props as in design-system/components/index.d.ts (the master). Keep names and shapes identical.
export type Lang = 'si' | 'en';
export type { IconName } from './plate/icons';
import type { IconName } from './plate/icons';

export interface NavItem { icon: IconName; label: string; active?: boolean; badge?: number | string; badgeTone?: 'overdue' | 'waiting'; badgeHref?: string; group?: 0 | 1 | 2 | 3 | 9; en?: string; href?: string; onClick?: () => void }
