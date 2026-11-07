import { assertInteger } from "../money";
import type { CommitmentStatus } from "./types";

/** Commitments in these states don't use stock (decision 2026-11-07, OPEN_QUESTIONS.md). */
const STOCK_FREE: ReadonlySet<CommitmentStatus> = new Set(["CANCELLED", "REFUNDED"]);

/** Stock remaining = stockTotal − units of all the product's commitments that still use stock. */
export function stockRemaining(
  stockTotal: number,
  commitments: readonly { quantity: number; status: CommitmentStatus }[],
): number {
  assertInteger(stockTotal, "stockTotal");
  const used = commitments
    .filter((c) => !STOCK_FREE.has(c.status))
    .reduce((sum, c) => sum + c.quantity, 0);
  return stockTotal - used;
}
