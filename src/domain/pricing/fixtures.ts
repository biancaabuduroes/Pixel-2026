import type { PriceTier } from "./tiers";
import type { PricingConfig } from "./validation";

/** Demo script tiers: 100 RON base, 95 RON from 50 units, 90 RON from 100 units. */
export const DEMO_TIERS: readonly PriceTier[] = [
  { minQty: 1, unitPrice: 10000 },
  { minQty: 50, unitPrice: 9500 },
  { minQty: 100, unitPrice: 9000 },
];

export const DEMO_CONFIG: PricingConfig = {
  stockTotal: 200,
  perBuyerCap: 10,
  tiers: DEMO_TIERS,
  durationsHours: [24, 168],
  pickupDeadlineDays: 7,
};
