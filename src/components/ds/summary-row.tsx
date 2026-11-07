import { cn } from "cn";

/** Figma: SummaryRow (node 35:360). Label/value line with a hairline divider; Emphasis = bold success total. */
export function SummaryRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn("flex w-full items-center justify-between gap-3 py-3", emphasis ? "title-md text-text-success" : "border-b border-border-subtle body-md")}>
      <span className={emphasis ? undefined : "text-text-secondary"}>{label}</span>
      <span className={emphasis ? undefined : "text-text-primary"}>{value}</span>
    </div>
  );
}
