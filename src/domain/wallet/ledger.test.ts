import { describe, expect, it } from "vitest";
import { buyerAvailable, EXTERNAL_FUNDING, pendingPickup, PLATFORM_REVENUE, sellerEarnings } from "./accounts";
import {
  appendTransaction,
  assertValidTransaction,
  balanceOf,
  buyerHistory,
  LedgerError,
  payoutTransaction,
  refundTransaction,
  releaseTransaction,
  reserveTransaction,
  settleTransaction,
  topUpTransaction,
  walletSummary,
  type LedgerTransaction,
} from "./ledger";

const sum = (tx: LedgerTransaction) => tx.entries.reduce((s, e) => s + e.amount, 0);

const ALL_TYPES: LedgerTransaction[] = [
  topUpTransaction({ topUpId: "t1", buyerId: "b", amount: 50000 }),
  reserveTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", amount: 30000 }),
  releaseTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", amount: 30000 }),
  settleTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", reservedAmount: 30000, amountCharged: 28500 }),
  payoutTransaction({ commitmentId: "c1", buyerId: "b", sellerId: "s", amountCharged: 28500, commissionRateBps: 500 }),
  refundTransaction({ commitmentId: "c1", buyerId: "b", amount: 28500 }),
];

describe("ledger transactions", () => {
  it.each(ALL_TYPES.map((tx) => [tx.type, tx] as const))("%s entries sum to 0", (_, tx) => {
    expect(sum(tx)).toBe(0);
    expect(tx.entries.length).toBeGreaterThanOrEqual(2);
    expect(tx.entries.every((e) => Number.isSafeInteger(e.amount) && e.amount !== 0)).toBe(true);
  });

  it("derives operation IDs from the cause, so retries collide", () => {
    expect(ALL_TYPES.map((tx) => tx.operationId)).toEqual([
      "topup:t1",
      "reserve:c1",
      "release:c1",
      "settle:c1",
      "payout:c1",
      "refund:c1",
    ]);
  });

  it("SETTLE moves the charge to pending pickup and releases the difference", () => {
    const tx = settleTransaction({ commitmentId: "c", groupId: "g", buyerId: "b", reservedAmount: 30000, amountCharged: 28500 });
    expect(tx.entries.map((e) => [e.account.type, e.amount])).toEqual([
      ["BUYER_RESERVED", -30000],
      ["PENDING_PICKUP", 28500],
      ["BUYER_AVAILABLE", 1500],
    ]);
  });

  it("SETTLE without a discount has no release leg", () => {
    const tx = settleTransaction({ commitmentId: "c", groupId: "g", buyerId: "b", reservedAmount: 30000, amountCharged: 30000 });
    expect(tx.entries).toHaveLength(2);
  });

  it("SETTLE refuses to charge more than was reserved", () => {
    expect(() => settleTransaction({ commitmentId: "c", groupId: "g", buyerId: "b", reservedAmount: 30000, amountCharged: 30001 })).toThrow(LedgerError);
  });

  it("PAYOUT splits into seller earnings and platform commission", () => {
    const tx = payoutTransaction({ commitmentId: "c", buyerId: "b", sellerId: "s", amountCharged: 28500, commissionRateBps: 500 });
    expect(tx.entries).toEqual([
      { account: pendingPickup("b"), amount: -28500 },
      { account: sellerEarnings("s"), amount: 27075 },
      { account: PLATFORM_REVENUE, amount: 1425 },
    ]);
  });

  it("rejects unbalanced, empty, zero, negative or fractional input", () => {
    const unbalanced: LedgerTransaction = {
      operationId: "x",
      type: "TOPUP",
      entries: [
        { account: EXTERNAL_FUNDING, amount: -100 },
        { account: buyerAvailable("b"), amount: 99 },
      ],
    };
    expect(() => assertValidTransaction(unbalanced)).toThrow(/sum to -1/);
    expect(() => assertValidTransaction({ ...unbalanced, operationId: "" })).toThrow(LedgerError);
    expect(() => topUpTransaction({ topUpId: "t", buyerId: "b", amount: 0 })).toThrow(LedgerError);
    expect(() => topUpTransaction({ topUpId: "t", buyerId: "b", amount: -5 })).toThrow(LedgerError);
    expect(() => topUpTransaction({ topUpId: "t", buyerId: "b", amount: 10.5 })).toThrow();
  });
});

