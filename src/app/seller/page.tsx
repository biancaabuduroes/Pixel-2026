import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogTable } from "@/components/seller/catalog-table";
import { InsightCard } from "@/components/seller/insight-card";
import { KpiCard } from "@/components/seller/kpi-card";
import { PeriodTabs } from "@/components/seller/period-tabs";
import { SalesChart } from "@/components/seller/sales-chart";
import { StatusTag } from "@/components/seller/status-tag";
import { SectionHeader } from "@/components/ds/section-header";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import { dayLabel, units } from "@/lib/format";
import { sellerDashboardData, type SellerPeriod } from "@/server/seller-queries";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard vânzător · BunDeals" };

export default function SellerDashboardPage(props: PageProps<"/seller">) {
  return (
    <Suspense fallback={<p className="body-md text-text-secondary">Se încarcă panoul…</p>}>
      <Dashboard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/seller">["searchParams"] }) {
  const seller = await currentUser("SELLER");
  if (!seller) return null;
  const params = await searchParams;
  const raw = typeof params.perioada === "string" ? Number(params.perioada) : 30;
  const periodDays = ([7, 30, 90].includes(raw) ? raw : 30) as SellerPeriod;
  const now = new Date();
  const data = await sellerDashboardData(seller.id, now, periodDays);
  if (!data) return <p className="body-md text-text-secondary">Contul de vânzător nu a fost găsit.</p>;

  const change = data.kpis.sales.changePct;
  const changeLabel =
    change === null ? "fără comparație" : change === 0 ? "0% față de perioada anterioară" : `${change > 0 ? "+" : ""}${change}% față de perioada anterioară`;

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="display-lg text-text-primary">Dashboard</h1>
          <p className="body-lg text-text-secondary">{data.seller.name} · performanță și grupuri</p>
        </div>
        <PeriodTabs value={periodDays} />
      </div>

      <section aria-label="Indicatori" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Stocuri"
          value={units(data.kpis.stock.remaining)}
          hint={
            <>
              {data.kpis.stock.productCount} produse cu stoc · utilizare {data.kpis.stock.utilizationPct}%
              {data.kpis.stock.criticalCount > 0 && (
                <>
                  {" · "}
                  <span className="text-text-danger">{data.kpis.stock.criticalCount} critice</span>
                </>
              )}
            </>
          }
          tone={data.kpis.stock.criticalCount > 0 ? "danger" : data.kpis.stock.lowCount > 0 ? "deal" : "default"}
        />
        <KpiCard
          label="Vânzări"
          value={formatRon(data.kpis.sales.revenue)}
          hint={
            <>
              {units(data.kpis.sales.units)} · {changeLabel}
            </>
          }
          tone={change !== null && change > 0 ? "success" : "default"}
        />
        <KpiCard
          label="Unități potențiale"
          value={units(data.kpis.potential.units)}
          hint={
            <>
              Estimare {formatRon(data.kpis.potential.revenueEstimate)} · angajate {units(data.kpis.potential.committedUnits)}
            </>
          }
          tone="deal"
        />
        <KpiCard
          label="Grupuri câștigate"
          value={String(data.kpis.pools.won)}
          hint={
            <>
              {data.kpis.pools.active} active · {data.kpis.pools.nearTier} aproape de prag
            </>
          }
          href="/seller/grupuri"
          tone="success"
        />
      </section>

      <section aria-labelledby="catalog-title" className="flex flex-col gap-4">
        <SectionHeader id="catalog-title" title="Catalog produse & stocuri" />
        <CatalogTable rows={data.catalog} />
      </section>

      <section aria-labelledby="sales-title" className="flex flex-col gap-4">
        <SectionHeader id="sales-title" title="Analiză vânzări" />
        <SalesChart points={data.series} />
        {data.productPerformance.length > 0 && (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.productPerformance.slice(0, 6).map((p) => (
              <li key={p.id} className="rounded-lg border border-border-default bg-bg-surface p-4 shadow-card">
                <p className="title-md text-text-primary">{p.name}</p>
                <p className="body-sm text-text-secondary">
                  {formatRon(p.revenue)} · {units(p.units)} · {p.orderCount} comenzi
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="insights-title" className="flex flex-col gap-4 rounded-lg bg-bg-brand-soft p-5">
        <SectionHeader id="insights-title" title="BunDeals AI Insights" trailing={<Tag tone="brand">Estimări</Tag>} />
        <p className="body-sm text-text-secondary">Insight-urile folosesc doar numere calculate. Nu influențează prețurile sau plățile.</p>
        <ul className="grid gap-3 lg:grid-cols-2">
          {data.insights.map((insight, i) => (
            <li key={`${insight.category}-${i}`}>
              <InsightCard insight={insight} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="won-title" className="flex flex-col gap-4">
        <SectionHeader
          id="won-title"
          title="Ultimele grupuri câștigate"
          trailing={
            <Link href="/seller/grupuri" className="label-md text-text-brand underline-offset-4 hover:underline">
              Vezi toate grupurile
            </Link>
          }
        />
        {data.recentWon.length === 0 ? (
          <p className="body-md text-text-secondary">Încă nu ai grupuri încheiate în această perioadă.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {data.recentWon.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/seller/grupuri/${g.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="title-md text-text-primary">{g.productName}</h3>
                    <StatusTag status={g.status} />
                  </div>
                  <p className="body-sm text-text-secondary">
                    {units(g.units)} · {g.buyers} cumpărători · {g.durationLabel} · {dayLabel(g.closesAt, now)}
                  </p>
                  <p className="body-md text-text-primary">
                    {g.finalUnitPrice !== null ? formatRon(g.finalUnitPrice) : "—"} / unitate
                    {g.baseUnitPrice && g.finalUnitPrice !== null && g.finalUnitPrice < g.baseUnitPrice && (
                      <span className="text-text-secondary"> · bază {formatRon(g.baseUnitPrice)}</span>
                    )}
                    {" · "}
                    <b>{formatRon(g.revenue)}</b>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="grid gap-4 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card md:grid-cols-3">
        <div>
          <p className="label-sm text-text-secondary">Câștiguri încasate</p>
          <p className="display-sm text-text-primary">{formatRon(data.earnings.net)}</p>
        </div>
        <div>
          <p className="label-sm text-text-secondary">Comision BunDeals</p>
          <p className="display-sm text-text-primary">{formatRon(data.earnings.commission)}</p>
        </div>
        <div>
          <p className="label-sm text-text-secondary">De ridicat</p>
          <p className="display-sm text-text-primary">{data.awaitingPickupCount}</p>
          <Link href="/seller/pickup" className="label-sm text-text-brand underline-offset-4 hover:underline">
            Confirmă ridicări
          </Link>
        </div>
      </aside>
    </main>
  );
}
