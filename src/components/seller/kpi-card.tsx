import Link from "next/link";
import { cn } from "cn";

/** Desktop KPI tile: large number, short label, optional href. */
export function KpiCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  href?: string;
  tone?: "default" | "success" | "deal" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-bg-success-soft bg-bg-success-soft"
      : tone === "deal"
        ? "border-bg-deal-soft bg-bg-deal-soft"
        : tone === "danger"
          ? "border-bg-danger-soft bg-bg-danger-soft"
          : "border-border-default bg-bg-surface";

  const body = (
    <div className={cn("flex h-full flex-col gap-2 rounded-lg border p-5 shadow-card", toneClass)}>
      <span className="label-sm text-text-secondary">{label}</span>
      <span className="display-md text-text-primary">{value}</span>
      {hint && <div className="body-sm text-text-secondary">{hint}</div>}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-border-strong rounded-lg">
      {body}
    </Link>
  );
}
