import type * as React from 'react';

export type Lang = 'si' | 'en';
export type VehicleStatus = 'overdue' | 'available' | 'rented' | 'repair' | 'unavailable' | 'retired';
export type MoneyState = 'recorded' | 'notChecked' | 'matched' | 'unmatched' | 'resolved' | 'open' | 'provisional' | 'finalised' | 'paid' | 'partPaid' | 'pending' | 'deposit';
export type IconName = 'car' | 'key' | 'check' | 'clockAlert' | 'clock' | 'wrench' | 'pause' | 'link' | 'unlink' | 'lock' | 'eyeOff' | 'hourglass' | 'banknote' | 'drawer' | 'alert' | 'info' | 'question' | 'flag' | 'stamp' | 'plus' | 'camera' | 'phone' | 'search' | 'home' | 'clipboard' | 'users' | 'handshake' | 'wallet' | 'chart' | 'settings' | 'arrowRight' | 'arrowLeft' | 'returnCar' | 'file' | 'x' | 'calendar' | 'calendarPlus' | 'gauge' | 'fuel' | 'pen' | 'idcard' | 'more' | 'swap' | 'receipt' | 'box';

/** Line icon on a 24px grid, drawn in currentColor. Always paired with a visible word. */
export interface IconProps { name: IconName; size?: number; title?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

/** Vehicle status: colour + icon + word. Overdue is the only solid chip. */
export interface StatusChipProps { status: VehicleStatus; lang?: Lang; detail?: string; size?: 'sm' | 'md'; label?: string; icon?: IconName; className?: string }
export declare function StatusChip(props: StatusChipProps): React.ReactElement;

/** Money record state. Recorded and reconciliation are separate pills; Matched always carries `by`. */
export interface StatePillProps { kind: MoneyState; lang?: Lang; by?: string; label?: string; className?: string }
export declare function StatePill(props: StatePillProps): React.ReactElement;

/** Registration number: the primary vehicle identifier. */
export interface PlateBadgeProps { plate: string; size?: 'sm' | 'lg'; lang?: Lang; className?: string }
export declare function PlateBadge(props: PlateBadgeProps): React.ReactElement;

/** The model's image from the SNS vehicle PNG pack v2. Fills its slot; give the slot a size. Unknown models show the generic car. */
export type VehicleFamily = 'wagon-r' | 'alto' | 'spacia' | 'every' | 'prius' | 'axio' | 'hustler' | 'van' | 'mid-suv' | 'suv' | 'pickup' | 'station-wagon' | 'premium-sedan' | 'generic';
export interface VehicleImageProps { model: string; size?: 'sm' | 'lg'; label?: string; className?: string }
export declare function VehicleImage(props: VehicleImageProps): React.ReactElement;
export declare function vehicleKey(model: string): VehicleFamily;

/** Superseded by VehicleImage: with `model` it shows the model's image; the line drawing only when no model is known. */
export interface VehicleSilhouetteProps { model?: string; size?: 'sm' | 'lg'; body?: 'hatch' | 'van' | 'sedan'; label?: string; className?: string }
export declare function VehicleSilhouette(props: VehicleSilhouetteProps): React.ReactElement;

interface VehicleData { plate: string; model: string; status: VehicleStatus; statusDetail?: string; next?: string; partner?: boolean; partnerName?: string; photo?: string; body?: 'hatch' | 'van' | 'sedan'; lang?: Lang; onClick?: () => void; className?: string }
/** Gallery card: photo + status over the corner, large plate, model · ownership, one warning, one next-event line. */
export interface VehicleCardProps extends VehicleData { warning?: { label: string; icon?: IconName }; canAddPhoto?: boolean }
export declare function VehicleCard(props: VehicleCardProps): React.ReactElement;
/** Compact car line: thumbnail; plate and status chip; model · owner · next event. A link when `href` is given. */
export interface VehicleRowProps extends VehicleData { href?: string }
export declare function VehicleRow(props: VehicleRowProps): React.ReactElement;

/** One row of a ListCard: icon, title, detail, one value (figure or meta), arrow. A link when `href` is given. */
export interface ListRowProps { icon?: IconName; tone?: 'warning' | 'overdue' | 'key'; title?: string; detail?: string; plate?: string; tag?: string; figure?: number | string; currency?: boolean; meta?: string; href?: string; small?: boolean }
export interface ListGroup { label?: string; rows: (ListRowProps | { car: VehicleRowProps } | { link: { label: string; href: string } })[] }
/** A card of divided rows, optionally in labelled groups, with a "see all" link and a footnote. One kind of thing per row; figures never summed across rows. */
export interface ListCardProps { title?: string; sub?: string; more?: { label: string; href: string }; groups?: ListGroup[]; rows?: ListGroup['rows']; foot?: string; columns?: 1 | 2; heading?: 'h2' | 'h3'; bare?: boolean; className?: string }
export declare function ListCard(props: ListCardProps): React.ReactElement;
export declare function ListRow(props: ListRowProps): React.ReactElement;

/** A verb with an icon, 48px tall. One primary per screen. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; icon?: IconName; full?: boolean }
export declare function Button(props: ButtonProps): React.ReactElement;

/** A labelled text input (boards 01.1, 01.2): `label` "සිංහල · English", the required mark in words, a hint, an error that says what to fix. Other props go to the <input>. */
export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; name: string; hint?: string; error?: string; requiredLabel?: string; className?: string }
export declare function TextField(props: TextFieldProps): React.ReactElement;

