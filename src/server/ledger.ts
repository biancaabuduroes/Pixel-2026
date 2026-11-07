import { randomUUID } from "node:crypto";
import { accountKey, type AccountRef, type LedgerTransaction } from "@/domain/wallet";
import type { Prisma } from "@/generated/prisma/client";

export type Tx = Prisma.TransactionClient;

const accountWhere = (a: AccountRef) => ({ ownerUserId: a.ownerId, type: a.type, currency: a.currency });

/**
 * Writes ledger transactions built by src/domain/wallet in 4 queries, however many
 * transactions: create missing accounts, read their IDs, insert transactions, insert entries.
 * A repeated operationId fails the unique constraint and rolls back the whole operation;
 * the database also re-checks at commit that each transaction sums to 0.
 */
export async function postTransactions(tx: Tx, transactions: readonly LedgerTransaction[]): Promise<void> {
  if (transactions.length === 0) return;
  const accounts = new Map<string, AccountRef>();
  for (const t of transactions) for (const e of t.entries) accounts.set(accountKey(e.account), e.account);

  await tx.ledgerAccount.createMany({ data: [...accounts.values()].map(accountWhere), skipDuplicates: true });
  const rows = await tx.ledgerAccount.findMany({ where: { OR: [...accounts.values()].map(accountWhere) } });
  const idByKey = new Map(rows.map((r) => [accountKey({ type: r.type, ownerId: r.ownerUserId, currency: "RON" }), r.id]));

  const withIds = transactions.map((t) => ({ id: randomUUID(), t }));
  await tx.ledgerTransaction.createMany({
    data: withIds.map(({ id, t }) => ({
      id,
      operationId: t.operationId,
      type: t.type,
      commitmentId: t.commitmentId,
      groupId: t.groupId,
      topUpId: t.topUpId,
    })),
  });
  await tx.ledgerEntry.createMany({
    data: withIds.flatMap(({ id, t }) =>
      t.entries.map((e) => ({ transactionId: id, accountId: idByKey.get(accountKey(e.account))!, amount: e.amount })),
    ),
  });
}

/** Balance = sum of the account's entries (never stored). */
export async function accountBalance(tx: Tx, account: AccountRef): Promise<number> {
  const result = await tx.ledgerEntry.aggregate({ _sum: { amount: true }, where: { account: accountWhere(account) } });
  return result._sum.amount ?? 0;
}

/** Row lock on the product: join, cancel and settle for one product run one at a time. */
export async function lockProduct(tx: Tx, productId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;
}
