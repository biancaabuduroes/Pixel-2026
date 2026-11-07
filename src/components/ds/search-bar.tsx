"use client";

import { cn } from "cn";
import { Icon } from "./icon";

/** Figma: SearchBar (node 13:94). Active (focused or with text): 2px black border and a clear (×) button. */
export function SearchBar({
  value,
  placeholder,
  label,
  onValueChange,
  onSubmit,
}: {
  value: string;
  placeholder: string;
  label: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const active = value.length > 0;
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-md bg-bg-surface pr-3 pl-4",
        active
          ? "border-2 border-border-strong pl-[15px]"
          : "border border-border-control focus-within:border-border-strong focus-within:shadow-[inset_0_0_0_1px_var(--border-strong)]",
      )}
    >
      <Icon name={active ? "search-20-active" : "search-20"} size={20} />
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        enterKeyHint="search"
        className="h-full min-w-0 flex-1 bg-transparent body-md text-text-primary outline-none placeholder:text-text-secondary [&::-webkit-search-cancel-button]:hidden"
      />
      {active && (
        <button type="button" aria-label="Șterge adresa" onClick={() => onValueChange("")} className="flex size-[22px] items-center justify-center rounded-pill bg-bg-muted">
          <Icon name="close-12" size={12} />
        </button>
      )}
    </form>
  );
}
