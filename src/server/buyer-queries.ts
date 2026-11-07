import QRCode from "qrcode";
import { evaluateCancel, stockRemaining } from "@/domain/groups";
import { savings } from "@/domain/pricing";
import { groupOffer, recommendGroups, segmentGroups, type GroupOffer, type Segment } from "@/domain/ai";
import { db } from "@/lib/db";
import { pickupCodeFor } from "./pickup-code";
import { requestOrigin } from "./queries";
import { settleGroup } from "./settlement";

// Buyer-flow page data. Everything is computed here, on the server; pages only format it.

const tiersAsc = { orderBy: { minQty: "asc" as const } };
const openGroups = (now: Date) => ({
  where: { status: "OPEN" as const, closesAt: { gt: now } },
  select: { id: true, opensAt: true, closesAt: true, totalQty: true, joinEvents: { select: { quantity: true, createdAt: true } } },
});

type GroupRow = { id: string; opensAt: Date; closesAt: Date; totalQty: number; joinEvents: { quantity: number; createdAt: Date }[] };
type Tier = { minQty: number; unitPrice: number };

function offerFor(tiers: Tier[], g: GroupRow, now: Date): GroupOffer {
  return groupOffer({ tiers, totalQty: g.totalQty, opensAt: g.opensAt, closesAt: g.closesAt, now, joinEvents: g.joinEvents });
}

/** The group the AI ranking recommends (lowest expected price), else the soonest closing. */
function recommendedGroup(tiers: Tier[], groups: GroupRow[], now: Date): GroupRow | null {
  const { recommendedGroupId } = recommendGroups(
    tiers,
    groups.map((g) => ({ groupId: g.id, status: "OPEN", opensAt: g.opensAt, closesAt: g.closesAt, totalQty: g.totalQty, joinEvents: g.joinEvents })),
    now,
  );
  return groups.find((g) => g.id === recommendedGroupId) ?? null;
}

export type DealCard = {
  productId: string;
  name: string;
  category: string | null;
  kind: "ITEM" | "BASKET";
  /** Number of lines in a basket (0 for single products). */
  itemCount: number;
  closesAt: Date;
  /** The recommended open group's offer. */
  offer: GroupOffer;
  /** Search rows: open groups, buyers across them, lowest current price. */
  groupCount: number;
  buyers: number;
  fromUnitPrice: number;
};

/** Home (B3.1): one card per active product with an open group, plus the buyer's own groups and savings. 2 queries. */
export async function homeData(buyerId: string | null, now = new Date()) {
  if (buyerId) await settleDueGroups(buyerId, now);
  const [products, buyer, stores] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], // stable order for products created together
      select: {
        id: true,
        name: true,
        category: true,
        kind: true,
        _count: { select: { basketItems: true } },
        priceTiers: tiersAsc,
        groups: { ...openGroups(now), select: { ...openGroups(now).select, _count: { select: { commitments: { where: { status: "ACTIVE" } } } } } },
      },
    }),
    buyerId
      ? db.user.findUnique({
          where: { id: buyerId },
          select: {
            preferences: true,
            commitments: {
              where: { status: { in: ["ACTIVE", "AWAITING_PICKUP", "COLLECTED", "EXPIRED_PAID"] } },
              orderBy: { createdAt: "desc" },
              select: {
                status: true,
                quantity: true,
                finalUnitPrice: true,
                group: { select: { id: true, opensAt: true, closesAt: true, totalQty: true, joinEvents: { select: { quantity: true, createdAt: true } } } },
                product: { select: { id: true, name: true, priceTiers: tiersAsc } },
              },
            },
          },
        })
      : null,
    storesForHome(now),
  ]);

  const cards: DealCard[] = [];
  for (const p of products) {
    const g = recommendedGroup(p.priceTiers, p.groups, now);
    if (!g) continue;
    const offers = p.groups.map((x) => offerFor(p.priceTiers, x, now));
    cards.push({
      productId: p.id,
      name: p.name,
      category: p.category,
      kind: p.kind,
      itemCount: p._count.basketItems,
      closesAt: g.closesAt,
      offer: offerFor(p.priceTiers, g, now),
      groupCount: p.groups.length,
      buyers: p.groups.reduce((sum, x) => sum + x._count.commitments, 0),
      fromUnitPrice: Math.min(...offers.map((o) => o.currentUnitPrice)),
    });
  }

  const commitments = buyer?.commitments ?? [];
  const myGroups = commitments
    .filter((c) => c.status === "ACTIVE")
    .map((c) => ({ productId: c.product.id, name: c.product.name, closesAt: c.group.closesAt, offer: offerFor(c.product.priceTiers, c.group, now) }));
  // BL §6: savings = quantity × (base price − final unit price), for settled orders only.
  const totalSavings = commitments
    .filter((c) => c.status !== "ACTIVE" && c.finalUnitPrice !== null)
    .reduce((sum, c) => sum + savings(c.product.priceTiers, c.quantity, c.finalUnitPrice!), 0);

  return { cards, myGroups, totalSavings, stores, preferences: (buyer?.preferences ?? {}) as { address?: string; radiusKm?: number } };
}

