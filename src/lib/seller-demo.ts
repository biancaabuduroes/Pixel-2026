// Seller dashboard demo data (feat/seller-dashboard, not merged; decision 2026-11-07).
// The inputs below are fixed mock data; every derived number (current price, units to the next
// tier, unlocked tiers, commission, stock) comes from the real rules in src/domain.
import { stockRemaining } from "@/domain/groups";
import { formatRon } from "@/domain/money";
import { isFirstDiscountUnlocked, nextTier, tierPrice, type PriceTier } from "@/domain/pricing";
import { splitPayout } from "@/domain/wallet";
import type { TierRowState } from "@/components/ds/price-tier-list";

const COMMISSION_BPS = 500; // 5 % (APP_PLAN §5 default)

// imageUrl: /products/<id>.webp once a photo exists (docs/PRODUCT_IMAGES.md); null → bag-icon fallback.
type DemoProduct = { id: string; name: string; imageUrl: string | null; stockTotal: number; perBuyerCap: number; tiers: PriceTier[]; durationsHours: number[] };
type DemoGroup = { productId: string; durationHours: number; totalQty: number; buyers: number; closesInMinutes: number };
type DemoOrder = { buyer: string; productId: string; quantity: number; finalUnitPrice: number; status: "AWAITING_PICKUP" | "COLLECTED"; deadline: string };

export const SELLER = { name: "Brutăria Ana", address: "Bulevardul Lascăr Catargiu 47, București" };

const PRODUCTS: DemoProduct[] = [
  { id: "paine", name: "Pâine cu maia", imageUrl: null, stockTotal: 200, perBuyerCap: 5, durationsHours: [24, 168], tiers: [{ minQty: 1, unitPrice: 2000 }, { minQty: 30, unitPrice: 1800 }, { minQty: 60, unitPrice: 1600 }] },
  { id: "ulei", name: "Ulei de măsline extravirgin 1 L", imageUrl: null, stockTotal: 120, perBuyerCap: 3, durationsHours: [72, 168], tiers: [{ minQty: 1, unitPrice: 6500 }, { minQty: 20, unitPrice: 5900 }, { minQty: 50, unitPrice: 5400 }] },
  { id: "cafea", name: "Cafea boabe 1 kg", imageUrl: null, stockTotal: 150, perBuyerCap: 4, durationsHours: [168], tiers: [{ minQty: 1, unitPrice: 8900 }, { minQty: 25, unitPrice: 7900 }, { minQty: 60, unitPrice: 7400 }] },
];

const GROUPS: DemoGroup[] = [
  { productId: "paine", durationHours: 24, totalQty: 34, buyers: 12, closesInMinutes: 5 * 60 + 12 },
  { productId: "paine", durationHours: 168, totalQty: 18, buyers: 7, closesInMinutes: 3 * 24 * 60 + 2 * 60 },
  { productId: "ulei", durationHours: 72, totalQty: 22, buyers: 9, closesInMinutes: 28 * 60 },
  { productId: "ulei", durationHours: 168, totalQty: 8, buyers: 4, closesInMinutes: 5 * 24 * 60 },
  { productId: "cafea", durationHours: 168, totalQty: 61, buyers: 19, closesInMinutes: 2 * 24 * 60 + 7 * 60 },
];

const ORDERS: DemoOrder[] = [
  { buyer: "Ioana P.", productId: "paine", quantity: 3, finalUnitPrice: 1800, status: "AWAITING_PICKUP", deadline: "14.11.2026" },
  { buyer: "Mihai D.", productId: "ulei", quantity: 2, finalUnitPrice: 5900, status: "AWAITING_PICKUP", deadline: "13.11.2026" },
  { buyer: "Elena S.", productId: "cafea", quantity: 4, finalUnitPrice: 7400, status: "AWAITING_PICKUP", deadline: "12.11.2026" },
  { buyer: "Andrei M.", productId: "paine", quantity: 5, finalUnitPrice: 1600, status: "COLLECTED", deadline: "06.11.2026" },
  { buyer: "Radu C.", productId: "cafea", quantity: 3, finalUnitPrice: 7400, status: "COLLECTED", deadline: "05.11.2026" },
  { buyer: "Ana V.", productId: "ulei", quantity: 3, finalUnitPrice: 5400, status: "COLLECTED", deadline: "05.11.2026" },
];

