import { describe, expect, it } from "vitest";
import { commissionFor, parseRateToBasisPoints, splitPayout } from "./commission";

describe("commission", () => {
  it("parses decimal rates to basis points without floats", () => {
    expect(parseRateToBasisPoints("0.05")).toBe(500);
    expect(parseRateToBasisPoints("0.1")).toBe(1000);
    expect(parseRateToBasisPoints("0.0125")).toBe(125);
    expect(parseRateToBasisPoints("0")).toBe(0);
    expect(() => parseRateToBasisPoints("1")).toThrow();
    expect(() => parseRateToBasisPoints("0.05%")).toThrow();
    expect(() => parseRateToBasisPoints("0.00001")).toThrow();
  });

  it("matches the demo: 285 RON → 14.25 RON commission, 270.75 RON to the seller", () => {
    expect(splitPayout(28500, 500)).toEqual({ commission: 1425, sellerAmount: 27075 });
  });

  it("rounds half up to whole bani", () => {
    expect(commissionFor(30, 500)).toBe(2); // 1.5 → 2
    expect(commissionFor(29, 500)).toBe(1); // 1.45 → 1
    expect(commissionFor(10, 500)).toBe(1); // 0.5 → 1
    expect(commissionFor(9, 500)).toBe(0); // 0.45 → 0
  });

  it("commission + seller amount always equals the amount exactly", () => {
    for (let amount = 0; amount <= 5000; amount += 7) {
      for (const bps of [0, 1, 250, 500, 1234, 9999]) {
        const { commission, sellerAmount } = splitPayout(amount, bps);
        expect(commission + sellerAmount).toBe(amount);
        expect(Number.isInteger(commission)).toBe(true);
      }
    }
  });

  it("rejects floats and invalid rates", () => {
    expect(() => commissionFor(100.5, 500)).toThrow();
    expect(() => commissionFor(100, 10_000)).toThrow();
    expect(() => commissionFor(100, 2.5)).toThrow();
  });
});
