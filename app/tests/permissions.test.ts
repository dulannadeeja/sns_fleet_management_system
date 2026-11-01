import { describe, it, expect } from 'vitest';
import { allows, defaultPermissions, PERMISSION_KEYS } from '../src/auth/permissions';

// System design 3.2: the catalogue and its agreed defaults.
describe('permission catalogue', () => {
  it('staff start with the "employees or admins" rows only', () => {
    expect(defaultPermissions('staff').sort()).toEqual([
      'allowPaymentAfterReturn', 'approveFirstCustomer', 'decideDamageCharge', 'decideLateCharge', 'extendByPhone',
      'markCarUnavailable', 'proceedDespiteFlag', 'refundsAndExpenses', 'setOrWaiveDeposit',
    ]);
  });
  it('the admin also starts with the admin rows, payroll and export (Proposed), not the authorised-person rows', () => {
    const admin = defaultPermissions('admin');
    expect(admin).toEqual(expect.arrayContaining(['correctPayment', 'payPartnerCashouts', 'seeActivityLog', 'managePayroll', 'exportReports']));
    for (const key of ['reconcilePayments', 'writeOffDebt', 'keepCancellationFee', 'overrideExpiredDocuments']) expect(admin).not.toContain(key);
  });
  it('the owner and partners have none listed', () => {
    expect(defaultPermissions('owner')).toEqual([]);
    expect(defaultPermissions('partner')).toEqual([]);
  });
  it('the owner may do everything; a turned-off person nothing; others what they were given', () => {
    const none = new Set<string>();
    for (const key of PERMISSION_KEYS) expect(allows({ role: 'owner', disabledAt: null }, none, key)).toBe(true);
    expect(allows({ role: 'owner', disabledAt: new Date() }, none, 'exportReports')).toBe(false);
    expect(allows({ role: 'staff', disabledAt: null }, new Set(['exportReports']), 'exportReports')).toBe(true);
    expect(allows({ role: 'staff', disabledAt: new Date() }, new Set(['exportReports']), 'exportReports')).toBe(false);
    expect(allows({ role: 'partner', disabledAt: null }, new Set(['exportReports']), 'exportReports')).toBe(false);
  });
});
