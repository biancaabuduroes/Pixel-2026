import { cn } from "cn";

type Step = { label: string; caption?: string; state: "current" | "upcoming" };

/**
 * Figma: GroupStatusTimeline (node 36:438) built from Timeline step (node 36:437).
 * Current = thick black ring + bold label; Upcoming = grey; the last step has no line.
 */
export function Timeline({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="flex w-full flex-col">
      {steps.map((s, i) => (
        <li key={s.label} className="flex w-full items-start gap-3">
          <div className="flex w-[22px] shrink-0 flex-col items-center gap-0.5 self-stretch">
            <span className={cn("size-[22px] shrink-0 rounded-pill bg-bg-surface", s.state === "current" ? "border-[6px] border-bg-action" : "border-2 border-bg-strong")} />
            {i < steps.length - 1 && <span className="w-0.5 flex-1 bg-border-default" />}
          </div>
          <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5 pb-5", s.state === "upcoming" && "text-text-secondary")}>
            <p className={s.state === "current" ? "title-md text-text-primary" : "body-md"}>{s.label}</p>
            {s.caption && <p className={cn("body-sm", s.state === "current" && "text-text-secondary")}>{s.caption}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