/** Sticky labelled counts: Overdue · Open items · Waiting for admin · Today's decisions. */
export interface AttentionItem { label: string; count: number; tone?: 'overdue' | 'warning' | 'info' | 'neutral'; icon?: IconName; href?: string; onClick?: () => void }
export interface AttentionBarProps { items: AttentionItem[]; className?: string }
export declare function AttentionBar(props: AttentionBarProps): React.ReactElement;

/** One kind of money per block, never summed with another block. */
export interface MoneyLine { label: string; amount: number | string; sign?: 'in' | 'out'; total?: boolean }
export interface MoneyBlockProps { label: string; icon?: IconName; figure?: number | null; state?: string; lines?: MoneyLine[]; note?: string; pill?: React.ReactNode; alert?: boolean; children?: React.ReactNode; className?: string }
export declare function MoneyBlock(props: MoneyBlockProps): React.ReactElement;

/** Handover/return gate. `open` = an item whose blocking rule is an undecided owner question. */
export interface ChecklistItem { state: 'done' | 'missing' | 'open'; label: string; meta?: string; tag?: string; icon?: IconName; action?: React.ReactNode }
export interface ChecklistProps { title: string; items: ChecklistItem[]; progressLabel?: string; footer?: React.ReactNode; className?: string }
export declare function Checklist(props: ChecklistProps): React.ReactElement;

/** Four-part explanation beside a disabled or denied action: what, why, who can, next step. */
export interface BlockedPanelProps { what: string; why: string; who: string; next: string; actionLabel?: string; actionIcon?: IconName; onAction?: () => void; icon?: IconName; lang?: Lang; className?: string }
export declare function BlockedPanel(props: BlockedPanelProps): React.ReactElement;

/** Persistent feedback after a money or vehicle action. */
export interface ConfirmationBlockProps { icon?: GameIconName; title: string; sentence?: string; rows?: { label: string; value: React.ReactNode }[]; actions?: React.ReactNode; className?: string }
export declare function ConfirmationBlock(props: ConfirmationBlockProps): React.ReactElement;

/** One event as a sentence: actor · what · record · amount, optional state pill, reason, time. */
export interface HistoryLineProps { actor: string; action: string; target?: string; amount?: number; type?: MoneyState; reason?: string; time: string; lang?: Lang; className?: string }
export declare function HistoryLine(props: HistoryLineProps): React.ReactElement;

/** Inline message: info, warning or danger. */
export interface NoticeProps { tone?: 'info' | 'warning' | 'danger'; title?: string; icon?: IconName; children?: React.ReactNode; className?: string }
export declare function Notice(props: NoticeProps): React.ReactElement;

/** "සිං | EN" switch; each option in its own script. `onLight` for the light top bar. */
/** Without onChange the buttons are marked aria-disabled (nothing to switch yet). `label`: the group's name for screen readers. */
export interface LanguageSwitchProps { lang?: Lang; onChange?: (lang: Lang) => void; onLight?: boolean; label?: string }
export declare function LanguageSwitch(props: LanguageSwitchProps): React.ReactElement;

/** The SNS Rent Car logo (supplied file). `variant="mark"`: the yellow "S" alone, for app icons only. */
export interface BrandMarkProps { size?: 'sm' | 'lg'; variant?: 'full' | 'mark'; className?: string }
export declare function BrandMark(props: BrandMarkProps): React.ReactElement;

/** Light desktop top bar: page title + subtitle, search (a link to the search screen), New rental, language switch, initials (+ name and role at 1,100px and wider). */
export interface AppHeaderProps { title: string; subtitle?: string; search?: string; searchHref?: string; newHref?: string; newLabel?: string; showMark?: boolean; user?: string; role?: string; lang?: Lang; onLang?: (lang: Lang) => void; className?: string }
export declare function AppHeader(props: AppHeaderProps): React.ReactElement;

