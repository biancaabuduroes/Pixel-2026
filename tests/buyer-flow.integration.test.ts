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
    // totalQty = sum of ACTIVE commitments while a group is open; settled groups keep their final total.
    const groups = await db.group.findMany({ where: { status: "OPEN" }, include: { commitments: { where: { status: "ACTIVE" } } } });
    for (const g of groups) expect(g.totalQty).toBe(g.commitments.reduce((s, c) => s + c.quantity, 0));
  });

  it("home lists one card per product and settles the buyer's past-due group", async () => {
    const home = await q.homeData("demo-buyer");
    expect(home.cards).toHaveLength(14); // 9 base products + 5 birotica (15 retired 2026-11-08)
    expect(home.cards.filter((c) => c.kind === "BASKET").map((c) => [c.productId, c.itemCount])).toEqual([
      ["seed-cos-baza", 6],
      ["seed-cos-ingrijire", 5],
      ["seed-cos-premium", 5],
    ]);
    const scutece = home.cards.find((c) => c.productId === "seed-scutece");
    expect(scutece).toMatchObject({ name: "Scutece nr. 4, 104 buc", groupCount: 3, fromUnitPrice: 9499 });
    // imageUrl is set only for products with a photo in public/products; the rest show the fallback.
    expect(scutece?.imageUrl).toBe("/products/seed-scutece.webp");
    expect(home.cards.find((c) => c.productId === "seed-ulei")?.imageUrl).toBe("/products/seed-ulei.webp");
    expect(home.myGroups.map((g) => g.productId)).toEqual(["seed-ulei"]);
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
    expect(profile?.totalSavings).toBe(1000); // honey: 49,99 committed → 39,99 final, 1 unit
    expect(profile?.history.map((h) => h.type)).toContain("SETTLE");
    expect(profile?.orders[0].status).toBe("AWAITING_PICKUP"); // ready for pickup comes first
    const ready = profile?.orders.find((o) => o.status === "AWAITING_PICKUP");
    expect(ready?.pickup?.code).toMatch(/^\d{6}$/);
    expect(ready?.pickup?.qrSvg).toContain("<svg");
    const active = profile?.orders.find((o) => o.status === "ACTIVE");
    expect(active?.cancelLockedBy).toBeNull(); // ulei 168h group is below its first discount
  });

  it("pool page lists a basket's contents in order", async () => {
    const pool = await q.productData("seed-cos-baza", null);
    expect(pool?.product.kind).toBe("BASKET");
    expect(pool?.product.basketItems[0]).toEqual({ name: "Ulei de floarea-soarelui 1 L", quantity: 2 });
    expect(pool?.product.basketItems).toHaveLength(6);
  });

  it("a phone sign-up gets its own empty wallet, so Profile shows exactly the onboarding top-up", async () => {
    const { createSignupBuyer } = await import("@/server/onboarding");
    const { topUp } = await import("@/server/top-up");
    const first = await createSignupBuyer("712345678");
    const second = await createSignupBuyer("712345678");
    expect(second).not.toBe(first); // every sign-up is a new account
    expect((await q.profileData(first))?.wallet).toEqual({ available: 0, reserved: 0 });
    expect(await topUp({ buyerId: first, topUpId: crypto.randomUUID(), amount: 10_000 })).toMatchObject({ ok: true });
    const profile = await q.profileData(first);
    expect(profile?.wallet).toEqual({ available: 10_000, reserved: 0 });
    expect(profile?.user.preferences.phone).toBe("712345678");
    expect(profile?.history.map((h) => [h.type, h.amount])).toEqual([["TOPUP", 10_000]]);
  });

  it("group progress returns server-computed offer", async () => {
    const p = await q.groupProgress("seed-scutece-g24");
    expect(p?.offer).toMatchObject({ totalQty: 17, currentUnitPrice: 12499, next: { minQty: 20, unitsMissing: 3, unitPrice: 9499 } });
  });
});
