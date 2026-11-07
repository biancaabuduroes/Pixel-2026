import { planSettlement, renewalWindow, shouldRenew } from "@/domain/groups";
import { settleTransaction } from "@/domain/wallet";
import { db } from "@/lib/db";
import { stockLeft } from "./commitments";
import { lockProduct, postTransactions } from "./ledger";
import { hashPickupCode, pickupCodeFor } from "./pickup-code";

export type SettleResult =
  | { ok: true; alreadySettled: true }
  | { ok: true; alreadySettled: false; finalUnitPrice: number; settledCount: number; renewedGroupId: string | null }
  | { ok: false; reason: "NOT_FOUND" };

/**
 * BL §7: settles one group in one transaction. Idempotent. `closeNow` (demo panel) moves
 * closesAt to now and runs the same code; the scheduled job (P1) will call it without.
 */
export async function settleGroup(input: { groupId: string; closeNow?: boolean; now?: Date }): Promise<SettleResult> {
  const ref = await db.group.findUnique({ where: { id: input.groupId }, select: { productId: true } });
  if (!ref) return { ok: false, reason: "NOT_FOUND" };

  return db.$transaction(async (tx) => {
    const now = input.now ?? new Date();
    await lockProduct(tx, ref.productId);
    const group = await tx.group.findUniqueOrThrow({
      where: { id: input.groupId },
      include: {
        commitments: true,
        product: { include: { priceTiers: { orderBy: { minQty: "asc" } }, durations: { select: { durationHours: true } } } },
      },
    });
    const closesAt = input.closeNow && group.status === "OPEN" && now < group.closesAt ? now : group.closesAt;

    // Every rule (final price, ≤ committed price, amounts, deadline) comes from the domain.
    const plan = planSettlement({
      group: { ...group, closesAt },
      tiers: group.product.priceTiers,
      commitments: group.commitments,
      pickupDeadlineDays: group.product.pickupDeadlineDays,
      now,
    });
    if (plan.alreadySettled) return { ok: true, alreadySettled: true };

    await tx.group.update({ where: { id: group.id }, data: { status: "SETTLED", closesAt, finalUnitPrice: plan.finalUnitPrice } });

    if (plan.commitments.length > 0) {
      const deadline = plan.commitments[0].pickupDeadline.toISOString();
      const ids = plan.commitments.map((c) => c.commitmentId);
      const charged = plan.commitments.map((c) => c.amountCharged);
      const hashes = ids.map((id) => hashPickupCode(id, pickupCodeFor(id)));
      // One UPDATE for all commitments, instead of one query each.
      await tx.$executeRaw`
        UPDATE "Commitment" AS c
        SET "status" = 'AWAITING_PICKUP', "finalUnitPrice" = ${plan.finalUnitPrice}, "amountCharged" = v.charged,
            "pickupCodeHash" = v.hash, "pickupDeadline" = (${deadline}::timestamptz AT TIME ZONE 'UTC'), "updatedAt" = now()
        FROM unnest(${ids}::text[], ${charged}::int[], ${hashes}::text[]) AS v(id, charged, hash)
        WHERE c.id = v.id`;

      const buyerOf = new Map(group.commitments.map((c) => [c.id, c]));
      await postTransactions(
        tx,
        plan.commitments.map((s) =>
          settleTransaction({
            commitmentId: s.commitmentId,
            groupId: group.id,
            buyerId: buyerOf.get(s.commitmentId)!.buyerId,
            reservedAmount: buyerOf.get(s.commitmentId)!.reservedAmount,
            amountCharged: s.amountCharged,
          }),
        ),
      );
    }

    let renewedGroupId: string | null = null;
    const renew = shouldRenew({
      productActive: group.product.status === "ACTIVE",
      durationOffered: group.product.durations.some((d) => d.durationHours === group.durationHours),
      stockRemaining: await stockLeft(tx, group.productId, group.product.stockTotal),
    });
    if (renew) {
      const next = await tx.group.create({
        data: { productId: group.productId, durationHours: group.durationHours, ...renewalWindow(group.durationHours, now) },
        select: { id: true },
      });
      renewedGroupId = next.id;
    }
    return { ok: true, alreadySettled: false, finalUnitPrice: plan.finalUnitPrice, settledCount: plan.commitments.length, renewedGroupId };
  });
}
