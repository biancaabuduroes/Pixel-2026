import { describe, expect, it } from "vitest";
import { at, openGroup, T0 } from "./fixtures";
import { groupWindow, isAcceptingCommitments, isDueForSettlement, renewalWindow, shouldRenew } from "./lifecycle";
import { stockRemaining } from "./stock";

describe("group window", () => {
  it("closes duration hours after it opens", () => {
    expect(groupWindow(T0, 168).closesAt).toEqual(at(168));
    expect(() => groupWindow(T0, 0)).toThrow();
  });
});

describe("open → settling", () => {
  it("accepts commitments only while OPEN and before closesAt", () => {
    const group = openGroup();
    expect(isAcceptingCommitments(group, at(23.99))).toBe(true);
    expect(isAcceptingCommitments(group, at(24))).toBe(false);
    expect(isAcceptingCommitments({ ...group, status: "SETTLING" }, at(1))).toBe(false);
    expect(isAcceptingCommitments({ ...group, status: "CANCELLED" }, at(1))).toBe(false);
  });

  it("is due for settlement from closesAt", () => {
    const group = openGroup();
    expect(isDueForSettlement(group, at(23))).toBe(false);
    expect(isDueForSettlement(group, at(24))).toBe(true);
    expect(isDueForSettlement({ ...group, status: "SETTLED" }, at(30))).toBe(false);
  });
});

describe("renewal", () => {
  const ok = { productActive: true, durationOffered: true, stockRemaining: 5 };

  it("renews when the product is active, the duration offered and stock remains", () => {
    expect(shouldRenew(ok)).toBe(true);
  });

  it("stops when any condition fails", () => {
    expect(shouldRenew({ ...ok, productActive: false })).toBe(false);
    expect(shouldRenew({ ...ok, durationOffered: false })).toBe(false);
    expect(shouldRenew({ ...ok, stockRemaining: 0 })).toBe(false);
  });

  it("opens the next group immediately with the same duration", () => {
    expect(renewalWindow(24, at(24.5))).toEqual({ opensAt: at(24.5), closesAt: at(48.5) });
  });
});

describe("stockRemaining", () => {
  it("counts every commitment except CANCELLED and REFUNDED", () => {
    const commitments = [
      { quantity: 3, status: "ACTIVE" as const },
      { quantity: 2, status: "AWAITING_PICKUP" as const },
      { quantity: 1, status: "COLLECTED" as const },
      { quantity: 4, status: "CANCELLED" as const },
      { quantity: 5, status: "REFUNDED" as const },
    ];
    expect(stockRemaining(20, commitments)).toBe(14);
  });
});
