import type { PriceTier } from "./tiers";

/** What a seller submits when publishing a product (BL §2). */
export interface PricingConfig {
  stockTotal: number;
  perBuyerCap: number;
  tiers: readonly PriceTier[];
  durationsHours: readonly number[];
  pickupDeadlineDays: number;
}

export type PricingViolationCode =
  | "NO_TIERS"
  | "FIRST_TIER_NOT_ONE"
  | "INVALID_MIN_QTY"
  | "MIN_QTY_NOT_INCREASING"
  | "INVALID_PRICE"
  | "PRICE_NOT_DECREASING"
  | "INVALID_STOCK"
  | "INVALID_CAP"
  | "CAP_NOT_BELOW_FIRST_DISCOUNT"
  | "TOP_TIER_ABOVE_STOCK"
  | "NO_DURATIONS"
  | "INVALID_DURATION"
  | "DUPLICATE_DURATION"
  | "INVALID_PICKUP_DEADLINE";

export interface PricingViolation {
  code: PricingViolationCode;
  message: string;
  /** Index of the tier or duration the violation refers to, when there is one. */
  index?: number;
}

const isPositiveInt = (n: number) => Number.isSafeInteger(n) && n >= 1;

/**
 * Validates a product's pricing configuration against BL §2 rules 1–6.
 * Returns every violation (empty array = valid) so a form can show them all at once.
 * Runs in the form and again on the server.
 */
export function validatePricingConfig(config: PricingConfig): PricingViolation[] {
  const v: PricingViolation[] = [];
  const { tiers, stockTotal, perBuyerCap, durationsHours, pickupDeadlineDays } = config;

  // Rule 1: at least one tier, first tier minQty = 1.
  if (tiers.length === 0) {
    v.push({ code: "NO_TIERS", message: "Add at least one price tier." });
  } else if (tiers[0].minQty !== 1) {
    v.push({ code: "FIRST_TIER_NOT_ONE", message: "The first tier must start at quantity 1.", index: 0 });
  }

  tiers.forEach((tier, i) => {
    if (!isPositiveInt(tier.minQty)) {
      v.push({ code: "INVALID_MIN_QTY", message: "Quantities must be whole numbers ≥ 1.", index: i });
    }
    // Rule 3: every price > 0 (integer bani).
    if (!isPositiveInt(tier.unitPrice)) {
      v.push({ code: "INVALID_PRICE", message: "Prices must be whole bani greater than 0.", index: i });
    }
    if (i === 0) return;
    const prev = tiers[i - 1];
    // Rule 2: minQty strictly increases (no duplicates, no overlaps).
    if (!(tier.minQty > prev.minQty)) {
      v.push({ code: "MIN_QTY_NOT_INCREASING", message: "Each tier must start at a higher quantity than the previous one.", index: i });
    }
    // Rule 3: unitPrice strictly decreases.
    if (!(tier.unitPrice < prev.unitPrice)) {
      v.push({ code: "PRICE_NOT_DECREASING", message: "Each tier must be cheaper than the previous one.", index: i });
    }
  });

  if (!Number.isSafeInteger(stockTotal) || stockTotal < 0) {
    v.push({ code: "INVALID_STOCK", message: "Stock must be a whole number ≥ 0." });
  }

  // Rule 4: 1 ≤ perBuyerCap < second tier's minQty (no single buyer unlocks a discount alone).
  if (!isPositiveInt(perBuyerCap)) {
    v.push({ code: "INVALID_CAP", message: "The per-buyer limit must be a whole number ≥ 1." });
  } else if (tiers.length > 1 && perBuyerCap >= tiers[1].minQty) {
    v.push({ code: "CAP_NOT_BELOW_FIRST_DISCOUNT", message: `The per-buyer limit must be lower than ${tiers[1].minQty}, the first discount quantity.` });
  }

  // Rule 5: highest threshold ≤ stock, otherwise that tier can never be reached.
  if (tiers.length > 0 && Number.isSafeInteger(stockTotal) && tiers[tiers.length - 1].minQty > stockTotal) {
    v.push({ code: "TOP_TIER_ABOVE_STOCK", message: "The highest tier needs more units than the stock.", index: tiers.length - 1 });
  }

  // Rule 6: at least one duration; durations are whole hours, unique (DATA_MODEL ProductDuration).
  if (durationsHours.length === 0) {
    v.push({ code: "NO_DURATIONS", message: "Offer at least one group duration." });
  }
  const seen = new Set<number>();
  durationsHours.forEach((h, i) => {
    if (!isPositiveInt(h)) {
      v.push({ code: "INVALID_DURATION", message: "Durations must be whole hours ≥ 1.", index: i });
    } else if (seen.has(h)) {
      v.push({ code: "DUPLICATE_DURATION", message: "Each duration can be offered only once.", index: i });
    }
    seen.add(h);
  });

  if (!isPositiveInt(pickupDeadlineDays)) {
    v.push({ code: "INVALID_PICKUP_DEADLINE", message: "The pickup deadline must be a whole number of days ≥ 1." });
  }

  return v;
}
