import { assertInteger } from "../money";

/** Stock health for seller KPI cards (assumptions in OPEN_QUESTIONS.md). */
export type StockStatus = "OPTIMAL" | "LOW" | "CRITICAL";

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  OPTIMAL: "Stoc optim",
  LOW: "Stoc redus",
  CRITICAL: "Stoc critic",
};

/** remaining/total: CRITICAL < 10%, LOW < 25%, else OPTIMAL. Empty total → CRITICAL. */
export function stockStatus(remaining: number, stockTotal: number): StockStatus {
  assertInteger(remaining, "remaining");
  assertInteger(stockTotal, "stockTotal");
  if (stockTotal <= 0) return "CRITICAL";
  const ratio = remaining / stockTotal;
  if (ratio < 0.1) return "CRITICAL";
  if (ratio < 0.25) return "LOW";
  return "OPTIMAL";
}

/** Whole-percent utilization: units used ÷ stockTotal, clamped 0–100. */
export function stockUtilizationPct(remaining: number, stockTotal: number): number {
  assertInteger(remaining, "remaining");
  assertInteger(stockTotal, "stockTotal");
  if (stockTotal <= 0) return 100;
  const used = stockTotal - remaining;
  return Math.max(0, Math.min(100, Math.round((used * 100) / stockTotal)));
}
