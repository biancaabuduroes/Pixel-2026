"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SearchBar } from "@/components/ds/search-bar";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import type { SellerGroupStatus } from "@/domain/seller";
import { dayLabel, inDuration, units } from "@/lib/format";
import { MetricPills } from "./metric-pills";
import { StatusTag } from "./status-tag";


export type GroupListItem = {
  id: string;
  productName: string;
  durationLabel: string;
  buyers: number;
  totalQty: number;
  closesAt: string;
  status: SellerGroupStatus;
  closingSoon: boolean;
  currentUnitPrice: number;
  baseUnitPrice: number;
  next: { minQty: number; unitPrice: number; unitsMissing: number } | null;
  bestUnitPrice: number;
  revenue: number;
};

type Tab = "all" | "active" | "tier" | "near" | "won" | "empty";

const TABS: { value: Tab; label: string; tone: "neutral" | "brand" | "deal" | "success" | "info" }[] = [
  { value: "all", label: "Toate", tone: "neutral" },
  { value: "active", label: "Active", tone: "brand" },
  { value: "tier", label: "Prag deblocat", tone: "success" },
  { value: "near", label: "Aproape de prag", tone: "deal" },
  { value: "won", label: "Câștigate", tone: "success" },
  { value: "empty", label: "Fără participanți", tone: "info" },
];


const OPEN: SellerGroupStatus[] = ["ACTIVE", "NEAR_TIER", "TIER_UNLOCKED", "BEST_PRICE"];

function matchesTab(g: GroupListItem, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "active") return OPEN.includes(g.status);
  if (tab === "tier") return g.status === "TIER_UNLOCKED" || g.status === "BEST_PRICE";
  if (tab === "near") return g.status === "NEAR_TIER";
  if (tab === "won") return g.status === "WON";
  return g.status === "NO_PARTICIPANTS";
}

type SortKey = "closes" | "buyers" | "units" | "recent";

export function GroupsFilter({ groups, nowIso }: { groups: readonly GroupListItem[]; nowIso: string }) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("closes");

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("ro");
    const list = groups.filter((g) => matchesTab(g, tab) && (!needle || g.productName.toLocaleLowerCase("ro").includes(needle)));
    return [...list].sort((a, b) => {
      if (sort === "buyers") return b.buyers - a.buyers;
      if (sort === "units") return b.totalQty - a.totalQty;
      if (sort === "recent") return new Date(b.closesAt).getTime() - new Date(a.closesAt).getTime();
      // open first by soonest close, then settled by latest close
      const aOpen = OPEN.includes(a.status);
      const bOpen = OPEN.includes(b.status);
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return aOpen
        ? new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()
        : new Date(b.closesAt).getTime() - new Date(a.closesAt).getTime();
    });
  }, [groups, tab, q, sort]);

  return (
    <div className="flex flex-col gap-4">
      <MetricPills label="Filtrează grupurile" value={tab} onValueChange={setTab} options={TABS} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchBar value={q} onValueChange={setQ} onSubmit={() => undefined} label="Caută după produs" placeholder="Caută după produs" />
        </div>
        <label className="flex items-center gap-2 body-sm text-text-secondary">
          Sortează
          <select
            className="h-control-md rounded-pill border border-border-subtle bg-bg-subtle px-4 text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="closes">Expirare</option>
            <option value="buyers">Cumpărători</option>
            <option value="units">Unități</option>
            <option value="recent">Cele mai recente</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="body-md text-text-secondary">Niciun grup pe acest filtru.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((g) => {
            const closesAt = new Date(g.closesAt);
            const open = OPEN.includes(g.status);
            const progressMax = g.next?.minQty ?? (g.totalQty || 1);
            return (
              <li key={g.id}>
                <Link
                  href={`/seller/grupuri/${g.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-card outline-none transition-colors hover:border-border-default focus-visible:ring-2 focus-visible:ring-border-strong"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="title-md text-text-primary">{g.productName}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Tag tone="neutral">Grup {g.durationLabel}</Tag>
                        <StatusTag status={g.status} closingSoon={g.closingSoon} />
                        <span className="body-sm text-text-secondary">
                          {g.buyers} cumpărători · {open ? inDuration(closesAt.getTime() - now.getTime()) : dayLabel(closesAt, now)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="display-sm text-text-primary">{formatRon(g.currentUnitPrice)}</p>
                      <p className="body-sm text-text-secondary">
                        {open ? "preț curent" : "preț final"} · bază {formatRon(g.baseUnitPrice)}
                      </p>
                    </div>
                  </div>
                  {open && (
                    <>
                      <ProgressBar
                        label={`${g.productName}: ${g.totalQty} din ${progressMax}`}
                        value={g.totalQty}
                        max={progressMax}
                        tone={g.next ? "brand" : "success"}
                      />
                      <p className="body-sm text-text-secondary">
                        <b className="text-text-primary">{units(g.totalQty)}</b>
                        {g.next ? ` · încă ${g.next.unitsMissing} pentru ${formatRon(g.next.unitPrice)}` : " · toate pragurile deblocate"}
                        {" · "}cel mai bun {formatRon(g.bestUnitPrice)}
                      </p>
                    </>
                  )}
                  {!open && g.revenue > 0 && (
                    <p className="body-sm text-text-secondary">
                      Venit: <b className="text-text-primary">{formatRon(g.revenue)}</b> · {units(g.totalQty)}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
