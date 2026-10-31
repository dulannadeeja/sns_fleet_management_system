// Money is whole rupees (TRD › Integrity rules). This is the one place a partner's share is computed.

function wholeRupees(n: number, what: string): void {
  if (!Number.isSafeInteger(n)) throw new Error(`${what} must be a whole number of rupees, got ${n}`);
}

/** Splits an amount between the partner and SNS. `partnerBasisPoints` is the partner's share in hundredths of a percent (85% = 8500).
 *  The partner's share is rounded down to the rupee; SNS takes the rest, so the two always add up to the amount (system design §17.3).
 *  Negative amounts are refused: how a negative line splits is not decided yet; ask the owner before allowing them. */
export function splitShare(amount: number, partnerBasisPoints: number): { partner: number; sns: number } {
  wholeRupees(amount, 'amount');
  if (amount < 0) throw new Error('splitting a negative amount is not decided yet (system design §17.3 covers earnings lines only)');
  if (!Number.isInteger(partnerBasisPoints) || partnerBasisPoints < 0 || partnerBasisPoints > 10000) {
    throw new Error(`partner share must be 0 to 10000 basis points, got ${partnerBasisPoints}`);
  }
  const partner = Number((BigInt(amount) * BigInt(partnerBasisPoints)) / BigInt(10000)); // both non-negative: division rounds down
  return { partner, sns: amount - partner };
}
