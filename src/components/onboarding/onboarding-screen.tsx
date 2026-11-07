import { cn } from "cn";
import { OnboardingNavBar } from "@/components/ds/nav-bar";

/**
 * Shared frame of every onboarding screen (Figma 390-wide frames): optional NavBar, then a
 * content column (inset 16, 24 top, 32 bottom, 16 gap) whose footer sits at the bottom.
 * On wider screens the column stays phone-width and centred.
 */
export function OnboardingScreen({
  nav,
  children,
  footer,
  gap = "gap-4",
  className,
}: {
  nav?: { backHref: string; step: number; totalSteps: number; trailing?: React.ReactNode };
  children: React.ReactNode;
  footer?: React.ReactNode;
  gap?: "gap-4" | "gap-3";
  className?: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg-canvas">
      {nav && <OnboardingNavBar {...nav} />}
      <main className={cn("flex flex-1 flex-col px-page pt-6 pb-8", gap, className)}>
        {children}
        {footer && <div className={cn("mt-auto flex flex-col pt-4", gap)}>{footer}</div>}
      </main>
    </div>
  );
}

/** Figma Display/display-lg screen title, centred. */
export function ScreenTitle({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "left" }) {
  return <h1 className={cn("w-full display-lg text-text-primary", align === "center" ? "text-center" : "text-left")}>{children}</h1>;
}

/** Figma Text/body-lg lead under the title, secondary colour, centred. */
export function ScreenLead({ children }: { children: React.ReactNode }) {
  return <p className="w-full text-center body-lg text-text-secondary">{children}</p>;
}
