"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "cn";

export type MetricPillTone = "brand" | "deal" | "success" | "info" | "neutral";

const TONE: Record<MetricPillTone, { idle: string; active: string }> = {
  brand: {
    idle: "bg-bg-brand-soft text-text-brand ring-1 ring-inset ring-border-brand/20",
    active: "bg-bg-brand text-text-inverse ring-1 ring-inset ring-bg-brand-strong",
  },
  deal: {
    idle: "bg-bg-deal-soft text-text-deal ring-1 ring-inset ring-bg-deal/40",
    active: "bg-bg-deal text-text-on-brand ring-1 ring-inset ring-bg-deal",
  },
  success: {
    idle: "bg-bg-success-soft text-text-success ring-1 ring-inset ring-bg-success/20",
    active: "bg-bg-success text-text-inverse ring-1 ring-inset ring-bg-success",
  },
  info: {
    idle: "bg-bg-info-soft text-text-info ring-1 ring-inset ring-bg-info/20",
    active: "bg-bg-info text-text-inverse ring-1 ring-inset ring-bg-info",
  },
  neutral: {
    idle: "bg-bg-muted text-text-secondary ring-1 ring-inset ring-border-subtle",
    active: "bg-bg-action text-text-inverse ring-1 ring-inset ring-bg-action",
  },
};

/** Compact pill legend/toggles — analytics-style, BunDeals tokens. */
export function MetricPills<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly { value: T; label: string; tone?: MetricPillTone }[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(values) => values.length > 0 && onValueChange(values[values.length - 1] as T)}
      className="flex flex-wrap gap-2"
    >
      {options.map((o) => {
        const tone = TONE[o.tone ?? "neutral"];
        const selected = o.value === value;
        return (
          <Toggle
            key={o.value}
            value={o.value}
            className={cn(
              "rounded-pill px-3 py-1.5 label-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-strong",
              selected ? tone.active : tone.idle,
            )}
          >
            {o.label}
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}
