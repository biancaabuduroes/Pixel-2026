import type { Metadata } from "next";
import Image from "next/image";
import { PriceTierList } from "@/components/ds/price-tier-list";
import { ProductImage } from "@/components/ds/product-image";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SectionHeader } from "@/components/ds/section-header";
import { SummaryRow } from "@/components/ds/summary-row";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import { durationLabel, SELLER, sellerDashboard, timeLeft } from "@/lib/seller-demo";

export const metadata: Metadata = { title: "Panou vânzător · BunDeals" };

// Seller dashboard for the demo (F7–F9, read-only, desktop web). No login and no other flows
// (decision 2026-11-07); Figma has no dashboard, so it is composed from the Figma tokens/components.
export default function SellerDashboardPage() {
  const { stats, groups, toPickUp, earnings, products } = sellerDashboard();

  return (
    <div className="min-h-dvh bg-bg-subtle">
      <header className="border-b border-border-default bg-bg-surface">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
          <Image src="/figma/bundeals-logo.png" alt="BunDeals" width={120} height={40} priority unoptimized />
          <div className="flex items-center gap-3">
            <span className="label-md text-text-primary">{SELLER.name}</span>
            <Tag tone="info">Mod demo</Tag>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="display-lg text-text-primary">Panou vânzător</h1>
          <p className="body-lg text-text-secondary">{SELLER.address}</p>
        </div>

        {/* F8 statistics */}
        <section aria-label="Statistici" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Unități angajate în grupuri" value={String(stats.committedUnits)} />
          <Stat label="Grupuri active" value={String(stats.activeGroups)} />
          <Stat label="Grupuri cu prag deblocat" value={`${stats.unlockedTiers} / ${stats.activeGroups}`} />
          <Stat label="Durata preferată" value={stats.popularDuration} />
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* F8 groups and demand */}
          <section aria-labelledby="groups-title" className="flex flex-col gap-4">
            <SectionHeader id="groups-title" title="Grupuri active" />
            <ul className="flex flex-col gap-3">
              {groups.map((g) => (
                <li key={`${g.productId}-${g.durationHours}`} className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <ProductImage src={g.productImageUrl} alt={g.productName} variant="thumb" iconSize={24} className="size-14 shrink-0 rounded-md" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="title-md text-text-primary">{g.productName}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag tone="neutral">Grup {durationLabel(g.durationHours)}</Tag>
                        {g.next ? g.unlocked && <Tag tone="success">Prag deblocat</Tag> : <Tag tone="success">Cel mai bun preț</Tag>}
                        <span className="body-sm text-text-secondary">
                          {g.buyers} cumpărători · închide în {timeLeft(g.closesInMinutes)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="display-md text-text-primary">{formatRon(g.currentPrice)}</p>
                      <p className="body-sm text-text-secondary">preț curent / unitate</p>
                    </div>
                  </div>
                  <ProgressBar
                    label={`${g.productName}: ${g.totalQty} din ${g.next?.minQty ?? g.topTierMinQty} unități`}
                    value={g.totalQty}
                    max={g.next?.minQty ?? g.topTierMinQty}
                    tone={g.next ? "brand" : "success"}
                  />
                  <p className="body-sm text-text-secondary">
                    <b className="label-sm text-text-primary">{g.totalQty} unități</b>
                    {g.next ? ` · încă ${g.next.unitsMissing} pentru ${formatRon(g.next.unitPrice)}` : " · toate pragurile deblocate"}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-8">
            {/* F9 earnings */}
            <section aria-labelledby="earnings-title" className="flex flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
              <SectionHeader id="earnings-title" title="Câștiguri" />
              <div>
                <SummaryRow label="Vânzări ridicate" value={formatRon(earnings.sales)} />
                <SummaryRow label="Comision BunDeals (5%)" value={`−${formatRon(earnings.commission)}`} />
                <SummaryRow label="Câștig net" value={formatRon(earnings.net)} emphasis />
              </div>
            </section>

            {/* F9 orders awaiting pickup */}
            <section aria-labelledby="orders-title" className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
              <SectionHeader id="orders-title" title="De ridicat" trailing={<Tag tone="deal">{toPickUp.length} comenzi</Tag>} />
              <ul className="flex flex-col">
                {toPickUp.map((o) => (
                  <li key={o.buyer} className="flex items-start justify-between gap-3 border-b border-border-subtle py-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className="label-md text-text-primary">{o.buyer}</p>
                      <p className="body-sm text-text-secondary">
                        {o.quantity} × {o.productName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="title-md text-text-primary">{formatRon(o.amount)}</p>
                      <p className="body-sm text-text-secondary">până pe {o.deadline}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* F7 products and price tiers (read-only) */}
        <section aria-labelledby="products-title" className="flex flex-col gap-4">
          <SectionHeader id="products-title" title="Produse și praguri de preț" />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
                <ProductImage src={p.imageUrl} alt={p.name} className="mb-1 aspect-[4/3] w-full rounded-md" />
                <h3 className="title-md text-text-primary">{p.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {p.durationsHours.map((h) => (
                    <Tag key={h} tone="neutral">
                      {durationLabel(h)}
                    </Tag>
                  ))}
                  <Tag tone="info">Max. {p.perBuyerCap} / cumpărător</Tag>
                </div>
                <PriceTierList rows={p.rows} />
                <p className="border-t border-border-subtle pt-3 body-sm text-text-secondary">
                  Stoc disponibil: <b className="label-sm text-text-primary">{p.stockLeft}</b> din {p.stockTotal} · cel mai mare grup: {p.bestGroupQty} unități
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
      <span className="label-sm text-text-secondary">{label}</span>
      <span className="display-md text-text-primary">{value}</span>
    </div>
  );
}
