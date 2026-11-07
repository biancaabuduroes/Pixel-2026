"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

/** Figma: ChipGroup · Layout=Wrap (node 36:285). Multi-select chips, 32px; selected = black. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: readonly T[];
  onValueChange: (value: T[]) => void;
}) {
  return (
    <ToggleGroup
      multiple
      aria-label={label}
      value={[...value]}
      onValueChange={(values) => onValueChange(values as T[])}
      className="flex w-full flex-wrap gap-2"
    >
      {options.map((o) => (
        <Toggle
          key={o.value}
          value={o.value}
          className="flex h-control-sm items-center rounded-pill bg-bg-muted px-4 label-md text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 data-pressed:bg-bg-action data-pressed:text-text-inverse"
        >
          {o.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
