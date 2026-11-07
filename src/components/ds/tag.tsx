import { cn } from "cn";
import { Icon, type FigmaIconName } from "./icon";

const SOFT = {
  neutral: "bg-bg-muted text-text-primary",
  brand: "bg-bg-brand-soft text-text-brand",
  deal: "bg-bg-deal-soft text-text-deal",
  success: "bg-bg-success-soft text-text-success",
  danger: "bg-bg-danger-soft text-text-danger",
  info: "bg-bg-info-soft text-text-info",
  surface: "bg-bg-surface text-text-primary shadow-card",
} as const;

/** Figma: Tag (node 11:198). 1–2 word label; the tone carries meaning. Soft style. */
export function Tag({ tone, icon, children, className }: { tone: keyof typeof SOFT; icon?: FigmaIconName; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 label-sm whitespace-nowrap", SOFT[tone], className)}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </span>
  );
}