const product = (id: string) => PRODUCTS.find((p) => p.id === id)!;

export const durationLabel = (hours: number) => (hours % 24 === 0 ? (hours === 24 ? "24 h" : `${hours / 24} zile`) : `${hours} h`);

export function timeLeft(minutes: number): string {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return h > 0 ? `${d} z ${h} h` : `${d} ${d === 1 ? "zi" : "zile"}`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

/** "1–29 unități" style ranges for a tier ladder. */
function tierRows(tiers: PriceTier[], qty: number): { range: string; price: string; state: TierRowState }[] {
  const currentPrice = tierPrice(tiers, qty);
  const next = nextTier(tiers, qty)?.tier;
  return tiers.map((t, i) => {
    const end = tiers[i + 1]?.minQty;
    const range = end ? `${t.minQty}–${end - 1} unități` : `${t.minQty}+ unități`;
    const state: TierRowState = t.unitPrice === currentPrice ? "current" : t === next ? "next" : t.unitPrice > currentPrice ? "reached" : "locked";
    return { range, price: formatRon(t.unitPrice), state };
  });
}

export function sellerDashboard() {
  const groups = GROUPS.map((g) => {
    const p = product(g.productId);
    const next = nextTier(p.tiers, g.totalQty);
    return {
      ...g,
      productName: p.name,
      productImageUrl: p.imageUrl,
      currentPrice: tierPrice(p.tiers, g.totalQty),
      unlocked: isFirstDiscountUnlocked(p.tiers, g.totalQty),
      next: next ? { minQty: next.tier.minQty, unitsMissing: next.unitsMissing, unitPrice: next.tier.unitPrice } : null,
      topTierMinQty: p.tiers[p.tiers.length - 1].minQty,
    };
  }).sort((a, b) => a.closesInMinutes - b.closesInMinutes);

  const unitsByDuration = new Map<number, number>();
  for (const g of GROUPS) unitsByDuration.set(g.durationHours, (unitsByDuration.get(g.durationHours) ?? 0) + g.totalQty);
  const popularDuration = [...unitsByDuration.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const orders = ORDERS.map((o) => ({ ...o, productName: product(o.productId).name, amount: o.quantity * o.finalUnitPrice }));
  const collected = orders.filter((o) => o.status === "COLLECTED");
  const split = collected.map((o) => splitPayout(o.amount, COMMISSION_BPS));
  const earnings = {
    sales: collected.reduce((s, o) => s + o.amount, 0),
    commission: split.reduce((s, x) => s + x.commission, 0),
    net: split.reduce((s, x) => s + x.sellerAmount, 0),
  };

  const products = PRODUCTS.map((p) => {
    const best = GROUPS.filter((g) => g.productId === p.id).sort((a, b) => b.totalQty - a.totalQty)[0];
    const used = [...GROUPS.filter((g) => g.productId === p.id).map((g) => ({ quantity: g.totalQty, status: "ACTIVE" as const })), ...ORDERS.filter((o) => o.productId === p.id).map((o) => ({ quantity: o.quantity, status: o.status }))];
    return { ...p, bestGroupQty: best?.totalQty ?? 0, stockLeft: stockRemaining(p.stockTotal, used), rows: tierRows(p.tiers, best?.totalQty ?? 0) };
  });

  return {
    stats: {
      committedUnits: GROUPS.reduce((s, g) => s + g.totalQty, 0),
      activeGroups: GROUPS.length,
      unlockedTiers: groups.filter((g) => g.unlocked).length,
      popularDuration: durationLabel(popularDuration),
    },
    groups,
    toPickUp: orders.filter((o) => o.status === "AWAITING_PICKUP"),
    earnings,
    products,
  };
}
