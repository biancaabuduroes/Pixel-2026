"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

/** Figma: Radio (node 13:140) stacked as a RadioGroup. Checked = 7px black ring. */
export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onValueChange: (value: T) => void;
}) {
  return (
    <RadioGroupPrimitive aria-label={label} value={value} onValueChange={(v) => onValueChange(v as T)} className="flex w-full flex-col gap-4">
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-start gap-3">
          <Radio.Root
            value={o.value}
            className="mt-px size-[22px] shrink-0 rounded-pill border-[1.5px] border-border-control bg-bg-surface outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 data-checked:border-[7px] data-checked:border-border-strong"
          />
          <span className="body-md text-text-primary">{o.label}</span>
        </label>
      ))}
    </RadioGroupPrimitive>
  );
}
