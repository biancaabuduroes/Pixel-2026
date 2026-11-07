import { randomUUID } from "node:crypto";
import { evaluateCancel, evaluateJoin, stockRemaining, type CancelRejection, type JoinRejection } from "@/domain/groups";
import { buyerAvailable, releaseTransaction, reserveTransaction } from "@/domain/wallet";
import { db } from "@/lib/db";
import { accountBalance, lockProduct, postTransactions, type Tx } from "./ledger";

const tierOrder = { orderBy: { minQty: "asc" as const } };

/** Units used per status, summed in the database (≤ 7 rows), for domain stockRemaining. */
async function stockLeft(tx: Tx, productId: string, stockTotal: number): Promise<number> {
  const usage = await tx.commitment.groupBy({ by: ["status"], where: { productId }, _sum: { quantity: true } });
  return stockRemaining(stockTotal, usage.map((u) => ({ status: u.status, quantity: u._sum.quantity ?? 0 })));
}

export type JoinResult =
  | { ok: true; commitmentId: string; committedUnitPrice: number; reservedAmount: number }
  | { ok: false; reason: JoinRejection | "NOT_FOUND" };

/** BL §4: one transaction; the product row lock serializes joins, so stock can't be oversold. */
export async function joinGroup(input: { buyerId: string; groupId: string; quantity: number; now?: Date }): Promise<JoinResult> {
  const ref = await db.group.findUnique({ where: { id: input.groupId }, select: { productId: true } });
  if (!ref) return { ok: false, reason: "NOT_FOUND" };

  return db.$transaction(async (tx) => {
    const now = input.now ?? new Date();
    await lockProduct(tx, ref.productId);
    // Lock the buyer too, so two joins on different products can't spend the same balance.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.buyerId} FOR UPDATE`;

    const group = await tx.group.findUniqueOrThrow({
      where: { id: input.groupId },
      include: { product: { include: { priceTiers: tierOrder } } },
    });
    const [left, existing, availableBalance] = await Promise.all([
      stockLeft(tx, group.productId, group.product.stockTotal),
      tx.commitment.findFirst({ where: { buyerId: input.buyerId, productId: group.productId, status: "ACTIVE" }, select: { id: true } }),
      accountBalance(tx, buyerAvailable(input.buyerId)),
    ]);

    const decision = evaluateJoin({
      group,
      tiers: group.product.priceTiers,
      perBuyerCap: group.product.perBuyerCap,
      quantity: input.quantity,
      stockRemaining: left,
      buyerHasActiveCommitment: existing !== null,
      availableBalance,
      now,
    });
    if (!decision.ok) return decision;

    const commitmentId = randomUUID();
    await tx.group.update({
      where: { id: group.id },
      data: {
        totalQty: decision.newTotalQty,
        commitments: {
          create: {
            id: commitmentId,
            buyerId: input.buyerId,
            quantity: input.quantity,
            committedUnitPrice: decision.committedUnitPrice,
            reservedAmount: decision.reservedAmount,
          },
        },
        joinEvents: { create: { quantity: input.quantity, createdAt: now } },
      },
    });
    await postTransactions(tx, [
      reserveTransaction({ commitmentId, groupId: group.id, buyerId: input.buyerId, amount: decision.reservedAmount }),
    ]);
    return { ok: true, commitmentId, committedUnitPrice: decision.committedUnitPrice, reservedAmount: decision.reservedAmount };
  });
}

export type CancelResult = { ok: true; releasedAmount: number } | { ok: false; reason: CancelRejection | "NOT_FOUND" };

/** BL §5: cancel before the first discount unlocks; the full reserved amount is released. */
export async function cancelCommitment(input: { buyerId: string; commitmentId: string; now?: Date }): Promise<CancelResult> {
  const ref = await db.commitment.findUnique({ where: { id: input.commitmentId }, select: { productId: true, buyerId: true } });
  if (!ref || ref.buyerId !== input.buyerId) return { ok: false, reason: "NOT_FOUND" };

  return db.$transaction(async (tx) => {
    await lockProduct(tx, ref.productId);
    const c = await tx.commitment.findUniqueOrThrow({
      where: { id: input.commitmentId },
      include: { group: true, product: { include: { priceTiers: tierOrder } } },
    });
    const decision = evaluateCancel({ commitmentStatus: c.status, group: c.group, tiers: c.product.priceTiers, now: input.now ?? new Date() });
    if (!decision.allowed) return { ok: false, reason: decision.reason };

    await tx.group.update({
      where: { id: c.groupId },
      data: {
        totalQty: { decrement: c.quantity },
        commitments: { update: { where: { id: c.id }, data: { status: "CANCELLED" } } },
      },
    });
    await postTransactions(tx, [
      releaseTransaction({ commitmentId: c.id, groupId: c.groupId, buyerId: c.buyerId, amount: c.reservedAmount }),
    ]);
    return { ok: true, releasedAmount: c.reservedAmount };
  });
}

export { stockLeft };
