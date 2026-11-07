import { describe, expect, it } from "vitest";
import { DEMO_TIERS } from "../pricing/fixtures";
import { groupOffer, segmentGroups, tierLadder } from "./offer";

const H = 60 * 60 * 1000;
const opensAt = new Date("2026-11-07T00:00:00Z");
const base = { tiers: DEMO_TIERS, opensAt, closesAt: new Date(opensAt.getTime() + 24 * H) };

describe("groupOffer", () => {
  it("shows the base price, no discount, and the first tier ahead for an empty group", () => {
    const o = groupOffer({ ...base, totalQty: 0, now: new Date(opensAt.getTime() + H), joinEvents: [] });
    expect(o).toMatchObject({ currentUnitPrice: 10000, baseUnitPrice: 10000, discountPct: 0, next: { minQty: 50, unitPrice: 9500, unitsMissing: 50 } });
    expect(o.forecast).toBe("UNLIKELY");
    expect(o.probableUnitPrice).toBe(10000); // not LIKELY → current price
  });

  it("uses the next tier price as the probable price only when the forecast is LIKELY", () => {
    const now = new Date(opensAt.getTime() + 2 * H);
    const o = groupOffer({ ...base, totalQty: 60, now, joinEvents: [{ quantity: 60, createdAt: now }] });
    expect(o).toMatchObject({ currentUnitPrice: 9500, discountPct: 5, forecast: "LIKELY", probableUnitPrice: 9000 });
  });

  it("has no next tier at the top tier", () => {
    const o = groupOffer({ ...base, totalQty: 120, now: opensAt, joinEvents: [] });
    expect(o).toMatchObject({ currentUnitPrice: 9000, discountPct: 10, next: null, forecast: null, probableUnitPrice: 9000 });
  });
});

describe("tierLadder", () => {
  it("marks passed, current and probable tiers with their ranges", () => {
    const ladder = tierLadder(DEMO_TIERS, { totalQty: 60, forecast: "LIKELY", next: { minQty: 100, unitPrice: 9000, unitsMissing: 40 } });
    expect(ladder).toEqual([
      { minQty: 1, maxQty: 49, unitPrice: 10000, state: "passed" },
      { minQty: 50, maxQty: 99, unitPrice: 9500, state: "current" },
      { minQty: 100, maxQty: null, unitPrice: 9000, state: "probable" },
    ]);
  });

  it("treats an empty group as the first tier and the rest as upcoming when not likely", () => {
    const ladder = tierLadder(DEMO_TIERS, { totalQty: 0, forecast: "POSSIBLE", next: { minQty: 50, unitPrice: 9500, unitsMissing: 50 } });
    expect(ladder.map((t) => t.state)).toEqual(["current", "upcoming", "upcoming"]);
  });
});

describe("segmentGroups", () => {
  const g = (id: string, h: number) => ({ id, closesAt: new Date(opensAt.getTime() + h * H) });

  it("hides the selector for a single group", () => {
    expect(segmentGroups([g("a", 24)])).toEqual([]);
  });

  it("maps two groups to Rapid and Cel mai ieftin by closing time", () => {
    expect(segmentGroups([g("week", 168), g("day", 24)]).map((s) => [s.segment, s.group.id])).toEqual([
      ["RAPID", "day"],
      ["CEL_MAI_IEFTIN", "week"],
    ]);
  });

  it("maps three groups to Rapid, Echilibrat and Cel mai ieftin", () => {
    expect(segmentGroups([g("c", 168), g("a", 24), g("b", 72)]).map((s) => s.segment + ":" + s.group.id)).toEqual([
      "RAPID:a",
      "ECHILIBRAT:b",
      "CEL_MAI_IEFTIN:c",
    ]);
  });
});
