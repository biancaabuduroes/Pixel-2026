import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";

// Runs only against a disposable, already-migrated database:
//   TEST_DATABASE_URL=postgresql://… npm test
// Never point this at Supabase: it writes test rows.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("database (Prisma 7 + pg adapter)", () => {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
  afterAll(() => db.$disconnect());

  const account = (type: "PLATFORM_REVENUE" | "EXTERNAL_FUNDING") =>
    db.ledgerAccount.upsert({
      where: { type_currency: { type, currency: "RON" } },
      create: { type, ownerUserId: null },
      update: {},
    });

  it("runs a transaction with a row lock and a balanced ledger posting", async () => {
    const [revenue, funding] = await Promise.all([account("PLATFORM_REVENUE"), account("EXTERNAL_FUNDING")]);
    const operationId = `test:${crypto.randomUUID()}`;
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LedgerAccount" WHERE id = ${revenue.id} FOR UPDATE`;
      await tx.ledgerTransaction.create({
        data: {
          operationId,
          type: "TOPUP",
          entries: { create: [{ accountId: funding.id, amount: -100 }, { accountId: revenue.id, amount: 100 }] },
        },
      });
    });
    const sum = await db.ledgerEntry.aggregate({ where: { transaction: { operationId } }, _sum: { amount: true } });
    expect(sum._sum.amount).toBe(0);
  });

  it("rejects an unbalanced posting at commit and keeps nothing", async () => {
    const [revenue, funding] = await Promise.all([account("PLATFORM_REVENUE"), account("EXTERNAL_FUNDING")]);
    const operationId = `test:${crypto.randomUUID()}`;
    await expect(
      db.$transaction(async (tx) => {
        await tx.ledgerTransaction.create({
          data: {
            operationId,
            type: "TOPUP",
            entries: { create: [{ accountId: funding.id, amount: -100 }, { accountId: revenue.id, amount: 99 }] },
          },
        });
      }),
    ).rejects.toThrow(/unbalanced/);
    expect(await db.ledgerTransaction.count({ where: { operationId } })).toBe(0);
  });

  it("rejects editing the ledger", async () => {
    const entry = await db.ledgerEntry.findFirstOrThrow();
    await expect(db.ledgerEntry.update({ where: { id: entry.id }, data: { amount: 1 } })).rejects.toThrow(/append-only/);
  });
});
