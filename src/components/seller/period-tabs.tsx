"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ds/segmented-control";

const OPTIONS = [
  { value: "7", label: "7 zile" },
  { value: "30", label: "30 zile" },
  { value: "90", label: "90 zile" },
] as const;

export function PeriodTabs({ value }: { value: 7 | 30 | 90 }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="max-w-md">
      <SegmentedControl
        label="Perioadă"
        value={String(value)}
        options={OPTIONS}
        onValueChange={(v) => {
          const next = new URLSearchParams(params.toString());
          next.set("perioada", v);
          router.push(`${pathname}?${next.toString()}`);
        }}
      />
    </div>
  );
}
