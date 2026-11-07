import { Icon, type FigmaIconName } from "./icon";

/** Figma: EmptyState (node 36:341). 72px brand-soft circle with icon, display title, short body. */
export function EmptyState({ icon, title, body }: { icon: FigmaIconName; title: string; body: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 px-6 py-8 text-center">
      <div className="pb-2">
        <div className="flex size-18 items-center justify-center rounded-pill bg-bg-brand-soft">
          <Icon name={icon} size={32} />
        </div>
      </div>
      <p className="display-md text-text-primary">{title}</p>
      <p className="max-w-[295px] body-md text-text-secondary">{body}</p>
    </div>
  );
}
