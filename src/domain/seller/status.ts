import { isFirstDiscountUnlocked, nextTier, type PriceTier } from "../pricing";
import { HOUR_MS, type GroupState } from "../groups/types";
import type { Bani } from "../money";

/**
 * Display status for a seller group card (OPEN_QUESTIONS.md, 2026-11-07).
 * Derived only from group state + tiers — never from AI.
 */
export type SellerGroupStatus =
  | "ACTIVE"
  | "TIER_UNLOCKED"
  | "NEAR_TIER"
  | "BEST_PRICE"
  | "WON"
  | "CLOSED_BASE_PRICE"
  | "NO_PARTICIPANTS";

/** Progress towards the next tier at or above this ratio → NEAR_TIER (assumption). */
export const NEAR_TIER_RATIO = 0.75;

/** Open groups with less than this time left get a "closing soon" flag (assumption). */
export const CLOSING_SOON_MS = 6 * HOUR_MS;

export const SELLER_GROUP_STATUS_LABEL: Record<SellerGroupStatus, string> = {
  ACTIVE: "Activ",
  TIER_UNLOCKED: "Prag deblocat",
  NEAR_TIER: "Aproape de prag",
  BEST_PRICE: "Cel mai bun preț",
  WON: "Câștigat",
  CLOSED_BASE_PRICE: "Închis la preț de bază",
  NO_PARTICIPANTS: "Fără participanți",
};

export function sellerGroupStatus(input: {
  group: GroupState;
  tiers: readonly PriceTier[];
  /** Final unit price at settlement (required when status is SETTLED). */
  finalUnitPrice?: Bani | null;
}): SellerGroupStatus {
  const { group, tiers } = input;

  if (group.status === "SETTLED" || group.status === "SETTLING") {
    if (group.totalQty === 0) return "NO_PARTICIPANTS";
    const final = input.finalUnitPrice ?? null;
    if (final !== null && final < tiers[0]!.unitPrice) return "WON";
    return "CLOSED_BASE_PRICE";
  }

  if (group.status === "CANCELLED") return "NO_PARTICIPANTS";

  // OPEN
  const next = nextTier(tiers, group.totalQty);
  if (!next) return "BEST_PRICE";
  if (isFirstDiscountUnlocked(tiers, group.totalQty)) return "TIER_UNLOCKED";
  const progress = group.totalQty / next.tier.minQty;
  if (progress >= NEAR_TIER_RATIO) return "NEAR_TIER";
  return "ACTIVE";
}

export function isClosingSoon(closesAt: Date, now: Date): boolean {
  const left = closesAt.getTime() - now.getTime();
  return left > 0 && left <= CLOSING_SOON_MS;
}
