import { forecastNextTier, type ForecastLabel, type JoinEvent } from "./forecast";
import type { Bani } from "../money";
import { basePrice, tierPrice, type PriceTier } from "../pricing";

/**
 * What a buyer sees about one open group, computed on the server (display only).
 * Prices come from the tier rules; the "probable" price is an AI estimate (BL §11) and is
 * always labelled as such — it never feeds pricing, settlement or the wallet.
 */
export interface GroupOffer {
  /** tierPrice(totalQty): what a buyer joining now locks as their maximum. */
  currentUnitPrice: Bani;
  baseUnitPrice: Bani;
  /** Whole-percent discount vs the base price; 0 = no badge. */
  discountPct: number;
  totalQty: number;
  /** Exact next tier (not AI), or null at the top tier. */
  next: { minQty: number; unitPrice: Bani; unitsMissing: number } | null;
  forecast: ForecastLabel | null;
  /** Estimate (decision 2026-11-07): next tier price if the forecast is LIKELY, else the current price. */
  probableUnitPrice: Bani;
}

export function groupOffer(input: {
  tiers: readonly PriceTier[];
  totalQty: number;
  opensAt: Date;
  closesAt: Date;
  now: Date;
  joinEvents: readonly JoinEvent[];
}): GroupOffer {
  const currentUnitPrice = tierPrice(input.tiers, input.totalQty);
  const baseUnitPrice = basePrice(input.tiers);
  const forecast = forecastNextTier(input);
  return {
    currentUnitPrice,
    baseUnitPrice,
    discountPct: Math.round(((baseUnitPrice - currentUnitPrice) * 100) / baseUnitPrice),
    totalQty: input.totalQty,
    next: forecast ? { minQty: forecast.nextTier.minQty, unitPrice: forecast.nextTier.unitPrice, unitsMissing: forecast.unitsMissing } : null,
    forecast: forecast?.label ?? null,
    probableUnitPrice: forecast?.label === "LIKELY" ? forecast.nextTier.unitPrice : currentUnitPrice,
  };
}

export type TierStep = { minQty: number; maxQty: number | null; unitPrice: Bani; state: "passed" | "current" | "probable" | "upcoming" };

/** The "Prețuri pe trepte" ladder: tiers with their ranges and where the group is. */
export function tierLadder(tiers: readonly PriceTier[], offer: Pick<GroupOffer, "totalQty" | "forecast" | "next">): TierStep[] {
  const qty = Math.max(offer.totalQty, 1);
  const currentIndex = tiers.findLastIndex((t) => t.minQty <= qty);
  return tiers.map((t, i) => ({
    minQty: t.minQty,
    maxQty: i + 1 < tiers.length ? tiers[i + 1].minQty - 1 : null,
    unitPrice: t.unitPrice,
    state:
      i < currentIndex ? "passed" : i === currentIndex ? "current" : offer.forecast === "LIKELY" && offer.next?.minQty === t.minQty ? "probable" : "upcoming",
  }));
}

export type Segment = "RAPID" | "ECHILIBRAT" | "CEL_MAI_IEFTIN";

/**
 * Pool page selector (decision 2026-11-07): open groups by closing time — earliest "Rapid",
 * latest "Cel mai ieftin", one in between "Echilibrat". Fewer than 2 groups → no selector.
 */
export function segmentGroups<G extends { closesAt: Date }>(groups: readonly G[]): { segment: Segment; group: G }[] {
  if (groups.length < 2) return [];
  const sorted = [...groups].sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime());
  const first = { segment: "RAPID" as const, group: sorted[0] };
  const last = { segment: "CEL_MAI_IEFTIN" as const, group: sorted[sorted.length - 1] };
  if (sorted.length === 2) return [first, last];
  return [first, { segment: "ECHILIBRAT", group: sorted[Math.floor(sorted.length / 2)] }, last];
}