export type StoreCard = {
  id: string;
  name: string;
  address: string;
  openingHours: string;
  openGroupCount: number;
};

/** Home rail: pickup locations that still have an open group. */
export async function storesForHome(now = new Date()): Promise<StoreCard[]> {
  const locations = await db.pickupLocation.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      openingHours: true,
      products: {
        where: { status: "ACTIVE" },
        select: { groups: { where: { status: "OPEN", closesAt: { gt: now } }, select: { id: true } } },
      },
    },
  });
  return locations
    .map((l) => ({
      id: l.id,
      name: l.name,
      address: l.address,
      openingHours: l.openingHours,
      openGroupCount: l.products.reduce((sum, p) => sum + p.groups.length, 0),
    }))
    .filter((l) => l.openGroupCount > 0);
}

/** Store page (B3.6): one pickup location and its open-group products. */
export async function storePageData(locationId: string, now = new Date()) {
  const location = await db.pickupLocation.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      address: true,
      openingHours: true,
      products: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          category: true,
          kind: true,
          _count: { select: { basketItems: true } },
          priceTiers: tiersAsc,
          groups: { ...openGroups(now), select: { ...openGroups(now).select, _count: { select: { commitments: { where: { status: "ACTIVE" } } } } } },
        },
      },
    },
  });
  if (!location) return null;

  const cards: DealCard[] = [];
  for (const p of location.products) {
    const g = recommendedGroup(p.priceTiers, p.groups, now);
    if (!g) continue;
    const offers = p.groups.map((x) => offerFor(p.priceTiers, x, now));
    cards.push({
      productId: p.id,
      name: p.name,
      category: p.category,
      kind: p.kind,
      itemCount: p._count.basketItems,
      closesAt: g.closesAt,
      offer: offerFor(p.priceTiers, g, now),
      groupCount: p.groups.length,
      buyers: p.groups.reduce((sum, x) => sum + x._count.commitments, 0),
      fromUnitPrice: Math.min(...offers.map((o) => o.currentUnitPrice)),
    });
  }
  const nextClose = cards.reduce<Date | null>((min, c) => (!min || c.closesAt < min ? c.closesAt : min), null);
  return {
    store: { id: location.id, name: location.name, address: location.address, openingHours: location.openingHours },
    openGroupCount: cards.reduce((sum, c) => sum + c.groupCount, 0),
    nextClose,
    cards,
  };
}

export type PoolGroup = { id: string; segment: Segment | null; closesAt: Date; buyers: number; offer: GroupOffer };

/** Pool page (B3.3): product, its open groups, and what this buyer can do. 4 queries in parallel. */
export async function productData(productId: string, buyerId: string | null, now = new Date()) {
  const [product, balance, active, usage] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        stockTotal: true,
        perBuyerCap: true,
        kind: true,
        basketItems: { orderBy: { position: "asc" }, select: { name: true, quantity: true } },
        priceTiers: tiersAsc,
        pickupLocation: { select: { name: true, address: true, openingHours: true } },
        groups: {
          ...openGroups(now),
          select: { ...openGroups(now).select, _count: { select: { commitments: { where: { status: "ACTIVE" } } } } },
        },
      },
    }),
    buyerId ? db.ledgerEntry.aggregate({ _sum: { amount: true }, where: { account: { ownerUserId: buyerId, type: "BUYER_AVAILABLE" } } }) : null,
    buyerId
      ? db.commitment.findFirst({ where: { buyerId, productId, status: "ACTIVE" }, select: { id: true, groupId: true, quantity: true, reservedAmount: true } })
      : null,
    db.commitment.groupBy({ by: ["status"], where: { productId }, _sum: { quantity: true } }),
  ]);
  if (!product) return null;
  const { groups: groupRows, ...info } = product;

  const recommended = recommendedGroup(info.priceTiers, groupRows, now);
  const segments = new Map(segmentGroups(groupRows).map((s) => [s.group.id, s.segment]));
  const groups: PoolGroup[] = [...groupRows]
    .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime())
    .map((g) => ({ id: g.id, segment: segments.get(g.id) ?? null, closesAt: g.closesAt, buyers: g._count.commitments, offer: offerFor(info.priceTiers, g, now) }));

  return {
    product: info,
    groups,
    recommendedGroupId: recommended?.id ?? null,
    availableBalance: balance?._sum.amount ?? 0,
    activeCommitment: active,
    stockRemaining: stockRemaining(info.stockTotal, usage.map((u) => ({ status: u.status, quantity: u._sum.quantity ?? 0 }))),
  };
}

