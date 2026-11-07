import { formatRon, type Bani } from "../money";
import { tierPrice, type PriceTier } from "../pricing";
import { forecastNextTier, LABEL_PROBABILITY_PCT, type JoinEvent, type TierForecast } from "./forecast";

export interface CandidateGroup {
  groupId: string;
  status: "OPEN" | "SETTLING" | "SETTLED" | "CANCELLED";
  opensAt: Date;
  closesAt: Date;
  totalQty: number;
  joinEvents: readonly JoinEvent[];
}

export interface RankedGroup {
  groupId: string;
  closesAt: Date;
  /** Read from the pricing rules (tierPrice) — never produced by the AI. */
  currentUnitPrice: Bani;
  forecast: TierForecast | null;
  /** Ranking score only: expected unit price × 100 (integer). Lower ranks first. Not a price. */
  score: number;
  reasons: string[];
}

export interface Recommendation {
  ranked: RankedGroup[];
  /** AI estimate: the group with the lowest expected unit price. */
  recommendedGroupId: string | null;
  /** Exact calculation: fewest units missing to the next tier. */
  closestToUnlockingGroupId: string | null;
}

const FORECAST_TEXT = {
  LIKELY: "Likely to unlock before closing (estimate)",
  POSSIBLE: "Possible before closing (estimate)",
  UNLIKELY: "Unlikely before closing (estimate)",
} as const;

/**
 * BL §11 recommendation, as decided 2026-11-07: expected unit price
 * = p × next-tier price + (1 − p) × current price, lowest first, ties → earlier closing.
 * Only groups that still accept joins are ranked.
 */
export function recommendGroups(tiers: readonly PriceTier[], groups: readonly CandidateGroup[], now: Date): Recommendation {
  const ranked = groups
    .filter((g) => g.status === "OPEN" && now.getTime() < g.closesAt.getTime())
    .map((g): RankedGroup => {
      const currentUnitPrice = tierPrice(tiers, g.totalQty);
      const forecast = forecastNextTier({ tiers, totalQty: g.totalQty, opensAt: g.opensAt, closesAt: g.closesAt, now, joinEvents: g.joinEvents });
      const p = forecast ? LABEL_PROBABILITY_PCT[forecast.label] : 0;
      const score = forecast ? p * forecast.nextTier.unitPrice + (100 - p) * currentUnitPrice : 100 * currentUnitPrice;
      const reasons = [`Current price ${formatRon(currentUnitPrice)} per unit`];
      if (forecast) {
        reasons.push(`${forecast.unitsMissing} more units unlock ${formatRon(forecast.nextTier.unitPrice)}`);
        reasons.push(FORECAST_TEXT[forecast.label]);
      } else {
        reasons.push("Best price already unlocked");
      }
      return { groupId: g.groupId, closesAt: g.closesAt, currentUnitPrice, forecast, score, reasons };
    })
    .sort((a, b) => a.score - b.score || a.closesAt.getTime() - b.closesAt.getTime() || a.groupId.localeCompare(b.groupId));

  const unlockable = ranked
    .filter((r) => r.forecast)
    .sort((a, b) => a.forecast!.unitsMissing - b.forecast!.unitsMissing || a.closesAt.getTime() - b.closesAt.getTime());

  return {
    ranked,
    recommendedGroupId: ranked[0]?.groupId ?? null,
    closestToUnlockingGroupId: unlockable[0]?.groupId ?? null,
  };
}
