import { cn } from "cn";

/** Shared chrome for seller analytics surfaces — flat, hairline, generous padding. */
export function SellerPanel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-bg-surface shadow-card",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SellerPanelHeader({
  title,
  description,
  trailing,
  id,
}: {
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 id={id} className="title-md text-text-primary">
          {title}
        </h2>
        {description && <p className="mt-1 body-sm text-text-secondary">{description}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
