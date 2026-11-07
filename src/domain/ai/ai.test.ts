import { describe, expect, it } from "vitest";
import { at, openGroup, T0 } from "../groups/fixtures";
import { planSettlement } from "../groups/settlement";
import { tierPrice } from "../pricing";
import { DEMO_TIERS } from "../pricing/fixtures";
import { forecastNextTier, type JoinEvent } from "./forecast";
import { groupInsightText } from "./insights";
import { recommendGroups, type CandidateGroup } from "./recommend";

/** `units` joined evenly over the first `hours` hours. */
const history = (units: number, hours: number): JoinEvent[] =>
  Array.from({ length: units }, (_, i) => ({ quantity: 1, createdAt: at((i * hours) / units) }));

const forecast = (totalQty: number, events: JoinEvent[], nowHours: number, closesAtHours = 24) =>
  forecastNextTier({ tiers: DEMO_TIERS, totalQty, opensAt: T0, closesAt: at(closesAtHours), now: at(nowHours), joinEvents: events });

describe("forecastNextTier", () => {
  it("is Likely when the projected units ≥ 1.25 × units missing", () => {
    // 40 units in 10h = 4/h; 14h left → 56 projected; 10 missing → ratio 5.6.
    expect(forecast(40, history(40, 10), 10)).toMatchObject({ label: "LIKELY", unitsMissing: 10, pacePerHour: 4, projectedUnits: 56 });
  });

  it("uses the 0.75 and 1.25 thresholds", () => {
    // 12 units in 12h = 1/h, 12h left → 12 projected.
    expect(forecast(12, history(12, 12), 12)?.label).toBe("UNLIKELY"); // 12 / 38 ≈ 0.32
    expect(forecast(36, history(12, 12), 12)?.label).toBe("POSSIBLE"); // 12 / 14 ≈ 0.86
    expect(forecast(40, history(12, 12), 12)?.label).toBe("POSSIBLE"); // 12 / 10 = 1.2
    expect(forecast(41, history(12, 12), 12)?.label).toBe("LIKELY"); // 12 / 9 ≈ 1.33
  });

  it("counts at least one hour elapsed, damping early spikes", () => {
    // 20 units in the first 6 minutes: pace 20/h (not 200/h).
    expect(forecast(20, history(20, 0.1), 0.1)?.pacePerHour).toBe(20);
  });

  it("is Unlikely when no time is left", () => {
    expect(forecast(45, history(45, 23), 24)?.label).toBe("UNLIKELY");
  });

  it("returns null at the top tier", () => {
    expect(forecast(100, history(100, 10), 10)).toBeNull();
  });

  it("ignores events before the group opened or in the future", () => {
    const events = [{ quantity: 99, createdAt: at(-1) }, { quantity: 99, createdAt: at(30) }];
    expect(forecast(0, events, 5)?.pacePerHour).toBe(0);
  });
});

describe("recommendGroups", () => {
  const group = (groupId: string, overrides: Partial<CandidateGroup>): CandidateGroup => ({
    groupId,
    status: "OPEN",
    opensAt: T0,
    closesAt: at(24),
    totalQty: 0,
    joinEvents: [],
    ...overrides,
  });

  it("ranks by expected unit price, so an unlocked discount counts", () => {
    const now = at(10);
    const result = recommendGroups(
      DEMO_TIERS,
      [
        group("slow-base", { totalQty: 5, joinEvents: history(5, 10) }), // 100 RON, unlikely
        group("discounted", { totalQty: 60, joinEvents: history(60, 10), closesAt: at(168) }), // 95 RON already
        group("fast-base", { totalQty: 45, joinEvents: history(45, 10) }), // 100 RON, likely → 95
      ],
      now,
    );
    expect(result.ranked.map((r) => r.groupId)).toEqual(["discounted", "fast-base", "slow-base"]);
    expect(result.recommendedGroupId).toBe("discounted");
    expect(result.closestToUnlockingGroupId).toBe("fast-base"); // 5 missing (exact)
    expect(result.ranked[1].reasons).toEqual(["Current price 100 RON per unit", "5 more units unlock 95 RON", "Likely to unlock before closing (estimate)"]);
  });

  it("breaks ties by earlier closing", () => {
    const result = recommendGroups(DEMO_TIERS, [group("week", { closesAt: at(168) }), group("day", { closesAt: at(24) })], at(1));
    expect(result.recommendedGroupId).toBe("day");
  });

  it("only ranks groups that still accept joins", () => {
    const result = recommendGroups(DEMO_TIERS, [group("settled", { status: "SETTLED" }), group("closed", { closesAt: at(1) })], at(2));
    expect(result).toEqual({ ranked: [], recommendedGroupId: null, closestToUnlockingGroupId: null });
  });
});

describe("insight text", () => {
  it("is built from computed numbers only", () => {
    const f = forecast(83, history(83, 10), 10, 100)!;
    expect(groupInsightText({ buyerCount: 83, forecast: f })).toBe("83 buyers joined. 17 more units unlock 90 RON. Likely before this group closes (estimate).");
    expect(groupInsightText({ buyerCount: 1, forecast: null })).toBe("1 buyer joined. The best price is already unlocked.");
  });
});

describe("the AI never influences prices", () => {
  const quiet: JoinEvent[] = [];
  const hype = history(500, 1);

  it("the price shown is the tier price, whatever the forecast says", () => {
    const g = (joinEvents: JoinEvent[]): CandidateGroup => ({ groupId: "g", status: "OPEN", opensAt: T0, closesAt: at(24), totalQty: 30, joinEvents });
    const a = recommendGroups(DEMO_TIERS, [g(quiet)], at(2)).ranked[0];
    const b = recommendGroups(DEMO_TIERS, [g(hype)], at(2)).ranked[0];
    expect(a.forecast?.label).toBe("UNLIKELY");
    expect(b.forecast?.label).toBe("LIKELY");
    expect(a.currentUnitPrice).toBe(tierPrice(DEMO_TIERS, 30));
    expect(b.currentUnitPrice).toBe(a.currentUnitPrice);
  });

  it("settlement charges the same whatever the forecast said", () => {
    const commitments = [{ id: "c", status: "ACTIVE" as const, quantity: 30, committedUnitPrice: 10000, reservedAmount: 300000 }];
    const settle = () => planSettlement({ group: openGroup({ totalQty: 30 }), tiers: DEMO_TIERS, commitments, pickupDeadlineDays: 7, now: at(24) });
    const before = settle();
    forecastNextTier({ tiers: DEMO_TIERS, totalQty: 30, opensAt: T0, closesAt: at(24), now: at(2), joinEvents: hype });
    expect(settle()).toEqual(before);
    expect(before).toMatchObject({ finalUnitPrice: 10000 }); // a "Likely" forecast doesn't unlock anything
  });

  it("does not mutate its inputs", () => {
    const tiers = Object.freeze(DEMO_TIERS.map((t) => Object.freeze({ ...t })));
    const events = Object.freeze(hype.map((e) => Object.freeze({ ...e })));
    expect(() => recommendGroups(tiers, [{ groupId: "g", status: "OPEN", opensAt: T0, closesAt: at(24), totalQty: 30, joinEvents: events }], at(2))).not.toThrow();
  });
});
