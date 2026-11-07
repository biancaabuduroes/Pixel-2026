import { DAY_MS, type CommitmentStatus } from "./types";

/** BL §10 commitment lifecycle. */
const TRANSITIONS: Record<CommitmentStatus, readonly CommitmentStatus[]> = {
  ACTIVE: ["CANCELLED", "AWAITING_PICKUP"],
  AWAITING_PICKUP: ["COLLECTED", "EXPIRED_PAID", "DISPUTED"],
  DISPUTED: ["COLLECTED", "REFUNDED"],
  CANCELLED: [],
  COLLECTED: [],
  EXPIRED_PAID: [],
  REFUNDED: [],
};

export function canTransition(from: CommitmentStatus, to: CommitmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: CommitmentStatus, to: CommitmentStatus): void {
  if (!canTransition(from, to)) throw new Error(`Commitment cannot go from ${from} to ${to}`);
}

/** Pickup deadline in calendar days after the group closes (decision 2026-11-07). */
export function pickupDeadline(closesAt: Date, pickupDeadlineDays: number): Date {
  if (!Number.isSafeInteger(pickupDeadlineDays) || pickupDeadlineDays < 1) {
    throw new Error("pickupDeadlineDays must be a whole number ≥ 1");
  }
  return new Date(closesAt.getTime() + pickupDeadlineDays * DAY_MS);
}

/** BL §8 no-show: after the deadline the order is closed as EXPIRED_PAID. */
export function isPickupExpired(status: CommitmentStatus, deadline: Date, now: Date): boolean {
  return status === "AWAITING_PICKUP" && now.getTime() > deadline.getTime();
}

/** BL §8: 5 wrong pickup codes lock entry for 15 minutes (assumption in OPEN_QUESTIONS.md). */
export const MAX_PICKUP_ATTEMPTS = 5;
export const PICKUP_LOCK_MS = 15 * 60 * 1000;

export function isPickupLocked(codeLockedUntil: Date | null, now: Date): boolean {
  return codeLockedUntil !== null && now.getTime() < codeLockedUntil.getTime();
}

/** State after a wrong code. The 5th failure locks entry and starts a fresh count for after the lock. */
export function afterWrongPickupCode(failedCodeAttempts: number, now: Date): { failedCodeAttempts: number; codeLockedUntil: Date | null } {
  const attempts = failedCodeAttempts + 1;
  return attempts >= MAX_PICKUP_ATTEMPTS
    ? { failedCodeAttempts: 0, codeLockedUntil: new Date(now.getTime() + PICKUP_LOCK_MS) }
    : { failedCodeAttempts: attempts, codeLockedUntil: null };
}
