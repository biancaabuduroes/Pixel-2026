import { describe, expect, it } from "vitest";
import { sellerDashboard } from "@/lib/seller-demo";

describe("seller dashboard demo numbers (derived with src/domain)", () => {
  const d = sellerDashboard();

  it("computes group prices and the next tier from the tier rules", () => {
    const bread24 = d.groups.find((g) => g.productId === "paine" && g.durationHours === 24)!;
    expect(bread24).toMatchObject({ totalQty: 34, currentPrice: 1800, unlocked: true, next: { minQty: 60, unitsMissing: 26, unitPrice: 1600 } });
    const coffee = d.groups.find((g) => g.productId === "cafea")!;
    expect(coffee).toMatchObject({ currentPrice: 7400, next: null }); // top tier reached
  });

  it("formats the time left", async () => {
    const { timeLeft } = await import("@/lib/seller-demo");
    expect(timeLeft(312)).toBe("5 h 12 min");
    expect(timeLeft(28 * 60)).toBe("1 z 4 h");
    expect(timeLeft(5 * 1440)).toBe("5 zile");
  });

  it("computes the statistics", () => {
    expect(d.stats).toEqual({ committedUnits: 143, activeGroups: 5, unlockedTiers: 3, popularDuration: "7 zile" });
  });

  it("splits earnings exactly into commission and seller amount", () => {
    expect(d.earnings.commission + d.earnings.net).toBe(d.earnings.sales);
    expect(d.earnings).toEqual({ sales: 46400, commission: 2320, net: 44080 });
  });

  it("marks the tier ladder states for each product's biggest group", () => {
    const bread = d.products.find((p) => p.id === "paine")!;
    expect(bread.rows.map((r) => r.state)).toEqual(["reached", "current", "next"]);
    expect(bread.stockLeft).toBe(200 - 34 - 18 - 3 - 5);
  });
});
