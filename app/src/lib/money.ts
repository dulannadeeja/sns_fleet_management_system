// Money is whole rupees (TRD › Integrity rules). This is the one place a partner's share is computed.

function wholeRupees(n: number, what: string): void {
  if (!Number.isSafeInteger(n)) throw new Error(`${what} must be a whole number of rupees, got ${n}`);
}

/** Splits an amount between the partner and SNS. `partnerBasisPoints` is the partner's share in hundredths of a percent (85% = 8500).
 *  A positive line: the partner's share is rounded down to the rupee and SNS takes the rest (system design §17.3, DN-10).
 *  A negative line (a correction): the exact mirror of the positive one, so a full correction undoes the original (DN-21, AT-84).
 *  The two shares always add up to the amount. */
export function splitShare(amount: number, partnerBasisPoints: number): { partner: number; sns: number } {
  wholeRupees(amount, 'amount');
  if (!Number.isInteger(partnerBasisPoints) || partnerBasisPoints < 0 || partnerBasisPoints > 10000) {
    throw new Error(`partner share must be 0 to 10000 basis points, got ${partnerBasisPoints}`);
  }
  const positive = Number((BigInt(Math.abs(amount)) * BigInt(partnerBasisPoints)) / BigInt(10000)); // non-negative: rounds down
  const partner = amount < 0 ? -positive : positive;
  return { partner, sns: amount - partner };
}
