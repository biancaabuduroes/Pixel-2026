import type { GroupOffer } from "@/domain/ai";
import { formatRon } from "@/domain/money";
import { units } from "@/lib/format";

/** Figma B4.1 progress: "Încă N unități și scade la price", count, then the 6px deal bar. */
export function GroupProgressBar({ offer }: { offer: GroupOffer }) {
  const target = offer.next?.minQty ?? offer.totalQty;
  const pct = target > 0 ? Math.min(100, Math.round((offer.totalQty * 100) / target)) : 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 body-sm">
        {offer.next ? (
          <p className="text-text-primary">
            Încă <b>{units(offer.next.unitsMissing)}</b> și scade la <b>{formatRon(offer.next.unitPrice)}</b>
          </p>
        ) : (
          <p className="title-sm text-text-primary">Cel mai bun preț e atins</p>
        )}
        <span className="shrink-0 text-text-secondary">
          {offer.totalQty} / {target}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-muted" role="progressbar" aria-label="Progres grup" aria-valuemin={0} aria-valuemax={target} aria-valuenow={offer.totalQty}>
        <div className="h-full rounded-pill bg-bg-deal transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
