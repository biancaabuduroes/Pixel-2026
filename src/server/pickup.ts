import { afterWrongPickupCode, assertTransition, isPickupLocked, type CommitmentStatus } from "@/domain/groups";
import { parseRateToBasisPoints, payoutTransaction } from "@/domain/wallet";
import { db } from "@/lib/db";
import { postTransactions } from "./ledger";
import { isPickupCodeCorrect } from "./pickup-code";

const DEFAULT_COMMISSION_RATE = "0.05"; // APP_PLAN §5 default when no PlatformSetting exists

export type PickupResult =
  | { ok: true; sellerAmount: number; commission: number }
  | { ok: false; reason: "NOT_FOUND" | "NOT_AWAITING_PICKUP" | "LOCKED" | "WRONG_CODE" };

interface LockedCommitment {
  id: string;
  buyerId: string;
  status: CommitmentStatus;
  amountCharged: number | null;
  pickupCodeHash: string | null;
  failedCodeAttempts: number;
  codeLockedUntil: Date | null;
  sellerId: string;
}

/** BL §8: the seller confirms a pickup with the buyer's code; the seller is paid minus commission. */
export async function confirmPickup(input: { sellerId: string; commitmentId: string; code: string; now?: Date }): Promise<PickupResult> {
  return db.$transaction(async (tx) => {
    const now = input.now ?? new Date();
    const [c] = await tx.$queryRaw<LockedCommitment[]>`
      SELECT c.id, c."buyerId", c.status, c."amountCharged", c."pickupCodeHash", c."failedCodeAttempts", c."codeLockedUntil", p."sellerId"
      FROM "Commitment" c JOIN "Product" p ON p.id = c."productId"
      WHERE c.id = ${input.commitmentId} FOR UPDATE OF c`;
    // Another seller's order looks the same as a missing one.
    if (!c || c.sellerId !== input.sellerId) return { ok: false, reason: "NOT_FOUND" };
    if (c.status !== "AWAITING_PICKUP" || !c.pickupCodeHash || !c.amountCharged) return { ok: false, reason: "NOT_AWAITING_PICKUP" };
    if (isPickupLocked(c.codeLockedUntil, now)) return { ok: false, reason: "LOCKED" };

    if (!isPickupCodeCorrect(c.id, input.code, c.pickupCodeHash)) {
      // Saved (the transaction commits), so the attempt counts.
      await tx.commitment.update({ where: { id: c.id }, data: afterWrongPickupCode(c.failedCodeAttempts, now) });
      return { ok: false, reason: "WRONG_CODE" };
    }

    assertTransition(c.status, "COLLECTED");
    const setting = await tx.platformSetting.findUnique({ where: { key: "commissionRate" } });
    const payout = payoutTransaction({
      commitmentId: c.id,
      buyerId: c.buyerId,
      sellerId: c.sellerId,
      amountCharged: c.amountCharged,
      commissionRateBps: parseRateToBasisPoints(setting?.value ?? DEFAULT_COMMISSION_RATE),
    });
    await tx.commitment.update({ where: { id: c.id }, data: { status: "COLLECTED", failedCodeAttempts: 0, codeLockedUntil: null } });
    await postTransactions(tx, [payout]);
    const commission = payout.entries.find((e) => e.account.type === "PLATFORM_REVENUE")?.amount ?? 0;
    return { ok: true, sellerAmount: c.amountCharged - commission, commission };
  });
}