describe("balances calculated from entries", () => {
  it("follows the demo script end to end", () => {
    let ledger: LedgerTransaction[] = [];
    ledger = appendTransaction(ledger, topUpTransaction({ topUpId: "t1", buyerId: "b", amount: 50000 }));
    expect(walletSummary(ledger, "b")).toEqual({ available: 50000, reserved: 0, pendingPickup: 0 });

    ledger = appendTransaction(ledger, reserveTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", amount: 30000 }));
    expect(walletSummary(ledger, "b")).toEqual({ available: 20000, reserved: 30000, pendingPickup: 0 });

    ledger = appendTransaction(ledger, settleTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", reservedAmount: 30000, amountCharged: 28500 }));
    expect(walletSummary(ledger, "b")).toEqual({ available: 21500, reserved: 0, pendingPickup: 28500 });

    ledger = appendTransaction(ledger, payoutTransaction({ commitmentId: "c1", buyerId: "b", sellerId: "s", amountCharged: 28500, commissionRateBps: 500 }));
    expect(walletSummary(ledger, "b")).toEqual({ available: 21500, reserved: 0, pendingPickup: 0 });
    expect(balanceOf(ledger, sellerEarnings("s"))).toBe(27075);
    expect(balanceOf(ledger, PLATFORM_REVENUE)).toBe(1425);
    expect(balanceOf(ledger, EXTERNAL_FUNDING)).toBe(-50000);

    // F6: available + reserved + pending = top-ups − payouts.
    const s = walletSummary(ledger, "b");
    expect(s.available + s.reserved + s.pendingPickup).toBe(50000 - 28500);

    // The whole ledger always sums to 0.
    expect(ledger.flatMap((tx) => tx.entries).reduce((acc, e) => acc + e.amount, 0)).toBe(0);
    expect(buyerHistory(ledger, "b").map((tx) => tx.type)).toEqual(["TOPUP", "RESERVE", "SETTLE", "PAYOUT"]);
  });

  it("cancelling releases the full reserved amount", () => {
    let ledger = appendTransaction([], topUpTransaction({ topUpId: "t1", buyerId: "b", amount: 50000 }));
    ledger = appendTransaction(ledger, reserveTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", amount: 30000 }));
    ledger = appendTransaction(ledger, releaseTransaction({ commitmentId: "c1", groupId: "g", buyerId: "b", amount: 30000 }));
    expect(walletSummary(ledger, "b")).toEqual({ available: 50000, reserved: 0, pendingPickup: 0 });
  });

  it("the same top-up submitted twice is credited once", () => {
    const tx = topUpTransaction({ topUpId: "same-click", buyerId: "b", amount: 10000 });
    const ledger = appendTransaction([], tx);
    expect(() => appendTransaction(ledger, topUpTransaction({ topUpId: "same-click", buyerId: "b", amount: 10000 }))).toThrow(/Duplicate/);
    expect(balanceOf(ledger, buyerAvailable("b"))).toBe(10000);
  });

  it("keeps buyers separate", () => {
    let ledger = appendTransaction([], topUpTransaction({ topUpId: "t1", buyerId: "a", amount: 100 }));
    ledger = appendTransaction(ledger, topUpTransaction({ topUpId: "t2", buyerId: "b", amount: 200 }));
    expect(balanceOf(ledger, buyerAvailable("a"))).toBe(100);
    expect(balanceOf(ledger, buyerAvailable("b"))).toBe(200);
  });
});
