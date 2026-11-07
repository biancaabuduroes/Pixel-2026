import { cn } from "cn";

/** Buyer-flow frame (Figma 390-wide): phone-width column, page inset, 24px between sections. */
export function BuyerScreen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg-canvas">
      <main className={cn("flex flex-1 flex-col gap-6 px-page pt-4 pb-8", className)}>{children}</main>
    </div>
  );
}

/** Figma section headings ("Grupurile mele", "Se închid curând"…): Title/title-xl. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="title-xl text-text-primary">{children}</h2>;
}
