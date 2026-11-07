import Link from "next/link";
import { Icon } from "./icon";

/**
 * Figma: NavBar · Type=Onboarding (node 15:50). 52px; back button (44px IconButton);
 * the title is hidden (screens use a Display title); 4px brand progress along the top edge.
 */
export function OnboardingNavBar({ backHref, step, totalSteps }: { backHref: string; step: number; totalSteps: number }) {
  const progress = Math.min(100, Math.round((step / totalSteps) * 100));
  return (
    <header className="relative flex h-navbar w-full shrink-0 items-center bg-bg-canvas px-1">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-bg-muted"
        role="progressbar"
        aria-label="Progres înregistrare"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={step}
      >
        <div className="h-full bg-bg-brand-strong transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <Link href={backHref} aria-label="Înapoi" className="flex size-control-md items-center justify-center rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
        <Icon name="chevron-left-24" size={24} />
      </Link>
    </header>
  );
}
