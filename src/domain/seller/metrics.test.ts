import { describe, expect, it } from "vitest";
import {
  dailySeries,
  groupFinancials,
  percentChange,
  periodWindow,
  potentialSales,
  productSales,
  sumSold,
} from "./metrics";

const T0 = new Date("2026-11-07T12:00:00Z");
const day = (offset: number) => new Date(T0.getTime() + offset * 86_400_000);

const sold = [
  { quantity: 2, amountCharged: 20000, status: "COLLECTED" as const, settledAt: day(-1), productId: "a" },
  { quantity: 3, amountCharged: 27000, status: "AWAITING_PICKUP" as const, settledAt: day(-2), productId: "a" },
  { quantity: 1, amountCharged: 10000, status: "COLLECTED" as const, settledAt: day(-10), productId: "b" },
  { quantity: 5, amountCharged: 0, status: "CANCELLED" as const, settledAt: day(-1), productId: "a" },
];

describe("percentChange", () => {
  it("returns whole percents", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe("periodWindow", () => {
  it("builds current and previous windows", () => {
    const w = periodWindow(T0, 7);
    expect(w.end).toEqual(T0);
    expect(w.start.getTime()).toBe(T0.getTime() - 7 * 86_400_000);
    expect(w.previousStart.getTime()).toBe(T0.getTime() - 14 * 86_400_000);
  });
});

describe("sumSold / productSales / dailySeries", () => {
  it("sums only sold commitments in the window", () => {
    const totals = sumSold(sold, day(-7), T0);
    expect(totals).toEqual({ revenue: 47000, units: 5, orderCount: 2 });
  });

  it("groups by product", () => {
    const map = productSales(sold, day(-30), T0);
    expect(map.get("a")).toEqual({ revenue: 47000, units: 5, orderCount: 2 });
    expect(map.get("b")).toEqual({ revenue: 10000, units: 1, orderCount: 1 });
  });

  it("builds a daily series", () => {
    const series = dailySeries(sold, day(-3), T0);
    expect(series).toHaveLength(3);
    expect(series.find((d) => d.day === day(-1).toISOString().slice(0, 10))?.revenue).toBe(20000);
  });
});

describe("potentialSales", () => {
  it("estimates remaining units × open price", () => {
    const result = potentialSales({
      products: [
        {
          productId: "a",
          stockRemaining: 10,
          committedUnits: 5,
          openUnitPrice: 9000,
          tiers: [{ minQty: 1, unitPrice: 10000 }],
        },
        {
          productId: "b",
          stockRemaining: 4,
          committedUnits: 0,
          openUnitPrice: null,
          tiers: [{ minQty: 1, unitPrice: 5000 }],
        },
      ],
    });
    expect(result).toEqual({ units: 14, revenueEstimate: 10 * 9000 + 4 * 5000, committedUnits: 5 });
  });
});

describe("groupFinancials", () => {
  it("splits revenue with 5% commission", () => {
    const f = groupFinancials({
      tiers: [
        { minQty: 1, unitPrice: 10000 },
        { minQty: 20, unitPrice: 9000 },
      ],
      commitments: [
        { quantity: 2, amountCharged: 18000, status: "COLLECTED" },
        { quantity: 1, amountCharged: 9000, status: "AWAITING_PICKUP" },
      ],
      finalUnitPrice: 9000,
      commissionRateBps: 500,
    });
    expect(f.unitsSold).toBe(3);
    expect(f.buyers).toBe(2);
    expect(f.revenue).toBe(27000);
    expect(f.buyerSavings).toBe(3 * 1000);
    expect(f.commission).toBe(1350);
    expect(f.net).toBe(25650);
  });
});
