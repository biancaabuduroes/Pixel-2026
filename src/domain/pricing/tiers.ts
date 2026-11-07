import { assertInteger, type Bani } from "../money";

/** One price tier: from `minQty` units (group total) every unit costs `unitPrice` bani. */
export interface PriceTier {
  minQty: number;
  unitPrice: Bani;
}

/** Throws if the tier list can't be priced from (empty, or first tier isn't minQty 1). */
function assertPriceable(tiers: readonly PriceTier[]): void {
  if (tiers.length === 0 || tiers[0].minQty !== 1) {
    throw new Error("Tiers must be validated first: at least one tier, starting at minQty 1");
  }
}

/** The base price is the first tier's price (minQty = 1). */
export function basePrice(tiers: readonly PriceTier[]): Bani {
  assertPriceable(tiers);
  return tiers[0].unitPrice;
}

/**
 * BL §2: the unitPrice of the tier with the highest minQty ≤ qty,
 * treating qty < 1 as 1 so an empty group shows the base price.
 */
export function tierPrice(tiers: readonly PriceTier[], qty: number): Bani {
  assertPriceable(tiers);
  assertInteger(qty, "qty");
  const effective = Math.max(qty, 1);
  let price = tiers[0].unitPrice;
  for (const tier of tiers) {
    if (tier.minQty <= effective) price = tier.unitPrice;
    else break;
  }
  return price;
}

/** The next tier above the current group total, or null at the top tier. Exact (not AI). */
export function nextTier(
  tiers: readonly PriceTier[],
  qty: number,
): { tier: PriceTier; unitsMissing: number } | null {
  assertPriceable(tiers);
  assertInteger(qty, "qty");
  const effective = Math.max(qty, 1);
  const tier = tiers.find((t) => t.minQty > effective);
  return tier ? { tier, unitsMissing: tier.minQty - qty } : null;
}

/** minQty of the second tier — the first discount — or null if the product has a single tier. */
export function firstDiscountThreshold(tiers: readonly PriceTier[]): number | null {
  return tiers.length > 1 ? tiers[1].minQty : null;
}

/** BL §3: "tier unlocked" is a fact about the group total, not a separate state. */
export function isFirstDiscountUnlocked(tiers: readonly PriceTier[], qty: number): boolean {
  const threshold = firstDiscountThreshold(tiers);
  return threshold !== null && qty >= threshold;
}

/** BL §6: savings = quantity × (base price − final unit price). */
export function savings(tiers: readonly PriceTier[], quantity: number, finalUnitPrice: Bani): Bani {
  assertInteger(quantity, "quantity");
  assertInteger(finalUnitPrice, "finalUnitPrice");
  return quantity * (basePrice(tiers) - finalUnitPrice);
}
