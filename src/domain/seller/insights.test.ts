import { describe, expect, it } from "vitest";
import { groupInsight, sellerInsights } from "./insights";

describe("sellerInsights", () => {
  it("returns a insufficient-data insight when history is thin", () => {
    const insights = sellerInsights({
      periodDays: 30,
      settledGroupCount: 1,
      topProduct: null,
      risingCategory: null,
      potentialUnits: 0,
      potentialRevenue: 0,
      criticalStock: [],
      nearTierGroups: [],
      wonPools: 0,
      activePools: 0,
    });
    expect(insights).toHaveLength(1);
    expect(insights[0]!.text).toMatch(/Date insuficiente/);
  });

  it("builds performance and opportunity insights from numbers", () => {
    const insights = sellerInsights({
      periodDays: 30,
      settledGroupCount: 5,
      topProduct: { name: "Miere", revenueSharePct: 32 },
      risingCategory: { name: "Alimente", changePct: 18 },
      potentialUnits: 120,
      potentialRevenue: 480000,
      criticalStock: [{ name: "Ulei", remaining: 4 }],
      nearTierGroups: [{ productName: "Miere", unitsMissing: 3 }],
      wonPools: 3,
      activePools: 4,
    });
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.some((i) => i.category === "PERFORMANCE")).toBe(true);
    expect(insights.some((i) => i.category === "OPPORTUNITY")).toBe(true);
    expect(insights.some((i) => i.category === "WARNING")).toBe(true);
  });
});

describe("groupInsight", () => {
  it("summarises a settled pool", () => {
    const insights = groupInsight({
      productName: "Miere",
      buyers: 8,
      unitsSold: 17,
      revenue: 67983,
      unlockedDiscount: true,
      nextUnitsMissing: null,
    });
    expect(insights[0]!.text).toContain("679,83 RON");
    expect(insights.some((i) => /prag/i.test(i.text))).toBe(true);
  });
});
