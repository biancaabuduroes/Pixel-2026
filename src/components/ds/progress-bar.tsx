import { cn } from "cn";

const SIZES = { xs: "h-1", sm: "h-1.5 rounded-pill", md: "h-2.5 rounded-pill" } as const;
const TONES = { brand: "bg-bg-brand-strong", success: "bg-bg-success-strong", deal: "bg-bg-deal" } as const;

/** Figma: ProgressBar (node 34:248). xs 4px square; sm 6 / md 10 pill. Brand = progress, Success = reached, Deal = price drop. */
export function ProgressBar({
  value,
  max,
  size = "sm",
  tone = "brand",
  label,
}: {
  value: number;
  max: number;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  label: string;
}) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={cn("w-full overflow-hidden bg-bg-muted", SIZES[size])}>
      <div className={cn("h-full", TONES[tone], size !== "xs" && "rounded-pill")} style={{ width: `${percent}%` }} />
    </div>
  );
}
