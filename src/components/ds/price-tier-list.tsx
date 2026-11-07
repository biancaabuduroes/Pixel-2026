import { cn } from "cn";
import { Icon } from "./icon";
import { Tag } from "./tag";

export type TierRowState = "reached" | "current" | "next" | "locked";

/**
 * Figma: PriceTierList (node 38:374) built from Tier row (node 38:373).
 * Reached (green dot + check, grey text), Current (dark green + "Acum", bold), Next (yellow ring +
 * "Următorul"), Locked (grey ring).
 */
export function PriceTierList({ rows }: { rows: readonly { range: string; price: string; state: TierRowState }[] }) {
  return (
    <ul className="flex w-full flex-col">
      {rows.map((r) => (
        <li key={r.range} className="flex w-full items-center gap-3 py-3">
          <span
            className={cn(
              "flex size-[22px] shrink-0 items-center justify-center rounded-pill",
              r.state === "reached" && "bg-bg-success-strong",
              r.state === "current" && "bg-bg-success",
              r.state === "next" && "border-2 border-bg-deal bg-bg-deal-soft",
              r.state === "locked" && "border-2 border-bg-strong",
            )}
          >
            {(r.state === "reached" || r.state === "current") && <Icon name="check-12-inverse" size={12} />}
          </span>
          <span className={cn("min-w-0 flex-1", r.state === "current" ? "label-md text-text-primary" : "body-md text-text-secondary")}>{r.range}</span>
          {r.state === "current" && <Tag tone="success">Acum</Tag>}
          {r.state === "next" && <Tag tone="deal">Următorul</Tag>}
          <span className={cn("whitespace-nowrap", r.state === "current" || r.state === "next" ? "title-md text-text-primary" : "body-md text-text-secondary")}>{r.price}</span>
        </li>
      ))}
    </ul>
  );
}
