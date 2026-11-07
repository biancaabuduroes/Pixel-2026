import { cn } from "cn";

/** Figma: SummaryRow (Joined / Pickup code sheets). Label left, value right, hairline below; emphasis = success. */
export function SummaryRow({ label, value, emphasis, divider = true }: { label: string; value: React.ReactNode; emphasis?: boolean; divider?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3.5", divider && "border-b border-border-subtle", emphasis ? "title-md text-text-success" : "body-md")}>
      <span className={emphasis ? undefined : "text-text-secondary"}>{label}</span>
      <span className={cn("text-right", !emphasis && "text-text-primary")}>{value}</span>
    </div>
  );
}
