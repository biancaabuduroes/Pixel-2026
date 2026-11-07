import { assertBani, type Bani } from "../money";
import {
  accountKey,
  buyerAvailable,
  buyerReserved,
  EXTERNAL_FUNDING,
  pendingPickup,
  PLATFORM_REVENUE,
  sellerEarnings,
  type AccountRef,
} from "./accounts";
import { splitPayout, type BasisPoints } from "./commission";

export type TransactionType = "TOPUP" | "RESERVE" | "RELEASE" | "SETTLE" | "PAYOUT" | "REFUND";

export interface LedgerEntry {
  account: AccountRef;
  /** Signed bani: + credits the account, − debits it. */
  amount: Bani;
}

/** A ledger transaction ready to insert. Append-only: never edited or deleted. */
export interface LedgerTransaction {
  operationId: string;
  type: TransactionType;
  commitmentId?: string;
  groupId?: string;
  topUpId?: string;
  entries: readonly LedgerEntry[];
}

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

/** Every transaction: an operation ID, ≥ 2 non-zero integer entries, one currency, summing to 0. */
export function assertValidTransaction(tx: LedgerTransaction): void {
  if (!tx.operationId) throw new LedgerError("operationId is required");
  if (tx.entries.length < 2) throw new LedgerError("A transaction needs at least two entries");
  let sum = 0;
  for (const entry of tx.entries) {
    assertBani(entry.amount, "entry amount");
    if (entry.amount === 0) throw new LedgerError("Entries must be non-zero");
    if (entry.account.currency !== tx.entries[0].account.currency) throw new LedgerError("Entries must share one currency");
    sum += entry.amount;
  }
  if (sum !== 0) throw new LedgerError(`Entries of ${tx.operationId} sum to ${sum}, not 0`);
}

function build(tx: LedgerTransaction): LedgerTransaction {
  const entries = tx.entries.filter((e) => e.amount !== 0); // drop zero legs (e.g. nothing released)
  const result = { ...tx, entries };
  assertValidTransaction(result);
  return result;
}

function positive(amount: Bani, label: string): void {
  assertBani(amount, label);
  if (amount <= 0) throw new LedgerError(`${label} must be > 0`);
}

/**
 * Operation IDs are derived from what caused the transaction, so retrying the same
 * operation produces the same ID and the database's unique constraint rejects it.
 */
export const operationIds = {
  topUp: (topUpId: string) => `topup:${topUpId}`,
  reserve: (commitmentId: string) => `reserve:${commitmentId}`,
  release: (commitmentId: string) => `release:${commitmentId}`,
  settle: (commitmentId: string) => `settle:${commitmentId}`,
  payout: (commitmentId: string) => `payout:${commitmentId}`,
  refund: (commitmentId: string) => `refund:${commitmentId}`,
};

/** Simulated top-up: external funding → buyer available. `topUpId` is the client's idempotency key. */
export function topUpTransaction(p: { topUpId: string; buyerId: string; amount: Bani }): LedgerTransaction {
  positive(p.amount, "amount");
  return build({
    operationId: operationIds.topUp(p.topUpId),
    type: "TOPUP",
    topUpId: p.topUpId,
    entries: [
      { account: EXTERNAL_FUNDING, amount: -p.amount },
      { account: buyerAvailable(p.buyerId), amount: p.amount },
    ],
  });
}

/** Join: available → reserved. */
export function reserveTransaction(p: { commitmentId: string; groupId: string; buyerId: string; amount: Bani }): LedgerTransaction {
  positive(p.amount, "amount");
  return build({
    operationId: operationIds.reserve(p.commitmentId),
    type: "RESERVE",
    commitmentId: p.commitmentId,
    groupId: p.groupId,
    entries: [
      { account: buyerAvailable(p.buyerId), amount: -p.amount },
      { account: buyerReserved(p.buyerId), amount: p.amount },
    ],
  });
}

/** Cancel: the full reserved amount goes back, reserved → available. */
export function releaseTransaction(p: { commitmentId: string; groupId: string; buyerId: string; amount: Bani }): LedgerTransaction {
  positive(p.amount, "amount");
  return build({
    operationId: operationIds.release(p.commitmentId),
    type: "RELEASE",
    commitmentId: p.commitmentId,
    groupId: p.groupId,
    entries: [
      { account: buyerReserved(p.buyerId), amount: -p.amount },
      { account: buyerAvailable(p.buyerId), amount: p.amount },
    ],
  });
}

