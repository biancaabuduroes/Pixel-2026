"use client";

import { useMemo, useState } from "react";
import { SearchBar } from "@/components/ds/search-bar";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import { dayLabel, orderRef, units } from "@/lib/format";

type OrderStatus = "ACTIVE" | "AWAITING_PICKUP" | "COLLECTED" | "EXPIRED_PAID" | "DISPUTED" | "REFUNDED" | "CANCELLED";

export type OrderRow = {
  id: string;
  buyerName: string;
  quantity: number;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  pickupDeadline: string | null;
};

type Tab = "all" | "pending" | "ready" | "done";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Toate" },
  { value: "pending", label: "În așteptare" },
  { value: "ready", label: "Gata de ridicare" },
  { value: "done", label: "Ridicate" },
];

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  ACTIVE: "În grup",
  AWAITING_PICKUP: "Gata de ridicare",
  COLLECTED: "Ridicat",
  EXPIRED_PAID: "Expirat (plătit)",
};

function matches(o: OrderRow, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "pending") return o.status === "ACTIVE";
  if (tab === "ready") return o.status === "AWAITING_PICKUP";
  return o.status === "COLLECTED" || o.status === "EXPIRED_PAID";
}

export function OrdersTable({ orders, nowIso }: { orders: readonly OrderRow[]; nowIso: string }) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("ro");
    return orders.filter((o) => matches(o, tab) && (!needle || o.buyerName.toLocaleLowerCase("ro").includes(needle)));
  }, [orders, tab, q]);

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl label="Filtrează comenzile" value={tab} onValueChange={setTab} options={TABS} />
      <SearchBar value={q} onValueChange={setQ} onSubmit={() => undefined} label="Caută cumpărător" placeholder="Caută cumpărător" />
      {filtered.length === 0 ? (
        <p className="body-md text-text-secondary">Nicio comandă pe acest filtru.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-surface shadow-card">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-border-subtle bg-bg-subtle">
              <tr className="label-sm text-text-secondary">
                <th className="px-4 py-3 font-semibold">Cumpărător</th>
                <th className="px-4 py-3 font-semibold">Unități</th>
                <th className="px-4 py-3 font-semibold">Valoare</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="label-md text-text-primary">{o.buyerName}</p>
                    <p className="caption text-text-secondary">{orderRef(o.id)}</p>
                  </td>
                  <td className="px-4 py-3 body-md text-text-primary">{units(o.quantity)}</td>
                  <td className="px-4 py-3 body-md text-text-primary">{formatRon(o.amount)}</td>
                  <td className="px-4 py-3 body-sm text-text-secondary">{dayLabel(new Date(o.createdAt), now)}</td>
                  <td className="px-4 py-3">
                    <Tag
                      tone={
                        o.status === "COLLECTED" || o.status === "EXPIRED_PAID"
                          ? "success"
                          : o.status === "AWAITING_PICKUP"
                            ? "deal"
                            : "neutral"
                      }
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
