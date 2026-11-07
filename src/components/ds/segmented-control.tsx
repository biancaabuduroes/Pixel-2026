"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

/** Figma: SegmentedControl (node 11:43). Equal segments; selected = black pill on a grey track. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(values) => values.length > 0 && onValueChange(values[values.length - 1] as T)}
      className="flex h-control-md w-full gap-0.5 rounded-pill bg-bg-muted p-1"
    >
      {options.map((o) => (
        <Toggle
          key={o.value}
          value={o.value}
          className="flex h-full min-w-0 flex-1 items-center justify-center truncate rounded-pill px-3 label-md text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-strong data-pressed:bg-bg-action data-pressed:text-text-inverse"
        >
          {o.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
