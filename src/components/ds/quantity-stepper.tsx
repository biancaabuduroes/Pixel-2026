"use client";

import { Icon } from "./icon";

/** Figma: QuantityStepper. Two 44px round buttons around the value; min disables minus, max disables plus. */
export function QuantityStepper({ value, min = 1, max, onChange, label }: { value: number; min?: number; max: number; onChange: (v: number) => void; label: string }) {
  const btn = "flex size-control-md items-center justify-center rounded-pill border border-border-default bg-bg-surface outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:opacity-(--opacity-disabled)";
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label="Scade cantitatea" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus-18" size={18} />
      </button>
      <output className="w-8 text-center title-lg text-text-primary" aria-live="polite">
        {value}
      </output>
      <button type="button" className={btn} aria-label="Crește cantitatea" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus-18" size={18} />
      </button>
    </div>
  );
}
