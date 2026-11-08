"use client";

import { useMemo, useState } from "react";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SearchBar } from "@/components/ds/search-bar";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import { STOCK_STATUS_LABEL, type StockStatus } from "@/domain/seller";
import { units } from "@/lib/format";
import { MetricPills } from "./metric-pills";
import { SellerPanel, SellerPanelHeader } from "./seller-panel";

export type CatalogRow = {
  id: string;
  name: string;
  categoryLabel: string;
  kind: "ITEM" | "BASKET";
  stockTotal: number;
  stockRemaining: number;
  stockStatus: StockStatus;
  soldUnits: number;
  committedUnits: number;
  currentUnitPrice: number;
  bestUnitPrice: number;
  openGroups: number;
  next: { minQty: number; unitPrice: number; unitsMissing: number } | null;
};

const STOCK_TONE: Record<StockStatus, "success" | "deal" | "danger"> = {
  OPTIMAL: "success",
  LOW: "deal",
  CRITICAL: "danger",
};

type SortKey = "name" | "stock" | "sold" | "price";

const SORT_OPTIONS = [
  { value: "sold", label: "Vânzări", tone: "brand" as const },
  { value: "stock", label: "Stoc", tone: "deal" as const },
  { value: "price", label: "Preț", tone: "neutral" as const },
  { value: "name", label: "Nume", tone: "neutral" as const },
];

export function CatalogTable({ rows }: { rows: readonly CatalogRow[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("sold");

  const categories = useMemo(() => [...new Set(rows.map((r) => r.categoryLabel))].sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("ro");
    const list = rows.filter((r) => {
      if (category !== "all" && r.categoryLabel !== category) return false;
      if (needle && !r.name.toLocaleLowerCase("ro").includes(needle)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ro");
      if (sort === "stock") return a.stockRemaining - b.stockRemaining;
      if (sort === "price") return a.currentUnitPrice - b.currentUnitPrice;
      return b.soldUnits - a.soldUnits;
    });
  }, [rows, q, category, sort]);

  return (
    <SellerPanel padded={false}>
      <div className="border-b border-border-subtle p-5 sm:p-6">
        <SellerPanelHeader
          title="Catalog produse & stocuri"
          description="Stoc, vânzări și praguri de preț pe fiecare produs"
          trailing={<MetricPills label="Sortează catalog" value={sort} onValueChange={(v) => setSort(v as SortKey)} options={SORT_OPTIONS} />}
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <SearchBar value={q} onValueChange={setQ} onSubmit={() => undefined} label="Caută produs" placeholder="Caută produs" />
          </div>
          <label className="flex items-center gap-2 body-sm text-text-secondary">
            Categorie
            <select
              className="h-control-md rounded-pill border border-border-subtle bg-bg-subtle px-4 text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Toate</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-6 body-md text-text-secondary">Niciun produs nu corespunde filtrelor.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-5 py-3 label-sm uppercase tracking-[0.06em] text-text-secondary sm:px-6">Produs</th>
                <th className="px-4 py-3 label-sm uppercase tracking-[0.06em] text-text-secondary">Stoc</th>
                <th className="px-4 py-3 label-sm uppercase tracking-[0.06em] text-text-secondary">Vândute</th>
                <th className="px-4 py-3 label-sm uppercase tracking-[0.06em] text-text-secondary">Preț</th>
                <th className="px-5 py-3 label-sm uppercase tracking-[0.06em] text-text-secondary sm:px-6">Progres</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-subtle/60">
                  <td className="px-5 py-4 align-top sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="label-md text-text-primary">{r.name}</p>
                      {r.kind === "BASKET" && <Tag tone="info">Coș</Tag>}
                      <Tag tone={STOCK_TONE[r.stockStatus]}>{STOCK_STATUS_LABEL[r.stockStatus]}</Tag>
                    </div>
                    <p className="mt-1 body-sm text-text-secondary">
                      {r.categoryLabel} · {r.openGroups} {r.openGroups === 1 ? "grup activ" : "grupuri active"}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top body-md text-text-primary">
                    <b>{r.stockRemaining}</b>
                    <span className="text-text-secondary"> / {r.stockTotal}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="body-md text-text-primary">{units(r.soldUnits)}</p>
                    <p className="caption text-text-secondary">{units(r.committedUnits)} angajate</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="label-md text-text-primary">{formatRon(r.currentUnitPrice)}</p>
                    <p className="caption text-text-secondary">până la {formatRon(r.bestUnitPrice)}</p>
                  </td>
                  <td className="px-5 py-4 align-top sm:px-6">
                    <ProgressBar
                      label={`${r.name}: stoc ${r.stockRemaining} din ${r.stockTotal}`}
                      value={r.stockTotal - r.stockRemaining}
                      max={r.stockTotal || 1}
                      tone={r.stockStatus === "CRITICAL" ? "deal" : "brand"}
                    />
                    <p className="mt-1 caption text-text-secondary">
                      {r.next ? `încă ${r.next.unitsMissing} u. pentru ${formatRon(r.next.unitPrice)}` : "cel mai bun preț atins"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SellerPanel>
  );
}
