import { cn } from "cn";

/** Figma: PageDots (node 34:229). Active dot is a 24px black pill, others 8px grey. */
export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2" aria-label={`Pasul ${active + 1} din ${count}`} role="img">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn("h-2 rounded-pill", i === active ? "w-6 bg-bg-action" : "w-2 bg-bg-strong")} />
      ))}
    </div>
  );
}
