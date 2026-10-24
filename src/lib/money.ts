/**
 * Money utilities for integer paise storage and Indian Rupee (INR) formatting.
 * All financial amounts are stored as integers representing paise (1 INR = 100 paise).
 */

/**
 * Splits an integer paise amount into two parts by a percentage (0-100).
 * Uses Math.round on the first part and assigns the exact remainder to the second part.
 * Guarantees that partA + partB === totalPaise under all odd-amount scenarios.
 */
export function splitPaise(totalPaise: number, percent: number): { partA: number; partB: number } {
  if (!Number.isFinite(totalPaise)) {
    return { partA: 0, partB: 0 };
  }
  const cleanTotal = Math.trunc(totalPaise);
  const clampedPercent = Math.max(0, Math.min(100, percent));
  
  const partA = Math.round((cleanTotal * clampedPercent) / 100);
  const partB = cleanTotal - partA;
  
  return { partA, partB };
}

/**
 * Converts a rupee number or string (e.g. 1500.50) into integer paise (150050).
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.trim().replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise into decimal rupees.
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.trunc(paise) / 100;
}

/**
 * Formats integer paise into a human-readable Indian currency string (₹).
 * Uses Indian digit grouping: 1,00,000 (lakhs/crores).
 * If the amount has no fractional paise, drops the .00 for a cleaner minimal look unless forceDecimals is true.
 */
export function formatPaise(
  paise: number,
  options: { symbol?: string; forceDecimals?: boolean } = {}
): string {
  const { symbol = '₹', forceDecimals = false } = options;
  if (!Number.isFinite(paise)) return `${symbol}0`;

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.trunc(paise));
  const rupees = absPaise / 100;
  const hasDecimals = absPaise % 100 !== 0;

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: forceDecimals || hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const formattedNumber = formatter.format(rupees);
  const prefix = isNegative ? '-' : '';
  return `${prefix}${symbol}${formattedNumber}`;
}
