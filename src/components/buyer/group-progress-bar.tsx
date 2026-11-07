import type { GroupOffer } from "@/domain/ai";
import { formatRon } from "@/domain/money";
import { units } from "@/lib/format";

/** Figma pool price card / Joined sheet: 6px deal bar, "Încă N unități → price" and "a / b". */
export function GroupProgressBar({ offer }: { offer: GroupOffer }) {
  const target = offer.next?.minQty ?? offer.totalQty;
  const pct = target > 0 ? Math.min(100, Math.round((offer.totalQty * 100) / target)) : 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-muted" role="progressbar" aria-label="Progres grup" aria-valuemin={0} aria-valuemax={target} aria-valuenow={offer.totalQty}>
        <div className="h-full rounded-pill bg-bg-deal transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 body-sm">
        {offer.next ? (
          <span className="text-text-primary">
            Încă <b>{units(offer.next.unitsMissing)}</b> → <b>{formatRon(offer.next.unitPrice)}</b>
          </span>
        ) : (
          <span className="title-sm text-text-primary">Cel mai bun preț e atins</span>
        )}
        <span className="text-text-secondary">
          {offer.totalQty} / {target}
        </span>
      </div>
    </div>
  );
}
