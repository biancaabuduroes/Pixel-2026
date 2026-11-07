import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InsightCard } from "@/components/seller/insight-card";
import { MarginCalculator } from "@/components/seller/margin-calculator";
import { OrdersTable } from "@/components/seller/orders-table";
import { StatusTag } from "@/components/seller/status-tag";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SectionHeader } from "@/components/ds/section-header";
import { SummaryRow } from "@/components/ds/summary-row";
import { Tag } from "@/components/ds/tag";
import { buttonVariants } from "@/components/ui/button";
import { formatRon } from "@/domain/money";
import { dayLabel, timeLabel, units } from "@/lib/format";
import { sellerGroupDetails } from "@/server/seller-queries";
import { currentUser } from "@/server/session";
import { cn } from "cn";

export const metadata: Metadata = { title: "Detalii grup · BunDeals" };

export default function SellerGroupDetailsPage(props: PageProps<"/seller/grupuri/[id]">) {
  return (
    <Suspense fallback={<p className="body-md text-text-secondary">Se încarcă detaliile…</p>}>
      <Details params={props.params} />
    </Suspense>
  );
}

async function Details({ params }: { params: PageProps<"/seller/grupuri/[id]">["params"] }) {
  const seller = await currentUser("SELLER");
  if (!seller) return null;
  const { id } = await params;
  const now = new Date();
  const data = await sellerGroupDetails(seller.id, id, now);
  if (!data) notFound();

  const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(data.product.pickupLocation.address)}`;
  const open = data.groupStatus === "OPEN";

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="body-sm text-text-secondary">
          <Link href="/seller" className="underline-offset-4 hover:underline">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link href="/seller/grupuri" className="underline-offset-4 hover:underline">
            Listare de grupuri
          </Link>{" "}
          / Detalii grup
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="display-lg text-text-primary">{data.product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusTag status={data.status} closingSoon={data.closingSoon} />
              <Tag tone="neutral">Grup {data.durationLabel}</Tag>
              <span className="body-sm text-text-secondary">
                {data.buyers} cumpărători · {open ? `închide ${dayLabel(data.closesAt, now)} ${timeLabel(data.closesAt)}` : `închis ${dayLabel(data.closesAt, now)}`}
              </span>
            </div>
          </div>
          <Link href="/seller/grupuri" className={cn(buttonVariants({ variant: "secondary", size: "md" }))}>
            Înapoi
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-border-default bg-bg-surface p-6 shadow-card">
        <p className="display-md text-text-primary">
          {open ? "Estimezi vânzări de " : "Ai vândut produse în valoare de "}
          {formatRon(data.headlineRevenue)}
          {open ? " (preț curent)" : "!"}
        </p>
        <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
          <SummaryRow label="Unități" value={units(open ? data.totalQty : data.financials.unitsSold)} />
          <SummaryRow label="Preț inițial / unitate" value={formatRon(data.financials.initialUnitPrice)} />
          <SummaryRow label={open ? "Preț curent / unitate" : "Preț final / unitate"} value={formatRon(data.currentUnitPrice)} />
          <SummaryRow label="Economie cumpărători" value={formatRon(data.financials.buyerSavings)} />
          <SummaryRow label="Comision BunDeals" value={formatRon(data.financials.commission)} />
          <SummaryRow label="Câștig net" value={formatRon(data.financials.net)} emphasis divider={false} />
        </div>
      </section>

      <section aria-labelledby="progress-title" className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
        <SectionHeader id="progress-title" title="Progresul grupului" />
        <ProgressBar
          label={`Progres ${data.totalQty}`}
          value={data.totalQty}
          max={data.next?.minQty ?? data.tiers[data.tiers.length - 1]?.minQty ?? Math.max(data.totalQty, 1)}
          size="md"
          tone={data.next ? "brand" : "success"}
        />
        <p className="body-sm text-text-secondary">
          {data.next
            ? `Mai ai nevoie de ${data.next.unitsMissing} ${data.next.unitsMissing === 1 ? "unitate" : "unități"} pentru a debloca ${formatRon(data.next.unitPrice)}.`
            : "Cel mai bun preț este atins (sau grupul este închis)."}
        </p>
        <ul className="flex flex-col">
          {data.tiers.map((t) => (
            <li key={t.minQty} className="flex items-center justify-between gap-3 border-b border-border-subtle py-3 last:border-b-0">
              <span className="body-md text-text-secondary">
                {t.maxQty ? `${t.minQty}–${t.maxQty}` : `${t.minQty}+`} unități
              </span>
              <span className="flex items-center gap-2">
                {t.reached && <Tag tone="success">Atins</Tag>}
                {t.current && <Tag tone="success">Acum</Tag>}
                {t.next && <Tag tone="deal">Următorul</Tag>}
                <span className="title-md text-text-primary">{formatRon(t.unitPrice)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="pickup-title" className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
          <SectionHeader id="pickup-title" title="Locație de ridicare" />
          <p className="title-md text-text-primary">{data.product.pickupLocation.name}</p>
          <p className="body-md text-text-secondary">{data.product.pickupLocation.address}</p>
          <p className="body-sm text-text-secondary">Program: {data.product.pickupLocation.openingHours}</p>
          <div className="flex flex-wrap gap-2">
            <Tag tone="deal">{data.pickupCounts.awaiting} gata</Tag>
            <Tag tone="success">{data.pickupCounts.collected} ridicate</Tag>
            {data.pickupCounts.active > 0 && <Tag tone="neutral">{data.pickupCounts.active} în grup</Tag>}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={mapUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "md" }))}>
              Vezi locația pe hartă
            </a>
            <Link href={`/seller/pickup?group=${data.id}`} className={cn(buttonVariants({ variant: "primary", size: "md" }))}>
              Confirmă ridicări
            </Link>
          </div>
        </section>

        <MarginCalculator
          unitsSold={open ? data.totalQty : data.financials.unitsSold}
          unitSalePrice={data.currentUnitPrice}
          commission={data.financials.commission}
        />
      </div>

      <section aria-labelledby="orders-title" className="flex flex-col gap-4">
        <SectionHeader id="orders-title" title="Cumpărători și comenzi" />
        <OrdersTable
          nowIso={now.toISOString()}
          orders={data.orders.map((o) => ({
            ...o,
            createdAt: o.createdAt.toISOString(),
            pickupDeadline: o.pickupDeadline?.toISOString() ?? null,
          }))}
        />
      </section>

      <section aria-labelledby="ai-title" className="flex flex-col gap-4 rounded-lg bg-bg-info-soft p-5">
        <SectionHeader id="ai-title" title="BunDeals AI – Analiza grupului" trailing={<Tag tone="info">Estimări</Tag>} />
        <ul className="grid gap-3 lg:grid-cols-2">
          {data.insights.map((insight, i) => (
            <li key={`${insight.category}-${i}`}>
              <InsightCard insight={insight} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
