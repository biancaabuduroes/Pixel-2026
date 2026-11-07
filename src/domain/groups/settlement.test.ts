import { describe, expect, it } from "vitest";
import { DEMO_TIERS } from "../pricing/fixtures";
import { evaluateCancel } from "./cancel";
import { at, openGroup } from "./fixtures";
import { evaluateJoin } from "./join";
import { planSettlement, SettlementInvariantError } from "./settlement";
import type { CommitmentState, GroupState } from "./types";

const commitment = (id: string, quantity: number, committedUnitPrice: number, status: CommitmentState["status"] = "ACTIVE"): CommitmentState => ({
  id,
  status,
  quantity,
  committedUnitPrice,
  reservedAmount: quantity * committedUnitPrice,
});

const settle = (group: GroupState, commitments: CommitmentState[]) =>
  planSettlement({ group, tiers: DEMO_TIERS, commitments, pickupDeadlineDays: 7, now: at(24) });

describe("planSettlement", () => {
  it("charges the final tier price and releases the difference (demo script)", () => {
    const plan = settle(openGroup({ totalQty: 53 }), [commitment("buyer", 3, 10000), commitment("sim", 50, 10000)]);
    expect(plan).toMatchObject({ alreadySettled: false, finalUnitPrice: 9500 });
    if (plan.alreadySettled) throw new Error("unreachable");
    expect(plan.commitments[0]).toEqual({
      commitmentId: "buyer",
      finalUnitPrice: 9500,
      amountCharged: 28500, // 285 RON pending pickup
      releasedAmount: 1500, // 15 RON released
      pickupDeadline: at(24 + 7 * 24),
    });
  });

  it("charges the base price and releases nothing when no tier unlocked", () => {
    const plan = settle(openGroup({ totalQty: 3 }), [commitment("a", 3, 10000)]);
    expect(plan).toMatchObject({ finalUnitPrice: 10000, commitments: [{ amountCharged: 30000, releasedAmount: 0 }] });
  });

  it("skips cancelled commitments", () => {
    const plan = settle(openGroup({ totalQty: 3 }), [commitment("a", 3, 10000), commitment("b", 5, 10000, "CANCELLED")]);
    expect(plan).toMatchObject({ commitments: [{ commitmentId: "a" }] });
  });

  it("settles an empty group", () => {
    expect(settle(openGroup(), [])).toEqual({ alreadySettled: false, finalUnitPrice: 10000, commitments: [] });
  });

  it("is idempotent: a settled group is not settled again", () => {
    expect(settle(openGroup({ status: "SETTLED", totalQty: 3 }), [commitment("a", 3, 10000, "AWAITING_PICKUP")])).toEqual({ alreadySettled: true });
  });

  it("refuses cancelled groups and groups before closing time", () => {
    expect(() => settle(openGroup({ status: "CANCELLED" }), [])).toThrow(SettlementInvariantError);
    expect(() => planSettlement({ group: openGroup(), tiers: DEMO_TIERS, commitments: [], pickupDeadlineDays: 7, now: at(23) })).toThrow(SettlementInvariantError);
  });

  it("asserts finalUnitPrice ≤ committedUnitPrice", () => {
    // Corrupted state: a commitment at 90 RON in a group whose final price is 95 RON.
    expect(() => settle(openGroup({ totalQty: 60 }), [commitment("a", 10, 9000), commitment("b", 50, 9500)])).toThrow(
      /finalUnitPrice 9500 > committedUnitPrice 9000/,
    );
  });

  it("asserts the reserved amount and the group total are consistent", () => {
    const tampered = { ...commitment("a", 3, 10000), reservedAmount: 20000 };
    expect(() => settle(openGroup({ totalQty: 3 }), [tampered])).toThrow(SettlementInvariantError);
    expect(() => settle(openGroup({ totalQty: 4 }), [commitment("a", 3, 10000)])).toThrow(/totalQty/);
  });
});

describe("guarantee: a buyer never pays more than the committed unit price", () => {
  // Deterministic pseudo-random generator, so failures are reproducible.
  function rng(seed: number) {
    return () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
  }

  it("holds for 500 random sequences of joins and cancels", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const random = rng(seed);
      let group = openGroup();
      const commitments: CommitmentState[] = [];
      for (let step = 0; step < 80; step++) {
        const now = at(step * 0.25);
        const active = commitments.filter((c) => c.status === "ACTIVE");
        if (active.length > 0 && random() < 0.3) {
          const target = active[Math.floor(random() * active.length)];
          if (evaluateCancel({ commitmentStatus: target.status, group, tiers: DEMO_TIERS, now }).allowed) {
            target.status = "CANCELLED";
            group = { ...group, totalQty: group.totalQty - target.quantity };
          }
        } else {
          const decision = evaluateJoin({
            group,
            tiers: DEMO_TIERS,
            perBuyerCap: 10,
            quantity: 1 + Math.floor(random() * 10),
            stockRemaining: 200,
            buyerHasActiveCommitment: false,
            availableBalance: 1_000_000,
            now,
          });
          if (decision.ok) {
            commitments.push({ id: `c${step}`, status: "ACTIVE", quantity: decision.newTotalQty - group.totalQty, committedUnitPrice: decision.committedUnitPrice, reservedAmount: decision.reservedAmount });
            group = { ...group, totalQty: decision.newTotalQty };
          }
        }
      }
      const plan = settle(group, commitments); // throws if the invariant is ever broken
      if (plan.alreadySettled) throw new Error("unreachable");
      for (const settled of plan.commitments) {
        const original = commitments.find((c) => c.id === settled.commitmentId)!;
        expect(settled.finalUnitPrice).toBeLessThanOrEqual(original.committedUnitPrice);
        expect(settled.amountCharged).toBeLessThanOrEqual(original.reservedAmount);
      }
    }
  });
});
