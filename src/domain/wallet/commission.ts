import { assertBani, type Bani } from "../money";

/** Commission rates are integer basis points (1 bp = 0.01%), so 5% = 500. No floats. */
export type BasisPoints = number;

/**
 * Parses a decimal rate string like "0.05" (PlatformSetting commissionRate) into
 * basis points without floating-point maths. Accepts 0 ≤ rate < 1 with ≤ 4 decimals.
 */
export function parseRateToBasisPoints(rate: string): BasisPoints {
  const match = /^0(?:\.(\d{1,4}))?$/.exec(rate.trim());
  if (!match) throw new Error(`Invalid commission rate "${rate}": expected a decimal between 0 and 1 with up to 4 decimals`);
  return Number((match[1] ?? "").padEnd(4, "0"));
}

/** BL §8: commission = round(amount × rate), half up, to whole bani. */
export function commissionFor(amount: Bani, rateBps: BasisPoints): Bani {
  assertBani(amount);
  if (amount < 0) throw new Error("amount must be ≥ 0");
  if (!Number.isSafeInteger(rateBps) || rateBps < 0 || rateBps >= 10_000) throw new Error("rateBps must be 0–9999");
  return Math.floor((amount * rateBps + 5_000) / 10_000);
}

/** Seller gets the remainder, so commission + sellerAmount = amount exactly. */
export function splitPayout(amount: Bani, rateBps: BasisPoints): { commission: Bani; sellerAmount: Bani } {
  const commission = commissionFor(amount, rateBps);
  return { commission, sellerAmount: amount - commission };
}
