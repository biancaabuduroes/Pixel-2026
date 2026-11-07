import { formatRon } from "../money";
import type { TierForecast } from "./forecast";

const LABEL_TEXT = { LIKELY: "Likely", POSSIBLE: "Possible", UNLIKELY: "Unlikely" } as const;

/**
 * Template insight text (hackathon MVP), built only from computed numbers.
 * Example: "83 buyers joined. 17 more units unlock 95 RON. Likely before this group closes (estimate)."
 */
export function groupInsightText(input: { buyerCount: number; forecast: TierForecast | null }): string {
  const buyers = `${input.buyerCount} ${input.buyerCount === 1 ? "buyer" : "buyers"} joined.`;
  if (!input.forecast) return `${buyers} The best price is already unlocked.`;
  const { unitsMissing, nextTier, label } = input.forecast;
  const units = `${unitsMissing} more ${unitsMissing === 1 ? "unit unlocks" : "units unlock"} ${formatRon(nextTier.unitPrice)}.`;
  return `${buyers} ${units} ${LABEL_TEXT[label]} before this group closes (estimate).`;
}