/** Settlement: reserved → pending pickup (amount charged) and reserved → available (difference). */
export function settleTransaction(p: {
  commitmentId: string;
  groupId: string;
  buyerId: string;
  reservedAmount: Bani;
  amountCharged: Bani;
}): LedgerTransaction {
  positive(p.amountCharged, "amountCharged");
  assertBani(p.reservedAmount, "reservedAmount");
  if (p.amountCharged > p.reservedAmount) throw new LedgerError("amountCharged cannot exceed reservedAmount");
  return build({
    operationId: operationIds.settle(p.commitmentId),
    type: "SETTLE",
    commitmentId: p.commitmentId,
    groupId: p.groupId,
    entries: [
      { account: buyerReserved(p.buyerId), amount: -p.reservedAmount },
      { account: pendingPickup(p.buyerId), amount: p.amountCharged },
      { account: buyerAvailable(p.buyerId), amount: p.reservedAmount - p.amountCharged },
    ],
  });
}

/** Pickup (or no-show after the deadline): pending pickup → seller earnings + platform commission. */
export function payoutTransaction(p: {
  commitmentId: string;
  buyerId: string;
  sellerId: string;
  amountCharged: Bani;
  commissionRateBps: BasisPoints;
}): LedgerTransaction {
  positive(p.amountCharged, "amountCharged");
  const { commission, sellerAmount } = splitPayout(p.amountCharged, p.commissionRateBps);
  return build({
    operationId: operationIds.payout(p.commitmentId),
    type: "PAYOUT",
    commitmentId: p.commitmentId,
    entries: [
      { account: pendingPickup(p.buyerId), amount: -p.amountCharged },
      { account: sellerEarnings(p.sellerId), amount: sellerAmount },
      { account: PLATFORM_REVENUE, amount: commission },
    ],
  });
}

/** P1 dispute resolved for the buyer: pending pickup → available. */
export function refundTransaction(p: { commitmentId: string; buyerId: string; amount: Bani }): LedgerTransaction {
  positive(p.amount, "amount");
  return build({
    operationId: operationIds.refund(p.commitmentId),
    type: "REFUND",
    commitmentId: p.commitmentId,
    entries: [
      { account: pendingPickup(p.buyerId), amount: -p.amount },
      { account: buyerAvailable(p.buyerId), amount: p.amount },
    ],
  });
}

/**
 * Appends a transaction to an in-memory ledger, rejecting a duplicate operation ID
 * (the same rule the database enforces with a unique constraint). Returns a new array.
 */
export function appendTransaction(ledger: readonly LedgerTransaction[], tx: LedgerTransaction): LedgerTransaction[] {
  assertValidTransaction(tx);
  if (ledger.some((t) => t.operationId === tx.operationId)) {
    throw new LedgerError(`Duplicate operation ${tx.operationId}`);
  }
  return [...ledger, tx];
}

/** Balances are never stored: they are the sum of an account's entries (BL §9). */
export function balanceOf(ledger: readonly LedgerTransaction[], account: AccountRef): Bani {
  const key = accountKey(account);
  let sum = 0;
  for (const tx of ledger) for (const e of tx.entries) if (accountKey(e.account) === key) sum += e.amount;
  return sum;
}

/** The buyer wallet view (BL §9). Savings come from commitments, see pricing.savings. */
export function walletSummary(ledger: readonly LedgerTransaction[], buyerId: string) {
  return {
    available: balanceOf(ledger, buyerAvailable(buyerId)),
    reserved: balanceOf(ledger, buyerReserved(buyerId)),
    pendingPickup: balanceOf(ledger, pendingPickup(buyerId)),
  };
}

/** A buyer's transactions, newest last, for the history list. */
export function buyerHistory(ledger: readonly LedgerTransaction[], buyerId: string): LedgerTransaction[] {
  const buyerTypes = new Set(["BUYER_AVAILABLE", "BUYER_RESERVED", "PENDING_PICKUP"]);
  return ledger.filter((tx) => tx.entries.some((e) => e.account.ownerId === buyerId && buyerTypes.has(e.account.type)));
}
