import { describe, expect, it } from "vitest";
import { DEMO_TIERS } from "./fixtures";
import { basePrice, firstDiscountThreshold, isFirstDiscountUnlocked, nextTier, savings, tierPrice } from "./tiers";

describe("tierPrice", () => {
  it("shows the base price for an empty group", () => {
    expect(tierPrice(DEMO_TIERS, 0)).toBe(10000);
  });

  it("uses the tier with the highest minQty ≤ qty", () => {
    expect(tierPrice(DEMO_TIERS, 1)).toBe(10000);
    expect(tierPrice(DEMO_TIERS, 49)).toBe(10000);
    expect(tierPrice(DEMO_TIERS, 50)).toBe(9500);
    expect(tierPrice(DEMO_TIERS, 99)).toBe(9500);
    expect(tierPrice(DEMO_TIERS, 100)).toBe(9000);
    expect(tierPrice(DEMO_TIERS, 10_000)).toBe(9000);
  });

  it("never increases as quantity grows", () => {
    let previous = tierPrice(DEMO_TIERS, 0);
    for (let qty = 1; qty <= 150; qty++) {
      const price = tierPrice(DEMO_TIERS, qty);
      expect(price).toBeLessThanOrEqual(previous);
      previous = price;
    }
  });

  it("works with a single tier", () => {
    expect(tierPrice([{ minQty: 1, unitPrice: 500 }], 1000)).toBe(500);
  });

  it("refuses unvalidated tiers and fractional quantities", () => {
    expect(() => tierPrice([], 1)).toThrow();
    expect(() => tierPrice([{ minQty: 2, unitPrice: 500 }], 1)).toThrow();
    expect(() => tierPrice(DEMO_TIERS, 1.5)).toThrow();
  });
});

describe("nextTier", () => {
  it("returns the exact units missing to the next tier", () => {
    expect(nextTier(DEMO_TIERS, 0)).toEqual({ tier: DEMO_TIERS[1], unitsMissing: 50 });
    expect(nextTier(DEMO_TIERS, 33)).toEqual({ tier: DEMO_TIERS[1], unitsMissing: 17 });
    expect(nextTier(DEMO_TIERS, 50)).toEqual({ tier: DEMO_TIERS[2], unitsMissing: 50 });
  });

  it("returns null at the top tier", () => {
    expect(nextTier(DEMO_TIERS, 100)).toBeNull();
  });
});

describe("first discount", () => {
  it("is the second tier's minQty", () => {
    expect(firstDiscountThreshold(DEMO_TIERS)).toBe(50);
    expect(firstDiscountThreshold([DEMO_TIERS[0]])).toBeNull();
  });

  it("is unlocked from that quantity", () => {
    expect(isFirstDiscountUnlocked(DEMO_TIERS, 49)).toBe(false);
    expect(isFirstDiscountUnlocked(DEMO_TIERS, 50)).toBe(true);
    expect(isFirstDiscountUnlocked([DEMO_TIERS[0]], 1000)).toBe(false);
  });
});

describe("savings", () => {
  it("is quantity × (base − final)", () => {
    expect(basePrice(DEMO_TIERS)).toBe(10000);
    expect(savings(DEMO_TIERS, 3, 9500)).toBe(1500); // demo: "You saved 15 RON"
    expect(savings(DEMO_TIERS, 3, 10000)).toBe(0);
  });
});
