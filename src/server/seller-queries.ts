import { stockRemaining } from "@/domain/groups";
import { nextTier, tierPrice } from "@/domain/pricing";
import {
  dailySeries,
  groupFinancials,
  groupInsight,
  isClosingSoon,
  percentChange,
  periodWindow,
  potentialSales,
  productSales,
  sellerGroupStatus,
  sellerInsights,
  SOLD_COMMITMENT_STATUSES,
  stockStatus,
  stockUtilizationPct,
  sumSold,
  type SellerGroupStatus,
  type SoldCommitment,
} from "@/domain/seller";
import { parseRateToBasisPoints, splitPayout } from "@/domain/wallet";
import { CATEGORIES } from "@/lib/onboarding";
import { db } from "@/lib/db";
import { settleGroup } from "./settlement";

const tiersAsc = { orderBy: { minQty: "asc" as const } };
const DEFAULT_COMMISSION = "0.05";
const SOLD = [...SOLD_COMMITMENT_STATUSES] as Array<"AWAITING_PICKUP" | "COLLECTED" | "EXPIRED_PAID">;

async function commissionBps(): Promise<number> {
  const setting = await db.platformSetting.findUnique({ where: { key: "commissionRate" } });
  return parseRateToBasisPoints(setting?.value ?? DEFAULT_COMMISSION);
}

/**
 * Demo assumption (no scheduler): settle the seller's groups that are past closing when
 * they open a seller page. settleGroup is idempotent and locked.
 */
async function settleDueSellerGroups(sellerId: string, now: Date) {
  const due = await db.group.findMany({
    where: { status: "OPEN", closesAt: { lte: now }, product: { sellerId } },
    select: { id: true },
  });
  for (const g of due) await settleGroup({ groupId: g.id, now });
}

