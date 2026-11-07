import { isFirstDiscountUnlocked, type PriceTier } from "../pricing";
import { isAcceptingCommitments } from "./lifecycle";
import type { CommitmentStatus, GroupState } from "./types";

export type CancelRejection = "NOT_ACTIVE" | "GROUP_NOT_OPEN" | "TIER_UNLOCKED";

export type CancelDecision = { allowed: true } | { allowed: false; reason: CancelRejection };

/**
 * BL §5: cancel only an ACTIVE commitment, while the group is open, and only until the
 * group unlocks its first lower tier. After that nobody can leave, so the group's
 * quantity — and its price — can never go back up.
 */
export function evaluateCancel(input: {
  commitmentStatus: CommitmentStatus;
  group: GroupState;
  tiers: readonly PriceTier[];
  now: Date;
}): CancelDecision {
  if (input.commitmentStatus !== "ACTIVE") return { allowed: false, reason: "NOT_ACTIVE" };
  if (!isAcceptingCommitments(input.group, input.now)) return { allowed: false, reason: "GROUP_NOT_OPEN" };
  if (isFirstDiscountUnlocked(input.tiers, input.group.totalQty)) return { allowed: false, reason: "TIER_UNLOCKED" };
  return { allowed: true };
}
