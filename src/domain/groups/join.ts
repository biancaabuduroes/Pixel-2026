import { multiplyBani, type Bani } from "../money";
import { tierPrice, type PriceTier } from "../pricing";
import { isAcceptingCommitments } from "./lifecycle";
import type { GroupState } from "./types";

export interface JoinInput {
  group: GroupState;
  tiers: readonly PriceTier[];
  perBuyerCap: number;
  quantity: number;
  /** Product stock remaining across all groups (stockRemaining). */
  stockRemaining: number;
  /** Does the buyer already hold an ACTIVE commitment for this product? */
  buyerHasActiveCommitment: boolean;
  /** The buyer's available wallet balance, calculated from the ledger. */
  availableBalance: Bani;
  now: Date;
}

export type JoinRejection =
  | "GROUP_NOT_OPEN"
  | "ALREADY_COMMITTED"
  | "INVALID_QUANTITY"
  | "INSUFFICIENT_STOCK"
  | "INSUFFICIENT_BALANCE";

export type JoinDecision =
  | {
      ok: true;
      /** The price shown before joining, stored on the commitment. */
      committedUnitPrice: Bani;
      /** quantity × committedUnitPrice — moved from available to reserved. */
      reservedAmount: Bani;
      newTotalQty: number;
    }
  | { ok: false; reason: JoinRejection };

/**
 * BL §4 checks, in order. The server runs this inside the join transaction,
 * after locking the group row, and writes nothing if it returns ok: false.
 */
export function evaluateJoin(input: JoinInput): JoinDecision {
  const { group, tiers, perBuyerCap, quantity, now } = input;

  if (!isAcceptingCommitments(group, now)) return { ok: false, reason: "GROUP_NOT_OPEN" };
  if (input.buyerHasActiveCommitment) return { ok: false, reason: "ALREADY_COMMITTED" };
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > perBuyerCap) {
    return { ok: false, reason: "INVALID_QUANTITY" };
  }
  if (quantity > input.stockRemaining) return { ok: false, reason: "INSUFFICIENT_STOCK" };

  // Price shown *before* joining, even if this join crosses a threshold (BL §4 step 5).
  const committedUnitPrice = tierPrice(tiers, group.totalQty);
  const reservedAmount = multiplyBani(quantity, committedUnitPrice);
  if (input.availableBalance < reservedAmount) return { ok: false, reason: "INSUFFICIENT_BALANCE" };

  return { ok: true, committedUnitPrice, reservedAmount, newTotalQty: group.totalQty + quantity };
}
