import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Money operations against a real, migrated database — ideally through PgBouncer in
// transaction mode, like Supabase's pooler. Opt-in: TEST_DATABASE_URL=… npm test.
// Never point this at Supabase: it truncates every table.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("money services (database)", () => {
  let s: Awaited<ReturnType<typeof load>>;
  async function load() {
    vi.stubEnv("DATABASE_URL", url!);
    vi.stubEnv("PICKUP_CODE_SECRET", "test-secret");
    const [{ db }, commitments, settlement, pickup, topUp, ledger, wallet, code] = await Promise.all([
      import("@/lib/db"),
      import("@/server/commitments"),
      import("@/server/settlement"),
      import("@/server/pickup"),
      import("@/server/top-up"),
      import("@/server/ledger"),
      import("@/domain/wallet"),
      import("@/server/pickup-code"),
    ]);
    return { db, ...commitments, ...settlement, ...pickup, ...topUp, ...ledger, ...wallet, ...code };
  }
  beforeAll(async () => {
    s = await load();
  });
  afterAll(() => s.db.$disconnect());
  beforeEach(async () => {
    await s.db.$executeRawUnsafe(
      `TRUNCATE "LedgerEntry", "LedgerTransaction", "LedgerAccount", "JoinEvent", "Commitment", "Group", "ProductDuration", "PriceTier", "Product", "PickupLocation", "SellerProfile", "PlatformSetting", "User" CASCADE`,
    );
  });

  const DEMO_TIERS = [
    { minQty: 1, unitPrice: 10000 },
    { minQty: 50, unitPrice: 9500 },
    { minQty: 100, unitPrice: 9000 },
  ];

  async function product(opts: { tiers: { minQty: number; unitPrice: number }[]; stockTotal: number; perBuyerCap: number; durations?: number[] }) {
    const seller = await s.db.user.create({ data: { email: `${randomUUID()}@seller`, name: "Seller", role: "SELLER" } });
    const location = await s.db.pickupLocation.create({ data: { sellerId: seller.id, name: "Shop", address: "Str. 1", openingHours: "9–18" } });
    const durations = opts.durations ?? [24];
    const p = await s.db.product.create({
      data: {
        sellerId: seller.id,
        pickupLocationId: location.id,
        name: "Product",
        description: "",
        stockTotal: opts.stockTotal,
        perBuyerCap: opts.perBuyerCap,
        priceTiers: { create: opts.tiers },
        durations: { create: durations.map((durationHours) => ({ durationHours })) },
      },
    });
    const now = Date.now();
    const groups = await Promise.all(
      durations.map((h) =>
        s.db.group.create({ data: { productId: p.id, durationHours: h, opensAt: new Date(now - 3600_000), closesAt: new Date(now + h * 3600_000) } }),
      ),
    );
    return { sellerId: seller.id, productId: p.id, groupIds: groups.map((g) => g.id) };
  }

  async function buyer(balance: number) {
    const b = await s.db.user.create({ data: { email: `${randomUUID()}@buyer`, name: "Buyer", role: "BUYER" } });
    if (balance > 0) expect(await s.topUp({ buyerId: b.id, topUpId: randomUUID(), amount: balance })).toEqual({ ok: true, duplicate: false });
    return b.id;
  }

  const wallet = async (buyerId: string) => ({
    available: await s.accountBalance(s.db, s.buyerAvailable(buyerId)),
    reserved: await s.accountBalance(s.db, s.buyerReserved(buyerId)),
    pending: await s.accountBalance(s.db, s.pendingPickup(buyerId)),
  });
  const ledgerTotal = async () => (await s.db.ledgerEntry.aggregate({ _sum: { amount: true } }))._sum.amount ?? 0;

  it("concurrent joins never oversell stock or overspend a balance", async () => {
    const { groupIds } = await product({ tiers: [{ minQty: 1, unitPrice: 1000 }], stockTotal: 10, perBuyerCap: 3, durations: [24, 168] });
    const buyers = await Promise.all(Array.from({ length: 8 }, () => buyer(10_000)));

    // 8 buyers × 3 units at once, with stock for 10: exactly 3 can join.
    const results = await Promise.all(buyers.map((buyerId) => s.joinGroup({ buyerId, groupId: groupIds[0], quantity: 3 })));
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(results.filter((r) => !r.ok).map((r) => !r.ok && r.reason)).toEqual(Array(5).fill("INSUFFICIENT_STOCK"));
    expect((await s.db.group.findUniqueOrThrow({ where: { id: groupIds[0] } })).totalQty).toBe(9);

    // One buyer, two groups of the same product at once, money for one: one commitment only.
    const poor = await buyer(1000);
    const both = await Promise.all(groupIds.map((groupId) => s.joinGroup({ buyerId: poor, groupId, quantity: 1 })));
    expect(both.filter((r) => r.ok)).toHaveLength(1);
    expect(await wallet(poor)).toEqual({ available: 0, reserved: 1000, pending: 0 });
    expect(await ledgerTotal()).toBe(0);
  });

  it("a retried operation has no extra effect", async () => {
    const buyerId = await buyer(0);
    const topUpId = randomUUID();
    const tries = await Promise.all([1, 2, 3].map(() => s.topUp({ buyerId, topUpId, amount: 50_000 })));
    expect(tries.filter((r) => r.ok && !r.duplicate)).toHaveLength(1);
    expect((await wallet(buyerId)).available).toBe(50_000);

    const { groupIds } = await product({ tiers: DEMO_TIERS, stockTotal: 200, perBuyerCap: 10 });
    await s.joinGroup({ buyerId, groupId: groupIds[0], quantity: 3 });
    const first = await s.settleGroup({ groupId: groupIds[0], closeNow: true });
    const entries = await s.db.ledgerEntry.count();
    expect(first).toMatchObject({ ok: true, alreadySettled: false });
    expect(await s.settleGroup({ groupId: groupIds[0], closeNow: true })).toEqual({ ok: true, alreadySettled: true });
    expect(await s.db.ledgerEntry.count()).toBe(entries);
  });

  it("settles at a better tier, releases the difference and pays the seller on pickup (demo script)", async () => {
    const { groupIds, sellerId } = await product({ tiers: DEMO_TIERS, stockTotal: 200, perBuyerCap: 10 });
    const me = await buyer(50_000);
    expect(await s.joinGroup({ buyerId: me, groupId: groupIds[0], quantity: 3 })).toMatchObject({ ok: true, committedUnitPrice: 10000, reservedAmount: 30000 });
    for (const other of await Promise.all(Array.from({ length: 5 }, () => buyer(100_000)))) {
      expect((await s.joinGroup({ buyerId: other, groupId: groupIds[0], quantity: 10 })).ok).toBe(true);
    }

    const settled = await s.settleGroup({ groupId: groupIds[0], closeNow: true });
    expect(settled).toMatchObject({ ok: true, finalUnitPrice: 9500, settledCount: 6 });
    expect(await wallet(me)).toEqual({ available: 21_500, reserved: 0, pending: 28_500 }); // 15 RON released
    const renewed = await s.db.group.findMany({ where: { status: "OPEN" } });
    expect(renewed.map((g) => g.id)).toEqual([settled.ok && !settled.alreadySettled ? settled.renewedGroupId : null]);

    const mine = await s.db.commitment.findFirstOrThrow({ where: { buyerId: me } });
    expect(mine).toMatchObject({ status: "AWAITING_PICKUP", finalUnitPrice: 9500, amountCharged: 28_500 });
    const code = s.pickupCodeFor(mine.id);
    const wrong = code === "000000" ? "000001" : "000000";
    expect(await s.confirmPickup({ sellerId, commitmentId: mine.id, code: wrong })).toEqual({ ok: false, reason: "WRONG_CODE" });
    expect(await s.confirmPickup({ sellerId: me, commitmentId: mine.id, code })).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(await s.confirmPickup({ sellerId, commitmentId: mine.id, code })).toEqual({ ok: true, sellerAmount: 27_075, commission: 1_425 });
    expect(await s.confirmPickup({ sellerId, commitmentId: mine.id, code })).toEqual({ ok: false, reason: "NOT_AWAITING_PICKUP" });
    expect(await s.accountBalance(s.db, s.sellerEarnings(sellerId))).toBe(27_075);
    expect(await s.accountBalance(s.db, s.PLATFORM_REVENUE)).toBe(1_425);
    expect(await ledgerTotal()).toBe(0);
  });

  it("cancelling refunds the full reservation, until a tier unlocks", async () => {
    const { groupIds } = await product({ tiers: DEMO_TIERS, stockTotal: 200, perBuyerCap: 10 });
    const me = await buyer(50_000);
    const joined = await s.joinGroup({ buyerId: me, groupId: groupIds[0], quantity: 3 });
    if (!joined.ok) throw new Error(joined.reason);
    expect(await s.cancelCommitment({ buyerId: me, commitmentId: joined.commitmentId })).toEqual({ ok: true, releasedAmount: 30_000 });
    expect(await wallet(me)).toEqual({ available: 50_000, reserved: 0, pending: 0 });
    expect((await s.db.group.findUniqueOrThrow({ where: { id: groupIds[0] } })).totalQty).toBe(0);

    // Once the group reaches 50 units, nobody can leave.
    const again = await s.joinGroup({ buyerId: me, groupId: groupIds[0], quantity: 5 }); // 500 RON, all of it
    for (const other of await Promise.all(Array.from({ length: 5 }, () => buyer(100_000)))) {
      await s.joinGroup({ buyerId: other, groupId: groupIds[0], quantity: 10 });
    }
    if (!again.ok) throw new Error(again.reason);
    expect(await s.cancelCommitment({ buyerId: me, commitmentId: again.commitmentId })).toEqual({ ok: false, reason: "TIER_UNLOCKED" });
    expect(await ledgerTotal()).toBe(0);
  });
});
