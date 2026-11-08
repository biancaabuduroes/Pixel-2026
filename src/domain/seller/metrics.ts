import { assertInteger, type Bani } from "../money";
import { basePrice, savings, tierPrice, type PriceTier } from "../pricing";
import { splitPayout, type BasisPoints } from "../wallet/commission";
import type { CommitmentStatus } from "../groups/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Commitment statuses that count as sold (money charged or pending charge). */
const SOLD: ReadonlySet<CommitmentStatus> = new Set(["AWAITING_PICKUP", "COLLECTED", "EXPIRED_PAID"]);

export interface SoldCommitment {
  quantity: number;
  amountCharged: Bani;
  status: CommitmentStatus;
  /** When the group settled / the order was charged (UTC). */
  settledAt: Date;
  productId: string;
}

export interface PeriodTotals {
  revenue: Bani;
  units: number;
  orderCount: number;
}

/** Integer percent change: ((current − previous) / previous) × 100. null when previous is 0. */
export function percentChange(current: number, previous: number): number | null {
  assertInteger(current, "current");
  assertInteger(previous, "previous");
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) * 100) / previous);
}

export function periodWindow(now: Date, periodDays: number): { start: Date; end: Date; previousStart: Date } {
  assertInteger(periodDays, "periodDays");
  if (periodDays < 1) throw new Error("periodDays must be ≥ 1");
  const end = now;
  const start = new Date(now.getTime() - periodDays * DAY_MS);
  const previousStart = new Date(start.getTime() - periodDays * DAY_MS);
  return { start, end, previousStart };
}

export function sumSold(commitments: readonly SoldCommitment[], from: Date, to: Date): PeriodTotals {
  let revenue = 0;
  let units = 0;
  let orderCount = 0;
  for (const c of commitments) {
    if (!SOLD.has(c.status)) continue;
    const t = c.settledAt.getTime();
    if (t < from.getTime() || t >= to.getTime()) continue;
    revenue += c.amountCharged;
    units += c.quantity;
    orderCount += 1;
  }
  return { revenue, units, orderCount };
}

/** One point per calendar day (UTC), inclusive of `from`, exclusive of `to`. */
export function dailySeries(
  commitments: readonly SoldCommitment[],
  from: Date,
  to: Date,
): { day: string; revenue: Bani; units: number; orders: number }[] {
  const days: { day: string; revenue: Bani; units: number; orders: number }[] = [];
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  for (let t = start; t < end; t += DAY_MS) {
    days.push({ day: new Date(t).toISOString().slice(0, 10), revenue: 0, units: 0, orders: 0 });
  }
  const index = new Map(days.map((d, i) => [d.day, i]));
  for (const c of commitments) {
    if (!SOLD.has(c.status)) continue;
    const key = c.settledAt.toISOString().slice(0, 10);
    const i = index.get(key);
    if (i === undefined) continue;
    days[i]!.revenue += c.amountCharged;
    days[i]!.units += c.quantity;
    days[i]!.orders += 1;
  }
  return days;
}

export function productSales(
  commitments: readonly SoldCommitment[],
  from: Date,
  to: Date,
): Map<string, PeriodTotals> {
  const map = new Map<string, PeriodTotals>();
  for (const c of commitments) {
    if (!SOLD.has(c.status)) continue;
    const t = c.settledAt.getTime();
    if (t < from.getTime() || t >= to.getTime()) continue;
    const prev = map.get(c.productId) ?? { revenue: 0, units: 0, orderCount: 0 };
    map.set(c.productId, {
      revenue: prev.revenue + c.amountCharged,
      units: prev.units + c.quantity,
      orderCount: prev.orderCount + 1,
    });
  }
  return map;
}

/**
 * Potential remaining units across products (stock left) and a revenue estimate at each
 * product's cheapest open-group price (or base price if no open group). Labelled as estimate.
 */
export function potentialSales(input: {
  products: readonly {
    productId: string;
    stockRemaining: number;
    tiers: readonly PriceTier[];
    /** Current unit price of the seller's best open group for this product, if any. */
    openUnitPrice: Bani | null;
    committedUnits: number;
  }[];
}): { units: number; revenueEstimate: Bani; committedUnits: number } {
  let units = 0;
  let revenueEstimate = 0;
  let committedUnits = 0;
  for (const p of input.products) {
    assertInteger(p.stockRemaining, "stockRemaining");
    assertInteger(p.committedUnits, "committedUnits");
    const left = Math.max(0, p.stockRemaining);
    units += left;
    committedUnits += p.committedUnits;
    const unit = p.openUnitPrice ?? tierPrice(p.tiers, 1);
    revenueEstimate += left * unit;
  }
  return { units, revenueEstimate, committedUnits };
}

/** Seller payout split for collected/expired amounts. */
export function earningsFromCharged(amountCharged: Bani, commissionRateBps: BasisPoints) {
  return splitPayout(amountCharged, commissionRateBps);
}

/** Buyer savings on a settled commitment vs the product's base price. */
export function buyerSavings(tiers: readonly PriceTier[], quantity: number, finalUnitPrice: Bani): Bani {
  return savings(tiers, quantity, finalUnitPrice);
}

export function groupFinancials(input: {
  tiers: readonly PriceTier[];
  commitments: readonly { quantity: number; amountCharged: Bani | null; status: CommitmentStatus }[];
  finalUnitPrice: Bani | null;
  commissionRateBps: BasisPoints;
}): {
  unitsSold: number;
  buyers: number;
  revenue: Bani;
  initialUnitPrice: Bani;
  finalUnitPrice: Bani | null;
  buyerSavings: Bani;
  commission: Bani;
  net: Bani;
} {
  const sold = input.commitments.filter((c) => SOLD.has(c.status));
  const unitsSold = sold.reduce((s, c) => s + c.quantity, 0);
  const revenue = sold.reduce((s, c) => s + (c.amountCharged ?? 0), 0);
  const initialUnitPrice = basePrice(input.tiers);
  const final = input.finalUnitPrice;
  const buyerSave =
    final === null ? 0 : sold.reduce((s, c) => s + savings(input.tiers, c.quantity, final), 0);
  const { commission, sellerAmount } = splitPayout(revenue, input.commissionRateBps);
  return {
    unitsSold,
    buyers: sold.length,
    revenue,
    initialUnitPrice,
    finalUnitPrice: final,
    buyerSavings: buyerSave,
    commission,
    net: sellerAmount,
  };
}

export { SOLD as SOLD_COMMITMENT_STATUSES };
