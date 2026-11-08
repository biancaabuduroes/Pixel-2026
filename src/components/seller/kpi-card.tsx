import Link from "next/link";
import { cn } from "cn";

/** Desktop KPI tile — micro label, large figure, restrained tone accents. */
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
  const accent =
    tone === "success"
      ? "before:bg-bg-success"
      : tone === "deal"
        ? "before:bg-bg-deal"
        : tone === "danger"
          ? "before:bg-bg-danger"
          : "before:bg-bg-brand";

  const body = (
    <div
      className={cn(
        "relative flex h-full flex-col gap-2 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-card",
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-xl",
        accent,
      )}
    >
      <span className="label-sm uppercase tracking-[0.06em] text-text-secondary">{label}</span>
      <span className="display-md text-text-primary">{value}</span>
      {hint && <div className="body-sm text-text-secondary">{hint}</div>}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block rounded-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-border-strong">
      {body}
    </Link>
  );
}
