import { cn } from "cn";
import { Icon, type FigmaIconName } from "./icon";

const TONES = {
  neutral: "bg-bg-subtle",
  info: "bg-bg-info-soft",
  success: "bg-bg-success-soft",
  danger: "bg-bg-danger-soft",
  deal: "bg-bg-deal-soft",
} as const;

/**
 * Figma: InlineAlert (node 35:308). Contextual note: Neutral, Info, Success (money back),
 * Danger, Deal (price/budget hints). Optional bold title; icon swapped per message.
 */
export function InlineAlert({
  tone,
  icon,
  title,
  children,
  className,
}: {
  tone: keyof typeof TONES;
  icon: FigmaIconName;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full items-start gap-3 rounded-md px-4 py-3", TONES[tone], className)}>
      <Icon name={icon} size={20} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-text-primary">
        {title && <p className="title-sm">{title}</p>}
        <p className="body-compact">{children}</p>
      </div>
    </div>
  );
}
