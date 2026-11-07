import { describe, expect, it } from "vitest";
import { DEMO_TIERS } from "../pricing/fixtures";
import { evaluateCancel } from "./cancel";
import { at, openGroup } from "./fixtures";
import { evaluateJoin, type JoinInput } from "./join";

const join = (overrides: Partial<JoinInput> = {}) =>
  evaluateJoin({
    group: openGroup(),
    tiers: DEMO_TIERS,
    perBuyerCap: 10,
    quantity: 3,
    stockRemaining: 200,
    buyerHasActiveCommitment: false,
    availableBalance: 50000,
    now: at(1),
    ...overrides,
  });

describe("evaluateJoin", () => {
  it("reserves quantity × the price shown before joining (demo: 3 × 100 RON)", () => {
    expect(join()).toEqual({ ok: true, committedUnitPrice: 10000, reservedAmount: 30000, newTotalQty: 3 });
  });

  it("commits at the current tier price when a tier is already unlocked", () => {
    expect(join({ group: openGroup({ totalQty: 60 }) })).toMatchObject({ committedUnitPrice: 9500, reservedAmount: 28500 });
  });

  it("commits at the price shown even if this join crosses a threshold", () => {
    expect(join({ group: openGroup({ totalQty: 48 }), quantity: 3 })).toMatchObject({ committedUnitPrice: 10000, newTotalQty: 51 });
  });

  it("rejects closed or non-open groups", () => {
    expect(join({ now: at(24) })).toEqual({ ok: false, reason: "GROUP_NOT_OPEN" });
    expect(join({ group: openGroup({ status: "SETTLING" }) })).toEqual({ ok: false, reason: "GROUP_NOT_OPEN" });
  });

  it("allows one active commitment per buyer per product", () => {
    expect(join({ buyerHasActiveCommitment: true })).toEqual({ ok: false, reason: "ALREADY_COMMITTED" });
  });

  it("enforces 1 ≤ quantity ≤ cap", () => {
    expect(join({ quantity: 0 })).toEqual({ ok: false, reason: "INVALID_QUANTITY" });
    expect(join({ quantity: 11 })).toEqual({ ok: false, reason: "INVALID_QUANTITY" });
    expect(join({ quantity: 2.5 })).toEqual({ ok: false, reason: "INVALID_QUANTITY" });
    expect(join({ quantity: 10, availableBalance: 100000 }).ok).toBe(true);
  });

  it("never oversells stock", () => {
    expect(join({ stockRemaining: 2 })).toEqual({ ok: false, reason: "INSUFFICIENT_STOCK" });
    expect(join({ stockRemaining: 3 }).ok).toBe(true);
  });

  it("requires enough available balance", () => {
    expect(join({ availableBalance: 29999 })).toEqual({ ok: false, reason: "INSUFFICIENT_BALANCE" });
    expect(join({ availableBalance: 30000 }).ok).toBe(true);
  });
});

describe("evaluateCancel", () => {
  const cancel = (totalQty: number, overrides: Partial<Parameters<typeof evaluateCancel>[0]> = {}) =>
    evaluateCancel({ commitmentStatus: "ACTIVE", group: openGroup({ totalQty }), tiers: DEMO_TIERS, now: at(1), ...overrides });

  it("is allowed until the first lower tier unlocks", () => {
    expect(cancel(49)).toEqual({ allowed: true });
    expect(cancel(50)).toEqual({ allowed: false, reason: "TIER_UNLOCKED" });
    expect(cancel(120)).toEqual({ allowed: false, reason: "TIER_UNLOCKED" });
  });

  it("is always allowed for a single-tier product while the group is open", () => {
    expect(cancel(1000, { tiers: [DEMO_TIERS[0]] })).toEqual({ allowed: true });
  });

  it("is not allowed once the group closes", () => {
    expect(cancel(10, { now: at(24) })).toEqual({ allowed: false, reason: "GROUP_NOT_OPEN" });
    expect(cancel(10, { group: openGroup({ status: "SETTLED", totalQty: 10 }) })).toEqual({ allowed: false, reason: "GROUP_NOT_OPEN" });
  });

  it("only applies to ACTIVE commitments", () => {
    expect(cancel(10, { commitmentStatus: "CANCELLED" })).toEqual({ allowed: false, reason: "NOT_ACTIVE" });
    expect(cancel(10, { commitmentStatus: "AWAITING_PICKUP" })).toEqual({ allowed: false, reason: "NOT_ACTIVE" });
  });
});