function categoryLabel(value: string | null): string {
  if (!value) return "Fără categorie";
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function durationLabel(hours: number): string {
  if (hours % 24 === 0) return hours === 24 ? "24 h" : `${hours / 24} zile`;
  return `${hours} h`;
}

function mapSold(
  rows: readonly {
    quantity: number;
    amountCharged: number | null;
    status: string;
    productId: string;
    group: { closesAt: Date };
  }[],
): SoldCommitment[] {
  return rows
    .filter((c) => c.amountCharged !== null && SOLD_COMMITMENT_STATUSES.has(c.status as SoldCommitment["status"]))
    .map((c) => ({
      quantity: c.quantity,
      amountCharged: c.amountCharged!,
      status: c.status as SoldCommitment["status"],
      settledAt: c.group.closesAt,
      productId: c.productId,
    }));
}

export type SellerPeriod = 7 | 30 | 90;

export async function sellerDashboardData(sellerId: string, now = new Date(), periodDays: SellerPeriod = 30) {
  await settleDueSellerGroups(sellerId, now);
  const { start, end, previousStart } = periodWindow(now, periodDays);
  const commissionRateBps = await commissionBps();

  const [profile, products, soldRows, openGroups] = await Promise.all([
    db.user.findUnique({
      where: { id: sellerId },
      select: { name: true, sellerProfile: { select: { businessName: true } } },
    }),
    db.product.findMany({
      where: { sellerId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        kind: true,
        stockTotal: true,
        status: true,
        priceTiers: tiersAsc,
        commitments: { select: { quantity: true, status: true } },
        groups: {
          where: { status: "OPEN", closesAt: { gt: now } },
          select: { id: true, totalQty: true, closesAt: true, durationHours: true },
        },
      },
    }),
    db.commitment.findMany({
      where: {
        status: { in: SOLD },
        product: { sellerId },
        group: { closesAt: { gte: previousStart, lt: end } },
      },
      select: {
        quantity: true,
        amountCharged: true,
        status: true,
        productId: true,
        group: { select: { closesAt: true, finalUnitPrice: true, status: true, totalQty: true } },
        product: { select: { name: true, category: true, priceTiers: tiersAsc } },
      },
    }),
    db.group.findMany({
      where: { status: "OPEN", closesAt: { gt: now }, product: { sellerId } },
      select: {
        id: true,
        totalQty: true,
        closesAt: true,
        opensAt: true,
        durationHours: true,
        status: true,
        product: { select: { id: true, name: true, priceTiers: tiersAsc } },
        _count: { select: { commitments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { closesAt: "asc" },
    }),
  ]);

  if (!profile) return null;

  const sold = mapSold(soldRows);
  const current = sumSold(sold, start, end);
  const previous = sumSold(sold, previousStart, start);
  const series = dailySeries(sold, start, end);
  const byProduct = productSales(sold, start, end);

  const catalog = products.map((p) => {
    const remaining = stockRemaining(
      p.stockTotal,
      p.commitments.map((c) => ({ quantity: c.quantity, status: c.status })),
    );
    const committedUnits = p.groups.reduce((s, g) => s + g.totalQty, 0);
    const bestOpen = [...p.groups].sort((a, b) => b.totalQty - a.totalQty)[0];
    const tiers = p.priceTiers;
    const currentQty = bestOpen?.totalQty ?? 0;
    const next = nextTier(tiers, currentQty);
    const openUnitPrice = bestOpen ? tierPrice(tiers, bestOpen.totalQty) : null;
    const sales = byProduct.get(p.id) ?? { revenue: 0, units: 0, orderCount: 0 };
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      categoryLabel: categoryLabel(p.category),
      kind: p.kind,
      stockTotal: p.stockTotal,
      stockRemaining: remaining,
      stockStatus: stockStatus(remaining, p.stockTotal),
      utilizationPct: stockUtilizationPct(remaining, p.stockTotal),
      committedUnits,
      soldUnits: sales.units,
      revenue: sales.revenue,
      openGroups: p.groups.length,
      currentUnitPrice: openUnitPrice ?? tierPrice(tiers, 1),
      baseUnitPrice: tierPrice(tiers, 1),
      bestUnitPrice: tiers[tiers.length - 1]!.unitPrice,
      next: next ? { minQty: next.tier.minQty, unitPrice: next.tier.unitPrice, unitsMissing: next.unitsMissing } : null,
      openUnitPrice,
      tiers,
    };
  });

  const potential = potentialSales({
    products: catalog.map((p) => ({
      productId: p.id,
      stockRemaining: p.stockRemaining,
      committedUnits: p.committedUnits,
      openUnitPrice: p.openUnitPrice,
      tiers: p.tiers,
    })),
  });

  const stockTotals = {
    remaining: catalog.reduce((s, p) => s + p.stockRemaining, 0),
    total: catalog.reduce((s, p) => s + p.stockTotal, 0),
    productCount: catalog.filter((p) => p.stockRemaining > 0).length,
    criticalCount: catalog.filter((p) => p.stockStatus === "CRITICAL").length,
    lowCount: catalog.filter((p) => p.stockStatus === "LOW").length,
    utilizationPct: stockUtilizationPct(
      catalog.reduce((s, p) => s + p.stockRemaining, 0),
      catalog.reduce((s, p) => s + p.stockTotal, 0),
    ),
  };

  // Settled groups in the period for KPI + insights.
  const settledInPeriod = await db.group.findMany({
    where: {
      status: "SETTLED",
      closesAt: { gte: start, lt: end },
      product: { sellerId },
    },
    select: {
      id: true,
      totalQty: true,
      finalUnitPrice: true,
      closesAt: true,
      durationHours: true,
      product: { select: { id: true, name: true, priceTiers: tiersAsc } },
      _count: { select: { commitments: { where: { status: { in: SOLD } } } } },
    },
    orderBy: { closesAt: "desc" },
  });

  const poolStats = {
    won: 0,
    active: openGroups.length,
    nearTier: 0,
    noParticipants: 0,
  };
  for (const g of openGroups) {
    const status = sellerGroupStatus({
      group: { status: g.status, durationHours: g.durationHours, opensAt: g.opensAt, closesAt: g.closesAt, totalQty: g.totalQty },
      tiers: g.product.priceTiers,
    });
    if (status === "NEAR_TIER") poolStats.nearTier += 1;
  }
  const recentWon = [];
  for (const g of settledInPeriod) {
    const status = sellerGroupStatus({
      group: { status: "SETTLED", durationHours: g.durationHours, opensAt: g.closesAt, closesAt: g.closesAt, totalQty: g.totalQty },
      tiers: g.product.priceTiers,
      finalUnitPrice: g.finalUnitPrice,
    });
    if (status === "WON") poolStats.won += 1;
    if (status === "NO_PARTICIPANTS") poolStats.noParticipants += 1;
    if (status === "WON" || status === "CLOSED_BASE_PRICE") {
      recentWon.push({
        id: g.id,
        productName: g.product.name,
        units: g.totalQty,
        buyers: g._count.commitments,
        finalUnitPrice: g.finalUnitPrice,
        baseUnitPrice: tierPrice(g.product.priceTiers, 1),
        revenue: soldRows
          .filter((c) => c.productId === g.product.id && c.group.closesAt.getTime() === g.closesAt.getTime())
          .reduce((s, c) => s + (c.amountCharged ?? 0), 0),
        closesAt: g.closesAt,
        status,
        durationLabel: durationLabel(g.durationHours),
      });
    }
  }

  // Revenue per settled group (more accurate than matching closesAt equality).
  const revenueByGroup = new Map<string, number>();
  const soldWithGroup = await db.commitment.findMany({
    where: { status: { in: SOLD }, groupId: { in: settledInPeriod.map((g) => g.id) } },
    select: { groupId: true, amountCharged: true },
  });
  for (const c of soldWithGroup) {
    revenueByGroup.set(c.groupId, (revenueByGroup.get(c.groupId) ?? 0) + (c.amountCharged ?? 0));
  }
  for (const row of recentWon) {
    row.revenue = revenueByGroup.get(row.id) ?? row.revenue;
  }

  const earningsCollected = sold
    .filter((c) => c.status === "COLLECTED" || c.status === "EXPIRED_PAID")
    .reduce((s, c) => s + c.amountCharged, 0);
  // Approximate net for the period from charged amounts (commission applied on payout).
  const { commission, sellerAmount } = splitPayout(earningsCollected, commissionRateBps);

  const top = [...byProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0];
  const topProduct =
    top && current.revenue > 0
      ? {
          name: products.find((p) => p.id === top[0])?.name ?? top[0],
          revenueSharePct: Math.round((top[1].revenue * 100) / current.revenue),
        }
      : null;

  const categoryNow = new Map<string, number>();
  const categoryPrev = new Map<string, number>();
  for (const c of sold) {
    const cat = products.find((p) => p.id === c.productId)?.category ?? null;
    const label = categoryLabel(cat);
    const t = c.settledAt.getTime();
    if (t >= start.getTime() && t < end.getTime()) categoryNow.set(label, (categoryNow.get(label) ?? 0) + c.amountCharged);
    if (t >= previousStart.getTime() && t < start.getTime()) categoryPrev.set(label, (categoryPrev.get(label) ?? 0) + c.amountCharged);
  }
  let risingCategory: { name: string; changePct: number } | null = null;
  for (const [name, revenue] of categoryNow) {
    const change = percentChange(revenue, categoryPrev.get(name) ?? 0);
    if (change !== null && change > (risingCategory?.changePct ?? 0)) risingCategory = { name, changePct: change };
  }

  const insights = sellerInsights({
    periodDays,
    settledGroupCount: settledInPeriod.length,
    topProduct,
    risingCategory,
    potentialUnits: potential.units,
    potentialRevenue: potential.revenueEstimate,
    criticalStock: catalog.filter((p) => p.stockStatus === "CRITICAL").map((p) => ({ name: p.name, remaining: p.stockRemaining })),
    nearTierGroups: openGroups
      .map((g) => {
        const next = nextTier(g.product.priceTiers, g.totalQty);
        const status = sellerGroupStatus({
          group: { status: g.status, durationHours: g.durationHours, opensAt: g.opensAt, closesAt: g.closesAt, totalQty: g.totalQty },
          tiers: g.product.priceTiers,
        });
        return status === "NEAR_TIER" && next
          ? { productName: g.product.name, unitsMissing: next.unitsMissing }
          : null;
      })
      .filter((x): x is { productName: string; unitsMissing: number } => x !== null),
    wonPools: poolStats.won,
    activePools: poolStats.active,
  });

  return {
    seller: {
      name: profile.sellerProfile?.businessName ?? profile.name,
    },
    periodDays,
    kpis: {
      stock: stockTotals,
      sales: {
        ...current,
        changePct: percentChange(current.revenue, previous.revenue),
        previousRevenue: previous.revenue,
      },
      potential,
      pools: poolStats,
    },
    catalog: catalog.map(({ tiers: _t, openUnitPrice: _o, ...rest }) => rest),
    series,
    productPerformance: catalog
      .map((p) => ({
        id: p.id,
        name: p.name,
        revenue: p.revenue,
        units: p.soldUnits,
        orderCount: byProduct.get(p.id)?.orderCount ?? 0,
      }))
      .filter((p) => p.revenue > 0 || p.units > 0)
      .sort((a, b) => b.revenue - a.revenue),
    insights,
    recentWon: recentWon.slice(0, 6),
    earnings: { sales: earningsCollected, commission, net: sellerAmount },
    awaitingPickupCount: await db.commitment.count({
      where: { status: "AWAITING_PICKUP", product: { sellerId } },
    }),
  };
}

export type SellerDashboardData = NonNullable<Awaited<ReturnType<typeof sellerDashboardData>>>;

export interface SellerGroupCard {
  id: string;
  productId: string;
  productName: string;
  durationHours: number;
  durationLabel: string;
  buyers: number;
  totalQty: number;
  opensAt: Date;
  closesAt: Date;
  status: SellerGroupStatus;
  closingSoon: boolean;
  currentUnitPrice: number;
  baseUnitPrice: number;
  next: { minQty: number; unitPrice: number; unitsMissing: number } | null;
  bestUnitPrice: number;
  finalUnitPrice: number | null;
  revenue: number;
}

export async function sellerGroupsData(sellerId: string, now = new Date()) {
  await settleDueSellerGroups(sellerId, now);
  const commissionRateBps = await commissionBps();

  const [groups, earningsRows, awaitingPickupCount] = await Promise.all([
    db.group.findMany({
      where: { product: { sellerId }, status: { in: ["OPEN", "SETTLED"] } },
      orderBy: { closesAt: "desc" },
      select: {
        id: true,
        status: true,
        durationHours: true,
        opensAt: true,
        closesAt: true,
        totalQty: true,
        finalUnitPrice: true,
        product: { select: { id: true, name: true, priceTiers: tiersAsc } },
        _count: { select: { commitments: { where: { status: { in: ["ACTIVE", ...SOLD] } } } } },
        commitments: {
          where: { status: { in: SOLD } },
          select: { amountCharged: true },
        },
      },
    }),
    db.commitment.findMany({
      where: { status: { in: ["COLLECTED", "EXPIRED_PAID"] }, product: { sellerId } },
      select: { amountCharged: true },
    }),
    db.commitment.count({ where: { status: "AWAITING_PICKUP", product: { sellerId } } }),
  ]);

  const cards: SellerGroupCard[] = groups.map((g) => {
    const tiers = g.product.priceTiers;
    const status = sellerGroupStatus({
      group: {
        status: g.status,
        durationHours: g.durationHours,
        opensAt: g.opensAt,
        closesAt: g.closesAt,
        totalQty: g.totalQty,
      },
      tiers,
      finalUnitPrice: g.finalUnitPrice,
    });
    const next = g.status === "OPEN" ? nextTier(tiers, g.totalQty) : null;
    return {
      id: g.id,
      productId: g.product.id,
      productName: g.product.name,
      durationHours: g.durationHours,
      durationLabel: durationLabel(g.durationHours),
      buyers: g._count.commitments,
      totalQty: g.totalQty,
      opensAt: g.opensAt,
      closesAt: g.closesAt,
      status,
      closingSoon: g.status === "OPEN" && isClosingSoon(g.closesAt, now),
      currentUnitPrice: g.status === "OPEN" ? tierPrice(tiers, g.totalQty) : (g.finalUnitPrice ?? tierPrice(tiers, g.totalQty)),
      baseUnitPrice: tierPrice(tiers, 1),
      next: next ? { minQty: next.tier.minQty, unitPrice: next.tier.unitPrice, unitsMissing: next.unitsMissing } : null,
      bestUnitPrice: tiers[tiers.length - 1]!.unitPrice,
      finalUnitPrice: g.finalUnitPrice,
      revenue: g.commitments.reduce((s, c) => s + (c.amountCharged ?? 0), 0),
    };
  });

  const open = cards.filter((c) => c.status === "ACTIVE" || c.status === "NEAR_TIER" || c.status === "TIER_UNLOCKED" || c.status === "BEST_PRICE");
  const stats = {
    committedUnits: open.reduce((s, c) => s + c.totalQty, 0),
    active: open.length,
    tierUnlocked: cards.filter((c) => c.status === "TIER_UNLOCKED" || c.status === "BEST_PRICE").filter((c) => open.includes(c)).length,
    won: cards.filter((c) => c.status === "WON").length,
    noParticipants: cards.filter((c) => c.status === "NO_PARTICIPANTS").length,
  };

  const sales = earningsRows.reduce((s, c) => s + (c.amountCharged ?? 0), 0);
  const { commission, sellerAmount } = splitPayout(sales, commissionRateBps);

  return {
    stats,
    groups: cards,
    earnings: { sales, commission, net: sellerAmount },
    awaitingPickupCount,
  };
}

export type SellerGroupsData = Awaited<ReturnType<typeof sellerGroupsData>>;

export async function sellerGroupDetails(sellerId: string, groupId: string, now = new Date()) {
  await settleDueSellerGroups(sellerId, now);
  const commissionRateBps = await commissionBps();

  const group = await db.group.findFirst({
    where: { id: groupId, product: { sellerId } },
    select: {
      id: true,
      status: true,
      durationHours: true,
      opensAt: true,
      closesAt: true,
      totalQty: true,
      finalUnitPrice: true,
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          priceTiers: tiersAsc,
          pickupLocation: { select: { name: true, address: true, openingHours: true } },
        },
      },
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
          createdAt: true,
          buyer: { select: { name: true } },
        },
      },
      joinEvents: { select: { quantity: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!group) return null;

  const tiers = group.product.priceTiers;
  const displayStatus = sellerGroupStatus({
    group: {
      status: group.status,
      durationHours: group.durationHours,
      opensAt: group.opensAt,
      closesAt: group.closesAt,
      totalQty: group.totalQty,
    },
    tiers,
    finalUnitPrice: group.finalUnitPrice,
  });
  const next = group.status === "OPEN" ? nextTier(tiers, group.totalQty) : null;
  const financials = groupFinancials({
    tiers,
    commitments: group.commitments,
    finalUnitPrice: group.finalUnitPrice,
    commissionRateBps,
  });

  const pickupCounts = {
    awaiting: group.commitments.filter((c) => c.status === "AWAITING_PICKUP").length,
    collected: group.commitments.filter((c) => c.status === "COLLECTED" || c.status === "EXPIRED_PAID").length,
    active: group.commitments.filter((c) => c.status === "ACTIVE").length,
  };

  const insights = groupInsight({
    productName: group.product.name,
    buyers: financials.buyers || group.commitments.filter((c) => c.status === "ACTIVE").length,
    unitsSold: financials.unitsSold || group.totalQty,
    revenue: financials.revenue || group.commitments.filter((c) => c.status === "ACTIVE").reduce((s, c) => s + c.reservedAmount, 0),
    unlockedDiscount: displayStatus === "TIER_UNLOCKED" || displayStatus === "BEST_PRICE" || displayStatus === "WON",
    nextUnitsMissing: next?.unitsMissing ?? null,
  });

  return {
    id: group.id,
    status: displayStatus,
    groupStatus: group.status,
    durationLabel: durationLabel(group.durationHours),
    opensAt: group.opensAt,
    closesAt: group.closesAt,
    closingSoon: group.status === "OPEN" && isClosingSoon(group.closesAt, now),
    totalQty: group.totalQty,
    buyers: group.commitments.filter((c) => c.status !== "CANCELLED").length,
    currentUnitPrice: group.status === "OPEN" ? tierPrice(tiers, group.totalQty) : (group.finalUnitPrice ?? tierPrice(tiers, 1)),
    next: next ? { minQty: next.tier.minQty, unitPrice: next.tier.unitPrice, unitsMissing: next.unitsMissing } : null,
    tiers: tiers.map((t, i) => ({
      minQty: t.minQty,
      maxQty: i + 1 < tiers.length ? tiers[i + 1]!.minQty - 1 : null,
      unitPrice: t.unitPrice,
      reached: group.totalQty >= t.minQty,
      current: tierPrice(tiers, Math.max(group.totalQty, 1)) === t.unitPrice,
      next: next?.tier.minQty === t.minQty,
    })),
    product: {
      id: group.product.id,
      name: group.product.name,
      description: group.product.description,
      pickupLocation: group.product.pickupLocation,
    },
    financials,
    pickupCounts,
    orders: group.commitments.map((c) => ({
      id: c.id,
      buyerName: c.buyer.name,
      quantity: c.quantity,
      amount: c.amountCharged ?? c.reservedAmount,
      status: c.status,
      createdAt: c.createdAt,
      pickupDeadline: c.pickupDeadline,
    })),
    insights,
    // Open-group "sold" estimate for the headline when still open.
    headlineRevenue:
      group.status === "OPEN"
        ? group.commitments.filter((c) => c.status === "ACTIVE").reduce((s, c) => s + c.quantity * tierPrice(tiers, group.totalQty), 0)
        : financials.revenue,
  };
}

export type SellerGroupDetails = NonNullable<Awaited<ReturnType<typeof sellerGroupDetails>>>;

export { durationLabel };
