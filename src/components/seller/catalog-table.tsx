"use client";

import { useMemo, useState } from "react";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SearchBar } from "@/components/ds/search-bar";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import { STOCK_STATUS_LABEL, type StockStatus } from "@/domain/seller";
import { units } from "@/lib/format";

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchBar value={q} onValueChange={setQ} onSubmit={() => undefined} label="Caută produs" placeholder="Caută produs" />
        </div>
        <label className="flex items-center gap-2 body-sm text-text-secondary">
          Categorie
          <select
            className="h-control-md rounded-md border border-border-control bg-bg-surface px-3 text-text-primary"
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
        <label className="flex items-center gap-2 body-sm text-text-secondary">
          Sortează
          <select
            className="h-control-md rounded-md border border-border-control bg-bg-surface px-3 text-text-primary"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="sold">Vânzări</option>
            <option value="stock">Stoc rămas</option>
            <option value="price">Preț</option>
            <option value="name">Nume</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="body-md text-text-secondary">Niciun produs nu corespunde filtrelor.</p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="title-md text-text-primary">{r.name}</h3>
                    {r.kind === "BASKET" && <Tag tone="info">Coș</Tag>}
                    <Tag tone={STOCK_TONE[r.stockStatus]}>{STOCK_STATUS_LABEL[r.stockStatus]}</Tag>
                  </div>
                  <p className="body-sm text-text-secondary">
                    {r.categoryLabel} · {units(r.soldUnits)} vândute · {units(r.committedUnits)} în grupuri · {r.openGroups}{" "}
                    {r.openGroups === 1 ? "grup activ" : "grupuri active"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="display-sm text-text-primary">{formatRon(r.currentUnitPrice)}</p>
                  <p className="body-sm text-text-secondary">până la {formatRon(r.bestUnitPrice)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <ProgressBar
                  label={`${r.name}: stoc ${r.stockRemaining} din ${r.stockTotal}`}
                  value={r.stockTotal - r.stockRemaining}
                  max={r.stockTotal || 1}
                  tone={r.stockStatus === "CRITICAL" ? "deal" : "brand"}
                />
                <p className="body-sm text-text-secondary">
                  Stoc rămas: <b className="text-text-primary">{r.stockRemaining}</b> din {r.stockTotal}
                  {r.next ? ` · încă ${r.next.unitsMissing} unități pentru ${formatRon(r.next.unitPrice)}` : " · cel mai bun preț atins în grupul de top"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
