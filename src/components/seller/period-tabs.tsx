"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MetricPills } from "./metric-pills";

const OPTIONS = [
  { value: "7", label: "7 zile", tone: "neutral" as const },
  { value: "30", label: "30 zile", tone: "brand" as const },
  { value: "90", label: "90 zile", tone: "neutral" as const },
];

export function PeriodTabs({ value }: { value: 7 | 30 | 90 }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <MetricPills
      label="Perioadă"
      value={String(value)}
      options={OPTIONS}
      onValueChange={(v) => {
        const next = new URLSearchParams(params.toString());
        next.set("perioada", v);
        router.push(`${pathname}?${next.toString()}`);
      }}
    />
  );
}
