/**
 * Money is always an integer number of bani (1 RON = 100 bani). See BUSINESS_LOGIC.md §1.
 * These helpers reject anything that is not a safe integer, so floats never sneak in.
 */
export type Bani = number;

export const CURRENCY = "RON" as const;
export type Currency = typeof CURRENCY;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/** Throws unless `value` is a safe integer (bani, quantity, …). */
export function assertInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be a safe integer, got ${value}`);
  }
}

export function assertBani(value: number, label = "amount"): asserts value is Bani {
  assertInteger(value, label);
}

/** quantity × unit price, both integers, with an overflow check. */
export function multiplyBani(quantity: number, unitPrice: Bani): Bani {
  assertInteger(quantity, "quantity");
  assertBani(unitPrice, "unitPrice");
  const result = quantity * unitPrice;
  assertBani(result, "quantity × unitPrice");
  return result;
}

/** Romanian format: 28500 → "285 RON", 27075 → "270,75 RON", 160000 → "1.600 RON". Integer maths only. */
export function formatRon(amount: Bani): string {
  assertBani(amount);
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const ron = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const bani = abs % 100;
  const decimals = bani === 0 ? "" : `,${String(bani).padStart(2, "0")}`;
  return `${sign}${ron}${decimals} RON`;
}
