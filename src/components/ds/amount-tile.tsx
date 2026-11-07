"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

/**
 * Figma: AmountTile (node 36:332). Preset amounts; selected = black. Behaves as a radio.
 * size "lg": 2×2 grid, 88px, display-lg · size "sm": one row, 64px, display-md (top-up 64:1385).
 */
export function AmountTiles({
  label,
  amounts,
  value,
  onValueChange,
  size = "lg",
}: {
  label: string;
  amounts: readonly number[];
  value: number | null;
  onValueChange: (value: number) => void;
  size?: "lg" | "sm";
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value === null ? null : String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
      className={`grid w-full gap-3 ${size === "lg" ? "grid-cols-2" : "grid-cols-4"}`}
    >
      {amounts.map((amount) => (
        <Radio.Root
          key={amount}
          value={String(amount)}
          className={`flex ${size === "lg" ? "h-22" : "h-16"} flex-col items-center justify-center rounded-lg border border-border-default bg-bg-surface text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 data-checked:border-2 data-checked:border-border-strong data-checked:bg-bg-action data-checked:text-text-inverse`}
        >
          <span className={size === "lg" ? "display-lg" : "display-md"}>{amount}</span>
          <span className="label-sm opacity-80">RON</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
