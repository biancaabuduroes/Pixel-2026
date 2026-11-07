import { describe, expect, it } from "vitest";
import { DEMO_CONFIG } from "./fixtures";
import { validatePricingConfig, type PricingConfig } from "./validation";

const codes = (config: PricingConfig) => validatePricingConfig(config).map((v) => v.code);
const withTiers = (tiers: PricingConfig["tiers"], extra: Partial<PricingConfig> = {}) => ({
  ...DEMO_CONFIG,
  tiers,
  ...extra,
});

describe("validatePricingConfig", () => {
  it("accepts the demo configuration", () => {
    expect(validatePricingConfig(DEMO_CONFIG)).toEqual([]);
  });

  it("accepts a single-tier product", () => {
    expect(codes(withTiers([{ minQty: 1, unitPrice: 1000 }]))).toEqual([]);
  });

  it("rule 1: needs at least one tier starting at 1", () => {
    expect(codes(withTiers([]))).toContain("NO_TIERS");
    expect(codes(withTiers([{ minQty: 2, unitPrice: 1000 }], { perBuyerCap: 1 }))).toContain("FIRST_TIER_NOT_ONE");
  });

  it("rule 2: minQty must strictly increase (no duplicates or overlaps)", () => {
    const duplicate = withTiers([
      { minQty: 1, unitPrice: 1000 },
      { minQty: 50, unitPrice: 900 },
      { minQty: 50, unitPrice: 800 },
    ]);
    expect(codes(duplicate)).toContain("MIN_QTY_NOT_INCREASING");
    const unordered = withTiers([
      { minQty: 1, unitPrice: 1000 },
      { minQty: 100, unitPrice: 900 },
      { minQty: 50, unitPrice: 800 },
    ]);
    expect(codes(unordered)).toContain("MIN_QTY_NOT_INCREASING");
  });

  it("rule 3: prices must strictly decrease and be whole bani > 0", () => {
    expect(codes(withTiers([{ minQty: 1, unitPrice: 1000 }, { minQty: 50, unitPrice: 1000 }]))).toContain("PRICE_NOT_DECREASING");
    expect(codes(withTiers([{ minQty: 1, unitPrice: 1000 }, { minQty: 50, unitPrice: 1100 }]))).toContain("PRICE_NOT_DECREASING");
    expect(codes(withTiers([{ minQty: 1, unitPrice: 0 }]))).toContain("INVALID_PRICE");
    expect(codes(withTiers([{ minQty: 1, unitPrice: 99.99 }]))).toContain("INVALID_PRICE");
    expect(codes(withTiers([{ minQty: 1.5, unitPrice: 100 }]))).toContain("INVALID_MIN_QTY");
  });

  it("rule 4: the cap must be ≥ 1 and below the first discount threshold", () => {
    expect(codes({ ...DEMO_CONFIG, perBuyerCap: 0 })).toContain("INVALID_CAP");
    expect(codes({ ...DEMO_CONFIG, perBuyerCap: 50 })).toContain("CAP_NOT_BELOW_FIRST_DISCOUNT");
    expect(codes({ ...DEMO_CONFIG, perBuyerCap: 49 })).toEqual([]);
  });

  it("rule 5: the highest threshold must fit in stock", () => {
    expect(codes({ ...DEMO_CONFIG, stockTotal: 99 })).toContain("TOP_TIER_ABOVE_STOCK");
    expect(codes({ ...DEMO_CONFIG, stockTotal: 100 })).toEqual([]);
    expect(codes({ ...DEMO_CONFIG, stockTotal: -1 })).toContain("INVALID_STOCK");
  });

  it("rule 6: at least one valid, unique duration", () => {
    expect(codes({ ...DEMO_CONFIG, durationsHours: [] })).toContain("NO_DURATIONS");
    expect(codes({ ...DEMO_CONFIG, durationsHours: [24, 24] })).toContain("DUPLICATE_DURATION");
    expect(codes({ ...DEMO_CONFIG, durationsHours: [0] })).toContain("INVALID_DURATION");
  });

  it("requires a whole-day pickup deadline", () => {
    expect(codes({ ...DEMO_CONFIG, pickupDeadlineDays: 0 })).toContain("INVALID_PICKUP_DEADLINE");
  });

  it("reports every violation at once, with the tier index", () => {
    const result = validatePricingConfig({
      ...DEMO_CONFIG,
      perBuyerCap: 60,
      durationsHours: [],
      tiers: [
        { minQty: 1, unitPrice: 1000 },
        { minQty: 50, unitPrice: 1200 },
      ],
    });
    expect(result.map((v) => v.code).sort()).toEqual(["CAP_NOT_BELOW_FIRST_DISCOUNT", "NO_DURATIONS", "PRICE_NOT_DECREASING"]);
    expect(result.find((v) => v.code === "PRICE_NOT_DECREASING")?.index).toBe(1);
  });
});
