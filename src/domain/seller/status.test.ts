import { describe, expect, it } from "vitest";
import { openGroup, at, T0 } from "../groups/fixtures";
import { isClosingSoon, sellerGroupStatus } from "./status";

const TIERS = [
  { minQty: 1, unitPrice: 10000 },
  { minQty: 20, unitPrice: 9000 },
  { minQty: 50, unitPrice: 8000 },
];

describe("sellerGroupStatus", () => {
  it("marks an empty open group as ACTIVE", () => {
    expect(sellerGroupStatus({ group: openGroup({ totalQty: 0 }), tiers: TIERS })).toBe("ACTIVE");
  });

  it("marks near-threshold progress as NEAR_TIER", () => {
    // 15 / 20 = 0.75
    expect(sellerGroupStatus({ group: openGroup({ totalQty: 15 }), tiers: TIERS })).toBe("NEAR_TIER");
  });

  it("marks unlocked first discount as TIER_UNLOCKED", () => {
    expect(sellerGroupStatus({ group: openGroup({ totalQty: 20 }), tiers: TIERS })).toBe("TIER_UNLOCKED");
    expect(sellerGroupStatus({ group: openGroup({ totalQty: 40 }), tiers: TIERS })).toBe("TIER_UNLOCKED");
  });

  it("marks the top tier as BEST_PRICE", () => {
    expect(sellerGroupStatus({ group: openGroup({ totalQty: 50 }), tiers: TIERS })).toBe("BEST_PRICE");
  });

  it("classifies settled groups", () => {
    const settled = openGroup({ status: "SETTLED", totalQty: 30 });
    expect(sellerGroupStatus({ group: settled, tiers: TIERS, finalUnitPrice: 9000 })).toBe("WON");
    expect(sellerGroupStatus({ group: settled, tiers: TIERS, finalUnitPrice: 10000 })).toBe("CLOSED_BASE_PRICE");
    expect(sellerGroupStatus({ group: openGroup({ status: "SETTLED", totalQty: 0 }), tiers: TIERS })).toBe("NO_PARTICIPANTS");
  });
});

describe("isClosingSoon", () => {
  it("is true within 6 hours of closing", () => {
    const closes = at(24);
    expect(isClosingSoon(closes, new Date(closes.getTime() - 5 * 60 * 60 * 1000))).toBe(true);
    expect(isClosingSoon(closes, new Date(closes.getTime() - 7 * 60 * 60 * 1000))).toBe(false);
    expect(isClosingSoon(closes, new Date(closes.getTime() + 1000))).toBe(false);
  });

  it("uses T0 fixture without throwing", () => {
    expect(isClosingSoon(at(3), T0)).toBe(true);
  });
});
