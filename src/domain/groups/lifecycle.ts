import { assertInteger } from "../money";
import { HOUR_MS, type GroupState } from "./types";

/** closesAt = opensAt + duration (BL §3). */
export function groupWindow(opensAt: Date, durationHours: number): { opensAt: Date; closesAt: Date } {
  assertInteger(durationHours, "durationHours");
  if (durationHours < 1) throw new Error("durationHours must be ≥ 1");
  return { opensAt, closesAt: new Date(opensAt.getTime() + durationHours * HOUR_MS) };
}

/** BL §3: an open group accepts joins (and cancels) while now < closesAt, by the server clock. */
export function isAcceptingCommitments(group: GroupState, now: Date): boolean {
  return group.status === "OPEN" && now.getTime() < group.closesAt.getTime();
}

/** An open group whose closing time has passed and must be settled. */
export function isDueForSettlement(group: GroupState, now: Date): boolean {
  return group.status === "OPEN" && now.getTime() >= group.closesAt.getTime();
}

export interface RenewalInput {
  productActive: boolean;
  /** Is this group's duration still offered by the seller? */
  durationOffered: boolean;
  /** Stock remaining after the closing group's commitments (see stockRemaining). */
  stockRemaining: number;
}

/** BL §3 renewal: a new group with the same duration opens if all three conditions hold. */
export function shouldRenew({ productActive, durationOffered, stockRemaining }: RenewalInput): boolean {
  return productActive && durationOffered && stockRemaining > 0;
}

/** The window of the renewed group: it opens immediately (at settlement time). */
export function renewalWindow(durationHours: number, now: Date): { opensAt: Date; closesAt: Date } {
  return groupWindow(now, durationHours);
}
