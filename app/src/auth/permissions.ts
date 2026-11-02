// The permission catalogue: one key per row of system design 3.2 "Default permissions" (Confirmed), with the role that
// starts with it. "authorised" rows start with nobody: only the owner can do them until the owner gives them to someone
// (Derived control, ST-15.1). Manage payroll and Export reports start with the admin (Proposed, Dulan 1 Nov 2026).
// Adding people, changing permissions and turning accounts off or on are the primary owner's only and are not here:
// they can never be given to anyone (system design 3.2, Delegation).
export type Role = 'owner' | 'admin' | 'staff' | 'partner';
export type StartsWith = 'staffAndAdmin' | 'admin' | 'authorised';
export type PermissionGroup = 'rentals' | 'money' | 'running';

export const PERMISSIONS = {
  // Rentals
  // Customer access (Proposed, Dulan 1 Nov 2026): find, add and correct customers, open their document copies.
  customerAccess: { group: 'rentals', startsWith: 'staffAndAdmin' },
  approveFirstCustomer: { group: 'rentals', startsWith: 'staffAndAdmin' },
  proceedDespiteFlag: { group: 'rentals', startsWith: 'staffAndAdmin' },
  setOrWaiveDeposit: { group: 'rentals', startsWith: 'staffAndAdmin' },
  allowPaymentAfterReturn: { group: 'rentals', startsWith: 'staffAndAdmin' },
  extendByPhone: { group: 'rentals', startsWith: 'staffAndAdmin' },
  decideLateCharge: { group: 'rentals', startsWith: 'staffAndAdmin' },
  decideDamageCharge: { group: 'rentals', startsWith: 'staffAndAdmin' },
  allocateDamageProceeds: { group: 'rentals', startsWith: 'admin' },
  sharePartnerCarSurcharge: { group: 'rentals', startsWith: 'admin' },
  changePriceOrDiscount: { group: 'rentals', startsWith: 'admin' },
  reduceEarlyReturnCharges: { group: 'rentals', startsWith: 'admin' },
  decideSwapPricing: { group: 'rentals', startsWith: 'admin' },
  // Money
  refundsAndExpenses: { group: 'money', startsWith: 'staffAndAdmin' },
  correctPayment: { group: 'money', startsWith: 'admin' },
  reconcilePayments: { group: 'money', startsWith: 'authorised' },
  writeOffDebt: { group: 'money', startsWith: 'authorised' },
  keepCancellationFee: { group: 'money', startsWith: 'authorised' },
  overrideExpiredDocuments: { group: 'money', startsWith: 'authorised' },
  // Running SNS
  payPartnerCashouts: { group: 'running', startsWith: 'admin' },
  seePartnerEarnings: { group: 'running', startsWith: 'admin' },
  seeActivityLog: { group: 'running', startsWith: 'admin' },
  editCarsAndPackages: { group: 'running', startsWith: 'admin' },
  editPartners: { group: 'running', startsWith: 'admin' },
  markCarUnavailable: { group: 'running', startsWith: 'staffAndAdmin' },
  markCarAvailable: { group: 'running', startsWith: 'admin' },
  managePayroll: { group: 'running', startsWith: 'admin' },
  exportReports: { group: 'running', startsWith: 'admin' },
} as const satisfies Record<string, { group: PermissionGroup; startsWith: StartsWith }>;

export type Permission = keyof typeof PERMISSIONS;
export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as Permission[];

export function isPermission(key: string): key is Permission {
  return Object.hasOwn(PERMISSIONS, key);
}

/** The permissions a new person of this role starts with (ST-15.2). The owner can do everything and has none listed. */
export function defaultPermissions(role: Role): Permission[] {
  if (role !== 'admin' && role !== 'staff') return [];
  return PERMISSION_KEYS.filter((key) => {
    const startsWith: StartsWith = PERMISSIONS[key].startsWith;
    return startsWith === 'staffAndAdmin' || (startsWith === 'admin' && role === 'admin');
  });
}

/** Whether a person may do something: the owner may do everything; a turned-off person nothing; others need a grant. */
export function allows(person: { role: string; disabledAt: Date | null }, granted: ReadonlySet<string>, permission: Permission): boolean {
  if (person.disabledAt) return false;
  if (person.role === 'owner') return true;
  if (person.role !== 'admin' && person.role !== 'staff') return false;
  return granted.has(permission);
}
