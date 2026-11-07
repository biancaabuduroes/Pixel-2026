"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Icon } from "./icon";

/** Figma: Checkbox (node 13:119). 22px box, 4px radius; checked = black with white check. */
export function Checkbox({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <label className="flex w-full cursor-pointer items-start gap-3">
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value)}
        className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-xs border-[1.5px] border-border-control bg-bg-surface outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 data-checked:border-0 data-checked:bg-bg-action"
      >
        <CheckboxPrimitive.Indicator>
          <Icon name="check-14-inverse" size={14} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <span className="body-md text-text-primary">{label}</span>
    </label>
  );
}
