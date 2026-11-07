import { nextTier, type PriceTier } from "../pricing";

/**
 * AI tier forecast — an ESTIMATE only (BL §11). Its output is shown to buyers and used
 * to rank groups; it is never an input to pricing, settlement or the wallet.
 * Rules decided 2026-11-07 (OPEN_QUESTIONS.md).
 */
export type ForecastLabel = "LIKELY" | "POSSIBLE" | "UNLIKELY";

export const LIKELY_RATIO = 1.25;
export const POSSIBLE_RATIO = 0.75;

/** Probability (in %) used for ranking. Integer, so ranking scores stay integers. */
export const LABEL_PROBABILITY_PCT: Record<ForecastLabel, number> = { LIKELY: 80, POSSIBLE: 50, UNLIKELY: 20 };

const HOUR_MS = 60 * 60 * 1000;

export interface JoinEvent {
  quantity: number;
  createdAt: Date;
}

export interface TierForecast {
  label: ForecastLabel;
  nextTier: PriceTier;
  /** Exact units still missing (a calculation, not AI). */
  unitsMissing: number;
  /** Units joined per hour since the group opened. */
  pacePerHour: number;
  /** Units expected to join before closing at the current pace. */
  projectedUnits: number;
}

export function forecastNextTier(input: {
  tiers: readonly PriceTier[];
  totalQty: number;
  opensAt: Date;
  closesAt: Date;
  now: Date;
  /** The group's join history, real and simulated. */
  joinEvents: readonly JoinEvent[];
}): TierForecast | null {
  const next = nextTier(input.tiers, input.totalQty);
  if (!next) return null; // top tier reached: nothing to forecast

  const now = input.now.getTime();
  const opensAt = input.opensAt.getTime();
  const joined = input.joinEvents
    .filter((e) => e.createdAt.getTime() >= opensAt && e.createdAt.getTime() <= now)
    .reduce((sum, e) => sum + e.quantity, 0);

  const hoursElapsed = Math.max(1, (now - opensAt) / HOUR_MS); // at least 1h, to damp early spikes
  const hoursLeft = Math.max(0, (input.closesAt.getTime() - now) / HOUR_MS);
  const pacePerHour = joined / hoursElapsed;
  const projectedUnits = pacePerHour * hoursLeft;
  const ratio = projectedUnits / next.unitsMissing;

  const label: ForecastLabel = ratio >= LIKELY_RATIO ? "LIKELY" : ratio >= POSSIBLE_RATIO ? "POSSIBLE" : "UNLIKELY";
  return { label, nextTier: next.tier, unitsMissing: next.unitsMissing, pacePerHour, projectedUnits };
}
