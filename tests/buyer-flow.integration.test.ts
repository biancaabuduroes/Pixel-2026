import { readFileSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Buyer-flow page loaders against a real database loaded with prisma/seed.sql + prisma/seed-demo.sql.
// Opt-in like the other DB tests: TEST_DATABASE_URL=… npm test. Never point this at Supabase: it truncates.
const url = process.env.TEST_DATABASE_URL;

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000" }) }));

describe.skipIf(!url)("buyer flow loaders (database, demo seed)", () => {
  let q: typeof import("@/server/buyer-queries");
  let db: typeof import("@/lib/db").db;

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", url!);
    vi.stubEnv("PICKUP_CODE_SECRET", "test-secret");
    // Simple-protocol client so each SQL file runs as one multi-statement script.
    const pg = new Client({ connectionString: url!.replace("?pgbouncer=true", "") });
    await pg.connect();
    await pg.query(
      `TRUNCATE "LedgerEntry", "LedgerTransaction", "LedgerAccount", "JoinEvent", "Commitment", "Group", "ProductDuration", "PriceTier", "Product", "PickupLocation", "SellerProfile", "PlatformSetting", "User" CASCADE`,
    );
    await pg.query(readFileSync("prisma/seed.sql", "utf8"));
    await pg.query(readFileSync("prisma/seed-demo.sql", "utf8"));
    await pg.query(readFileSync("prisma/seed-demo.sql", "utf8")); // idempotent
    await pg.end();
    q = await import("@/server/buyer-queries");
    db = (await import("@/lib/db")).db;
  });
  afterAll(() => db?.$disconnect());

  it("seeds balanced ledger transactions and consistent group totals", async () => {
    const total = await db.ledgerEntry.aggregate({ _sum: { amount: true } });
    expect(total._sum.amount).toBe(0);
    const groups = await db.group.findMany({ include: { commitments: { where: { status: "ACTIVE" } } } });
    for (const g of groups) expect(g.totalQty).toBe(g.commitments.reduce((s, c) => s + c.quantity, 0));
  });

  it("home lists one card per product and settles the buyer's past-due group", async () => {
    const home = await q.homeData("demo-buyer");
    expect(home.cards).toHaveLength(6);
    expect(home.myGroups.map((g) => g.productId)).toEqual(["seed-ulei"]);
    expect(home.totalSavings).toBe(1000); // honey: 49,99 committed → 39,99 final, 1 unit
    const honey = await db.commitment.findFirstOrThrow({ where: { buyerId: "demo-buyer", productId: "seed-miere" } });
    expect(honey).toMatchObject({ status: "AWAITING_PICKUP", finalUnitPrice: 3999, amountCharged: 3999 });
  });

  it("pool page maps groups by closing time and recommends one", async () => {
    const pool = await q.productData("seed-scutece", "demo-buyer");
    expect(pool?.groups.map((g) => g.segment)).toEqual(["RAPID", "ECHILIBRAT", "CEL_MAI_IEFTIN"]);
    expect(pool?.groups.map((g) => g.id)).toContain(pool?.recommendedGroupId);
    expect(pool?.activeCommitment).toBeNull();
    expect(pool?.availableBalance).toBe(50_000 - 2 * 5499 - 3999); // top-up − ulei reserve − honey final price (1.000 back)
  });

  it("profile shows wallet, history and a pickup code for the settled order", async () => {
    const profile = await q.profileData("demo-buyer");
    expect(profile?.wallet.reserved).toBe(2 * 5499);
    expect(profile?.history.map((h) => h.type)).toContain("SETTLE");
    const ready = profile?.orders.find((o) => o.status === "AWAITING_PICKUP");
    expect(ready?.pickup?.code).toMatch(/^\d{6}$/);
    expect(ready?.pickup?.qrSvg).toContain("<svg");
    const active = profile?.orders.find((o) => o.status === "ACTIVE");
    expect(active?.cancelLockedBy).toBeNull(); // ulei 168h group is below its first discount
  });

  it("group progress returns server-computed offer", async () => {
    const p = await q.groupProgress("seed-scutece-g24");
    expect(p?.offer).toMatchObject({ totalQty: 17, currentUnitPrice: 12499, next: { minQty: 20, unitsMissing: 3, unitPrice: 9499 } });
  });
});