/** Desktop navigation: 264px labelled sidebar grouped by job; logo on top, Settings at the bottom. Trimmed by permission. New rental lives in AppHeader. */
export interface NavItem { icon: IconName; label: string; active?: boolean; badge?: number | string; badgeTone?: 'overdue' | 'waiting'; badgeHref?: string; group?: 0 | 1 | 2 | 3 | 9; en?: string; href?: string; onClick?: () => void }
/** `labels`: words for screen readers (the menu's name; after a count: overdue, waiting, and "show them" when the count is a link). Defaults are the design system's. */
export interface NavRailLabels { menu?: string; overdue?: string; waiting?: string; show?: string }
export interface NavRailProps { items: NavItem[]; newHref?: string; newLabel?: string; footer?: React.ReactNode; labels?: NavRailLabels; className?: string }
export declare function NavRail(props: NavRailProps): React.ReactElement;

/** Whole fleet as one tick per car, ordered overdue → available → rented → repair → unavailable, with a worded, linked legend. `warn` rings a tick (e.g. not found at the morning check). */
export interface FleetStripProps { cars: { plate: string; status: Exclude<VehicleStatus, 'retired'>; warn?: boolean }[]; hrefs?: Partial<Record<Exclude<VehicleStatus, 'retired'>, string>>; lang?: Lang; label?: string; className?: string }
export declare function FleetStrip(props: FleetStripProps): React.ReactElement;

/** Phone navigation: 4 tabs, icon above a visible label; optional raised centre action (`fab`) for the one most frequent task. */
export interface BottomTabBarProps { tabs: NavItem[]; fab?: { icon?: IconName; label: string; href?: string; active?: boolean; onClick?: () => void }; label?: string; className?: string }
export declare function BottomTabBar(props: BottomTabBarProps): React.ReactElement;

/** One of the 44 SNS 3D icons. Only on launcher tiles, quick actions, empty states and done screens. */
export type GameIconName = 'activity-log' | 'add-customer' | 'all-cars' | 'approvals' | 'bank-card-check' | 'close-day' | 'count-drawer' | 'customers' | 'done-cashout' | 'done-day' | 'done-drawer' | 'done-handover' | 'done-payment' | 'done-return' | 'done-sign-in' | 'empty-approvals' | 'empty-checks' | 'empty-debts' | 'empty-expenses' | 'empty-overdue' | 'empty-search' | 'expense' | 'extend-rental' | 'flag-customer' | 'handover' | 'maintenance' | 'morning-check' | 'my-payslip' | 'new-rental' | 'offline' | 'partner-cashouts' | 'partner-owners' | 'partner-statement' | 'payroll' | 'print-document' | 'ready-to-start' | 'receive-return' | 'received-by-staff' | 'record-payment' | 'rentals' | 'reports' | 'search' | 'settings' | 'swap-car';
export interface GameIconProps { name: GameIconName; size?: 'tile' | 'lg' | 'hero' | number; label?: string; className?: string }
export declare function GameIcon(props: GameIconProps): React.ReactElement | null;
export interface LauncherTileProps { icon: GameIconName; label: string; href?: string; sub?: string; badge?: number | string; badgeTone?: 'overdue' | 'waiting'; onClick?: () => void; className?: string }
export declare function LauncherTile(props: LauncherTileProps): React.ReactElement;
export interface LauncherGridProps { title?: string; columns?: number; items: LauncherTileProps[]; className?: string }
export declare function LauncherGrid(props: LauncherGridProps): React.ReactElement;
export interface EmptyStateProps { icon?: GameIconName; title: string; body?: string; children?: React.ReactNode; className?: string }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

/** Phone page header: back link, title (Sinhala · English), subtitle, optional action. */
export interface PageHeaderProps { backHref?: string; backLabel?: string; title: string; subtitle?: string; numeric?: boolean; children?: React.ReactNode; className?: string }
export declare function PageHeader(props: PageHeaderProps): React.ReactElement;

declare global {
  interface Window {
    Plate: {
      Icon: typeof Icon; StatusChip: typeof StatusChip; StatePill: typeof StatePill; PlateBadge: typeof PlateBadge; VehicleSilhouette: typeof VehicleSilhouette; VehicleImage: typeof VehicleImage; vehicleKey: typeof vehicleKey;
      VehicleCard: typeof VehicleCard; VehicleRow: typeof VehicleRow; ListCard: typeof ListCard; ListRow: typeof ListRow; Button: typeof Button; TextField: typeof TextField; AttentionBar: typeof AttentionBar; MoneyBlock: typeof MoneyBlock;
      Checklist: typeof Checklist; BlockedPanel: typeof BlockedPanel; ConfirmationBlock: typeof ConfirmationBlock; HistoryLine: typeof HistoryLine; Notice: typeof Notice;
      AppHeader: typeof AppHeader; LanguageSwitch: typeof LanguageSwitch; NavRail: typeof NavRail; FleetStrip: typeof FleetStrip; BrandMark: typeof BrandMark; BottomTabBar: typeof BottomTabBar; PageHeader: typeof PageHeader; GameIcon: typeof GameIcon; LauncherTile: typeof LauncherTile; LauncherGrid: typeof LauncherGrid; EmptyState: typeof EmptyState;
      formatLKR: (n: number) => string;
    };
  }
}
