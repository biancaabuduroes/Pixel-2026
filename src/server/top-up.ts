import { topUpTransaction } from "@/domain/wallet";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { postTransactions } from "./ledger";
import { simulatedProvider, type PaymentProvider } from "./payments/provider";

export type TopUpResult = { ok: true; duplicate: boolean } | { ok: false; reason: "PAYMENT_FAILED" };

/**
 * Credits the buyer's wallet. `topUpId` is the client's idempotency key: a retried top-up
 * hits the unique operationId and is credited only once.
 */
export async function topUp(
  input: { buyerId: string; topUpId: string; amount: number },
  provider: PaymentProvider = simulatedProvider,
): Promise<TopUpResult> {
  const charge = await provider.charge({ amount: input.amount, reference: input.topUpId });
  if (!charge.ok) return { ok: false, reason: "PAYMENT_FAILED" };
  try {
    await db.$transaction((tx) => postTransactions(tx, [topUpTransaction(input)]));
    return { ok: true, duplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: true, duplicate: true };
    throw error;
  }
}
