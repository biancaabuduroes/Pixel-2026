import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GroupsFilter } from "@/components/seller/groups-filter";
import { KpiCard } from "@/components/seller/kpi-card";
import { SectionHeader } from "@/components/ds/section-header";
import { SummaryRow } from "@/components/ds/summary-row";
import { formatRon } from "@/domain/money";
import { units } from "@/lib/format";
import { sellerGroupsData } from "@/server/seller-queries";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Grupuri · BunDeals" };

export default function SellerGroupsPage() {
  return (
    <Suspense fallback={<p className="body-md text-text-secondary">Se încarcă grupurile…</p>}>
      <Groups />
    </Suspense>
  );
}

async function Groups() {
  const seller = await currentUser("SELLER");
  if (!seller) return null;
  const now = new Date();
  const data = await sellerGroupsData(seller.id, now);

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="body-sm text-text-secondary">
          <Link href="/seller" className="underline-offset-4 hover:underline">
            Dashboard
          </Link>{" "}
          / Listare de grupuri
        </p>
        <h1 className="display-lg text-text-primary">Listare de grupuri</h1>
        <p className="body-lg text-text-secondary">Monitorizează progresul, pragurile de preț și grupurile încheiate.</p>
      </div>

      <section aria-label="Statistici grupuri" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Unități angajate" value={units(data.stats.committedUnits)} />
        <KpiCard label="Grupuri active" value={String(data.stats.active)} />
        <KpiCard label="Prag deblocat" value={String(data.stats.tierUnlocked)} tone="success" />
        <KpiCard label="Câștigate" value={String(data.stats.won)} tone="success" href="/seller/grupuri" />
        <KpiCard label="Fără participanți" value={String(data.stats.noParticipants)} />
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section aria-labelledby="groups-title" className="flex flex-col gap-4">
          <SectionHeader id="groups-title" title="Grupuri" />
          <GroupsFilter
            nowIso={now.toISOString()}
            groups={data.groups.map((g) => ({
              ...g,
              closesAt: g.closesAt.toISOString(),
            }))}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
            <SectionHeader title="Câștiguri" />
            <div className="mt-2">
              <SummaryRow label="Vânzări ridicate" value={formatRon(data.earnings.sales)} />
              <SummaryRow label="Comision BunDeals (5%)" value={`−${formatRon(data.earnings.commission)}`} />
              <SummaryRow label="Câștig net" value={formatRon(data.earnings.net)} emphasis divider={false} />
            </div>
          </section>
          <section className="rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
            <SectionHeader title="Ridicări" />
            <p className="mt-2 body-md text-text-primary">
              {data.awaitingPickupCount} {data.awaitingPickupCount === 1 ? "comandă" : "comenzi"} așteaptă ridicarea
            </p>
            <Link href="/seller/pickup" className="mt-3 inline-block label-md text-text-brand underline-offset-4 hover:underline">
              Confirmă ridicări
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
