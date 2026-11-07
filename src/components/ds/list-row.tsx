import { Icon, type FigmaIconName } from "./icon";

/** Figma: ListRow · Trailing=Chevron (node 15:105). ≥56px, hairline dividers, title-md + subtitle. */
export function ListRow({ icon, title, subtitle, onClick }: { icon: FigmaIconName; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <div className="w-full border-t border-border-subtle">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-14 w-full items-center gap-4 border-b border-border-subtle px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
      >
        <Icon name={icon} size={24} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="title-md text-text-primary">{title}</span>
          {subtitle && <span className="body-sm text-text-secondary">{subtitle}</span>}
        </span>
        <Icon name="chevron-right-20" size={20} />
      </button>
    </div>
  );
}
