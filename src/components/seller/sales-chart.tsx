"use client";

import { useState } from "react";
import { AreaChart } from "./area-chart";
import { MetricPills } from "./metric-pills";
import { SellerPanel, SellerPanelHeader } from "./seller-panel";

type Metric = "revenue" | "units" | "orders";

const OPTIONS: { value: Metric; label: string; tone: "brand" | "deal" | "success"; legend: string }[] = [
  { value: "revenue", label: "Venituri", tone: "brand", legend: "Încasări zilnice din grupuri încheiate (RON)" },
  { value: "units", label: "Unități", tone: "deal", legend: "Unități vândute pe zi în perioada selectată" },
  { value: "orders", label: "Comenzi", tone: "success", legend: "Număr de comenzi pe zi" },
];

export function SalesChart({ points }: { points: readonly { day: string; revenue: number; units: number; orders: number }[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const active = OPTIONS.find((o) => o.value === metric) ?? OPTIONS[0];

  return (
    <SellerPanel>
      <SellerPanelHeader
        title="Puls vânzări"
        description="Evoluție zilnică pe perioada selectată"
        trailing={<MetricPills label="Metrică grafic" value={metric} onValueChange={setMetric} options={OPTIONS} />}
      />
      <AreaChart
        points={points}
        valueKey={metric}
        label={active.legend}
        formatValue={
          metric === "revenue"
            ? (v) => {
                // Compact axis label (full RON lives in the legend / KPI).
                const ron = Math.round(v / 100);
                return ron >= 1000 ? `${(ron / 1000).toFixed(ron >= 10000 ? 0 : 1)}k` : String(ron);
              }
            : undefined
        }
      />
      <ul className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4">
        {OPTIONS.map((o) => (
          <li key={o.value} className="flex items-start gap-3">
            <span
              aria-hidden
              className={
                o.tone === "brand"
                  ? "mt-2 h-0.5 w-4 shrink-0 rounded-pill bg-bg-brand-strong"
                  : o.tone === "deal"
                    ? "mt-2 h-0.5 w-4 shrink-0 rounded-pill bg-bg-deal"
                    : "mt-2 h-0.5 w-4 shrink-0 rounded-pill bg-bg-success-strong"
              }
            />
            <div>
              <p className="label-md text-text-primary">{o.label}</p>
              <p className="body-sm text-text-secondary">{o.legend}</p>
            </div>
          </li>
        ))}
      </ul>
    </SellerPanel>
  );
}
