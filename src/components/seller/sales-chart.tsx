"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { BarChart } from "./bar-chart";

type Metric = "revenue" | "units" | "orders";

const OPTIONS: { value: Metric; label: string }[] = [
  { value: "revenue", label: "Venituri" },
  { value: "units", label: "Unități" },
  { value: "orders", label: "Comenzi" },
];

export function SalesChart({ points }: { points: readonly { day: string; revenue: number; units: number; orders: number }[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  return (
    <div className="flex flex-col gap-3">
      <div className="max-w-md">
        <SegmentedControl label="Metrică grafic" value={metric} onValueChange={setMetric} options={OPTIONS} />
      </div>
      <BarChart
        points={points}
        valueKey={metric}
        label={metric === "revenue" ? "Venituri pe zi (bani → afișat ca bare)" : metric === "units" ? "Unități vândute pe zi" : "Comenzi pe zi"}
      />
    </div>
  );
}
