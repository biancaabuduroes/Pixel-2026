import { multiplyBani, type Bani } from "../money";
import { tierPrice, type PriceTier } from "../pricing";
import { pickupDeadline } from "./commitment";
import type { CommitmentState, GroupState } from "./types";

/** Thrown when a money invariant is violated. Settlement must stop; nothing is written. */
export class SettlementInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementInvariantError";
  }
}

export interface SettledCommitment {
  commitmentId: string;
  finalUnitPrice: Bani;
  /** quantity × finalUnitPrice → moved from reserved to pending pickup. */
  amountCharged: Bani;
  /** reservedAmount − amountCharged → moved from reserved back to available. */
  releasedAmount: Bani;
  pickupDeadline: Date;
}

export type SettlementPlan =
  | { alreadySettled: true }
  | { alreadySettled: false; finalUnitPrice: Bani; commitments: SettledCommitment[] };

/**
 * BL §7: computes what settling a group does, without side effects. The server runs it
 * inside one transaction after locking the group row, then posts a SETTLE ledger
 * transaction per commitment, generates pickup codes and applies the renewal rules.
 *
 * Idempotent: a SETTLED group returns { alreadySettled: true }.
 * Asserts finalUnitPrice ≤ committedUnitPrice for every commitment.
 */
export function planSettlement(input: {
  group: GroupState;
  tiers: readonly PriceTier[];
  commitments: readonly CommitmentState[];
  pickupDeadlineDays: number;
  now: Date;
}): SettlementPlan {
  const { group, tiers, now } = input;

  if (group.status === "SETTLED") return { alreadySettled: true };
  if (group.status === "CANCELLED") throw new SettlementInvariantError("A cancelled group cannot be settled");
  if (now.getTime() < group.closesAt.getTime()) {
    throw new SettlementInvariantError("The group has not reached its closing time");
  }

  const active = input.commitments.filter((c) => c.status === "ACTIVE");

  // DATA_MODEL integrity rule 5: totalQty must match the commitments.
  const activeQty = active.reduce((sum, c) => sum + c.quantity, 0);
  if (activeQty !== group.totalQty) {
    throw new SettlementInvariantError(`Group totalQty ${group.totalQty} ≠ sum of active commitments ${activeQty}`);
  }

  const finalUnitPrice = tierPrice(tiers, group.totalQty);
  const deadline = pickupDeadline(group.closesAt, input.pickupDeadlineDays);

  const commitments = active.map((c): SettledCommitment => {
    if (c.reservedAmount !== multiplyBani(c.quantity, c.committedUnitPrice)) {
      throw new SettlementInvariantError(`Commitment ${c.id}: reservedAmount ≠ quantity × committedUnitPrice`);
    }
    if (finalUnitPrice > c.committedUnitPrice) {
      throw new SettlementInvariantError(
        `Commitment ${c.id}: finalUnitPrice ${finalUnitPrice} > committedUnitPrice ${c.committedUnitPrice}`,
      );
    }
    const amountCharged = multiplyBani(c.quantity, finalUnitPrice);
    return {
      commitmentId: c.id,
      finalUnitPrice,
      amountCharged,
      releasedAmount: c.reservedAmount - amountCharged,
      pickupDeadline: deadline,
    };
  });

  return { alreadySettled: false, finalUnitPrice, commitments };
}
