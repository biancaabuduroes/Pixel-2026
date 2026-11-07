import { formatRon, type Bani } from "../money";

/**
 * Seller AI insight templates (BL §11). Built only from computed numbers.
 * Never feeds pricing, settlement or the wallet.
 */
export type InsightCategory = "PERFORMANCE" | "OPPORTUNITY" | "RECOMMENDATION" | "WARNING";

export interface SellerInsight {
  category: InsightCategory;
  /** Short Romanian sentence shown to the seller. */
  text: string;
  /** Supporting metric, e.g. "32%" or "120 unități". */
  metric: string;
  /** Period the metric covers, e.g. "ultimele 30 de zile". */
  period: string;
}

/** Minimum settled groups before we claim performance insights. */
export const MIN_SETTLED_FOR_INSIGHTS = 3;

export const INSIGHT_CATEGORY_LABEL: Record<InsightCategory, string> = {
  PERFORMANCE: "Performanță",
  OPPORTUNITY: "Oportunitate",
  RECOMMENDATION: "Recomandare",
  WARNING: "Atenție",
};

export interface SellerInsightInput {
  periodDays: number;
  settledGroupCount: number;
  /** Top product by revenue in the period, or null. */
  topProduct: { name: string; revenueSharePct: number } | null;
  /** Category with the largest positive revenue change vs previous period, or null. */
  risingCategory: { name: string; changePct: number } | null;
  potentialUnits: number;
  potentialRevenue: Bani;
  /** Products with CRITICAL stock. */
  criticalStock: readonly { name: string; remaining: number }[];
  /** Open groups near the next tier. */
  nearTierGroups: readonly { productName: string; unitsMissing: number }[];
  wonPools: number;
  activePools: number;
}

function periodLabel(days: number): string {
  if (days === 7) return "ultimele 7 zile";
  if (days === 30) return "ultimele 30 de zile";
  if (days === 90) return "ultimele 90 de zile";
  return `ultimele ${days} zile`;
}

/**
 * Builds up to 5 contextual insights. Returns empty when there is too little history
 * and no actionable open-group / stock signal.
 */
export function sellerInsights(input: SellerInsightInput): SellerInsight[] {
  const period = periodLabel(input.periodDays);
  const out: SellerInsight[] = [];

  if (input.settledGroupCount >= MIN_SETTLED_FOR_INSIGHTS && input.topProduct) {
    out.push({
      category: "PERFORMANCE",
      text: `${input.topProduct.name} este produsul tău cu cea mai bună performanță, generând ${input.topProduct.revenueSharePct}% din veniturile din ${period}.`,
      metric: `${input.topProduct.revenueSharePct}%`,
      period,
    });
  }

  if (input.settledGroupCount >= MIN_SETTLED_FOR_INSIGHTS && input.risingCategory && input.risingCategory.changePct > 0) {
    out.push({
      category: "PERFORMANCE",
      text: `Produsele din categoria ${input.risingCategory.name} au înregistrat o creștere de ${input.risingCategory.changePct}% a vânzărilor față de perioada anterioară.`,
      metric: `+${input.risingCategory.changePct}%`,
      period,
    });
  }

  if (input.wonPools > 0 && input.settledGroupCount >= MIN_SETTLED_FOR_INSIGHTS) {
    out.push({
      category: "PERFORMANCE",
      text: `Ai închis ${input.wonPools} ${input.wonPools === 1 ? "grup câștigat" : "grupuri câștigate"} în ${period}, din ${input.settledGroupCount} grupuri decontate.`,
      metric: String(input.wonPools),
      period,
    });
  }

  for (const p of input.criticalStock.slice(0, 2)) {
    out.push({
      category: "WARNING",
      text: `${p.name} are stoc critic: mai rămân ${p.remaining} ${p.remaining === 1 ? "unitate" : "unități"}.`,
      metric: `${p.remaining} unități`,
      period: "stoc curent",
    });
  }

  if (input.potentialUnits > 0) {
    out.push({
      category: "OPPORTUNITY",
      text: `Ai potențialul de a vinde încă ${input.potentialUnits} unități (estimare ${formatRon(input.potentialRevenue)}) prin stocul rămas și grupurile active.`,
      metric: `${input.potentialUnits} unități`,
      period: "stoc curent",
    });
  }

  for (const g of input.nearTierGroups.slice(0, 2)) {
    out.push({
      category: "RECOMMENDATION",
      text: `Grupul pentru ${g.productName} mai are nevoie de ${g.unitsMissing} ${g.unitsMissing === 1 ? "unitate" : "unități"} ca să deblocheze următorul prag.`,
      metric: `${g.unitsMissing} unități`,
      period: "grup activ",
    });
  }

  if (out.length === 0) {
    return [
      {
        category: "RECOMMENDATION",
        text: "Date insuficiente pentru insight-uri. După câteva grupuri încheiate, aici apar recomandări bazate pe vânzările tale.",
        metric: "—",
        period,
      },
    ];
  }

  return out.slice(0, 5);
}

/** Compact pool-level insight from exact settlement numbers. */
export function groupInsight(input: {
  productName: string;
  buyers: number;
  unitsSold: number;
  revenue: Bani;
  unlockedDiscount: boolean;
  nextUnitsMissing: number | null;
}): SellerInsight[] {
  const out: SellerInsight[] = [
    {
      category: "PERFORMANCE",
      text: `Ai generat vânzări de ${formatRon(input.revenue)} prin grupul pentru ${input.productName}.`,
      metric: formatRon(input.revenue),
      period: "acest grup",
    },
    {
      category: "PERFORMANCE",
      text: `Ai vândut ${input.unitsSold} ${input.unitsSold === 1 ? "unitate" : "unități"} către ${input.buyers} ${input.buyers === 1 ? "cumpărător" : "cumpărători"}.`,
      metric: `${input.unitsSold} unități`,
      period: "acest grup",
    },
  ];
  if (input.unlockedDiscount) {
    out.push({
      category: "PERFORMANCE",
      text: "Pragul de reducere a fost deblocat; cumpărătorii plătesc prețul de grup, nu prețul de bază.",
      metric: "prag deblocat",
      period: "acest grup",
    });
  } else if (input.nextUnitsMissing !== null && input.nextUnitsMissing > 0) {
    out.push({
      category: "RECOMMENDATION",
      text: `Pentru următorul grup, mai ai nevoie de ${input.nextUnitsMissing} unități ca să deblochezi următorul prag.`,
      metric: `${input.nextUnitsMissing} unități`,
      period: "următorul grup",
    });
  }
  return out;
}