/** Polled by the client (TanStack Query) for live group progress. 1 query. */
export async function groupProgress(groupId: string, now = new Date()) {
  const g = await db.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      status: true,
      opensAt: true,
      closesAt: true,
      totalQty: true,
      joinEvents: { select: { quantity: true, createdAt: true } },
      product: { select: { priceTiers: tiersAsc } },
      _count: { select: { commitments: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!g) return null;
  return { status: g.status, buyers: g._count.commitments, offer: offerFor(g.product.priceTiers, g, now) };
}
export type GroupProgress = NonNullable<Awaited<ReturnType<typeof groupProgress>>>;

/**
 * Demo assumption (no scheduler in the hackathon build): groups the buyer is in that are past
 * closing are settled when they open their profile. settleGroup is idempotent and locked.
 */
async function settleDueGroups(buyerId: string, now: Date) {
  const due = await db.group.findMany({
    where: { status: "OPEN", closesAt: { lte: now }, commitments: { some: { buyerId, status: "ACTIVE" } } },
    select: { id: true },
  });
  for (const g of due) await settleGroup({ groupId: g.id, now });
}

const HISTORY_LIMIT = 20;

/** Profile (B5.1): wallet balances, available-balance history, and orders. ≤ 5 queries (+ due settlements). */
export async function profileData(buyerId: string, now = new Date()) {
  await settleDueGroups(buyerId, now);
  const [user, balances, history, origin] = await Promise.all([
    db.user.findUnique({
      where: { id: buyerId },
      select: {
        name: true,
        email: true,
        preferences: true,
        commitments: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            quantity: true,
            committedUnitPrice: true,
            reservedAmount: true,
            finalUnitPrice: true,
            amountCharged: true,
            pickupDeadline: true,
            group: { select: { id: true, status: true, durationHours: true, opensAt: true, closesAt: true, totalQty: true, joinEvents: { select: { quantity: true, createdAt: true } } } },
            product: { select: { id: true, name: true, priceTiers: tiersAsc, pickupLocation: { select: { name: true, address: true, openingHours: true } } } },
          },
        },
      },
    }),
    db.$queryRaw<{ type: string; total: bigint }[]>`
      SELECT a.type, COALESCE(SUM(e.amount), 0)::bigint AS total
      FROM "LedgerAccount" a JOIN "LedgerEntry" e ON e."accountId" = a.id
      WHERE a."ownerUserId" = ${buyerId} AND a.type IN ('BUYER_AVAILABLE', 'BUYER_RESERVED')
      GROUP BY a.type`,
    db.ledgerEntry.findMany({
      where: { account: { ownerUserId: buyerId, type: "BUYER_AVAILABLE" } },
      orderBy: { transaction: { createdAt: "desc" } },
      take: HISTORY_LIMIT,
      select: { id: true, amount: true, transaction: { select: { type: true, createdAt: true, commitment: { select: { product: { select: { name: true } } } } } } },
    }),
    requestOrigin(),
  ]);
  if (!user) return null;

  const sum = (type: string) => Number(balances.find((b) => b.type === type)?.total ?? 0);
  const orders = await Promise.all(
    user.commitments.map(async (c) => {
      const base = { id: c.id, status: c.status, quantity: c.quantity, product: c.product, reservedAmount: c.reservedAmount, amountCharged: c.amountCharged, pickupDeadline: c.pickupDeadline };
      if (c.status === "ACTIVE") {
        const cancel = evaluateCancel({ commitmentStatus: c.status, group: c.group, tiers: c.product.priceTiers, now });
        return { ...base, closesAt: c.group.closesAt, offer: offerFor(c.product.priceTiers, c.group, now), pickup: null, cancelLockedBy: cancel.allowed ? null : cancel.reason };
      }
      if (c.status === "AWAITING_PICKUP") {
        const code = pickupCodeFor(c.id);
        const url = `${origin}/seller/pickup?order=${encodeURIComponent(c.id)}&code=${code}`;
        const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
        return { ...base, closesAt: c.group.closesAt, offer: null, pickup: { code, url, qrSvg }, cancelLockedBy: null };
      }
      return { ...base, closesAt: c.group.closesAt, offer: null, pickup: null, cancelLockedBy: null };
    }),
  );

  // "Gata de ridicare" first (requested 2026-11-07), then the rest newest first.
  orders.sort((a, b) => Number(b.status === "AWAITING_PICKUP") - Number(a.status === "AWAITING_PICKUP"));

  return {
    user: { name: user.name, email: user.email, preferences: (user.preferences ?? {}) as { firstName?: string; lastName?: string; phone?: string } },
    wallet: { available: sum("BUYER_AVAILABLE"), reserved: sum("BUYER_RESERVED") },
    history: history.map((e) => ({ id: e.id, amount: e.amount, type: e.transaction.type, createdAt: e.transaction.createdAt, productName: e.transaction.commitment?.product.name ?? null })),
    orders,
  };
}
export type ProfileOrder = NonNullable<Awaited<ReturnType<typeof profileData>>>["orders"][number];
