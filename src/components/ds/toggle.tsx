"use client";

import { Switch } from "@base-ui/react/switch";

/** Figma: Toggle (node 13:157). Label left, 52×32 switch right; green track when on. */
export function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-control-sm w-full cursor-pointer items-center gap-3">
      <span className="min-w-0 flex-1 label-md text-text-primary">{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value)}
        className="relative h-8 w-[52px] shrink-0 rounded-pill bg-bg-strong outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 data-checked:bg-bg-success-strong"
      >
        <Switch.Thumb className="absolute top-[3px] left-[3px] size-[26px] rounded-pill bg-bg-surface shadow-card transition-transform data-checked:translate-x-5" />
      </Switch.Root>
    </label>
  );
}
