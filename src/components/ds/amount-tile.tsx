"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

/** Figma: AmountTile (node 36:332). 2×2 grid of preset amounts, 88px tall; selected = black. Behaves as a radio. */
export function AmountTiles({
  label,
  amounts,
  value,
  onValueChange,
}: {
  label: string;
  amounts: readonly number[];
  value: number | null;
  onValueChange: (value: number) => void;
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value === null ? null : String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
      className="grid w-full grid-cols-2 gap-3"
    >
      {amounts.map((amount) => (
        <Radio.Root
          key={amount}
          value={String(amount)}
          className="flex h-22 flex-col items-center justify-center rounded-lg border border-border-default bg-bg-surface text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 data-checked:border-2 data-checked:border-border-strong data-checked:bg-bg-action data-checked:text-text-inverse"
        >
          <span className="display-lg">{amount}</span>
          <span className="label-sm opacity-80">RON</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
