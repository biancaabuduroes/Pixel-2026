"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

/**
 * Figma: Slider (node 36:333). 8px track, coral fill up to the value, 28px white thumb with a
 * 2px black ring, 44px touch area, min/max labels underneath.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <SliderPrimitive.Root
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onValueChange(Array.isArray(v) ? v[0] : v)}
      >
        <SliderPrimitive.Control className="flex h-11 w-full touch-none items-center">
          <SliderPrimitive.Track className="relative h-2 w-full rounded-pill bg-bg-muted">
            <SliderPrimitive.Indicator className="rounded-pill bg-bg-brand-strong" />
            <SliderPrimitive.Thumb aria-label={label} className="size-7 rounded-pill border-2 border-border-strong bg-bg-surface shadow-raised outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2" />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      <div className="flex justify-between body-sm text-text-secondary" aria-hidden>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
