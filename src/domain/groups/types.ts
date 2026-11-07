import type { Bani } from "../money";

export type GroupStatus = "OPEN" | "SETTLING" | "SETTLED" | "CANCELLED";

export type CommitmentStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "AWAITING_PICKUP"
  | "COLLECTED"
  | "EXPIRED_PAID"
  | "DISPUTED"
  | "REFUNDED";

/** The parts of a group the rules need. Timestamps are UTC. */
export interface GroupState {
  status: GroupStatus;
  durationHours: number;
  opensAt: Date;
  closesAt: Date;
  /** Sum of the quantities of the group's ACTIVE commitments. */
  totalQty: number;
}

export interface CommitmentState {
  id: string;
  status: CommitmentStatus;
  quantity: number;
  committedUnitPrice: Bani;
  reservedAmount: Bani;
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
