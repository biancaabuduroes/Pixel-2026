import Link from "next/link";
import { cn } from "cn";
import { ProductImage } from "@/components/ds/product-image";
import type { GroupOffer } from "@/domain/ai";
import { formatRon } from "@/domain/money";
import { units } from "@/lib/format";
import { DealCountdown } from "./deal-countdown";

/** "Încă 7 unități → 89,99 RON", or the top-tier message. Exact numbers, not AI. */
export function nextTierText(offer: GroupOffer): string {
  return offer.next ? `Încă ${units(offer.next.unitsMissing)} → ${formatRon(offer.next.unitPrice)}` : "Cel mai bun preț e atins";
}

/** Figma: GroupDealCard (B3.1). Media with discount tag, title, price + struck base, next tier + countdown. */
export function GroupDealCard({
  productId,
  name,
  closesAt,
  offer,
  basketItems = 0,
  imageUrl = null,
  className,
}: {
  productId: string;
  name: string;
  closesAt: Date;
  offer: GroupOffer;
  /** Basket cards (not in Figma) add "Coș · N produse" under the title. */
  basketItems?: number;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <Link
      href={`/produs/${productId}`}
      className={cn("flex flex-col overflow-hidden rounded-lg border border-border-default bg-bg-surface outline-none focus-visible:ring-2 focus-visible:ring-border-strong", className)}
    >
      <div className="relative h-47">
        <ProductImage src={imageUrl} alt={name} iconSize={40} className="size-full" />
        {offer.discountPct > 0 && <span className="absolute top-3 left-3 rounded-pill bg-bg-deal px-2 py-0.5 label-sm text-text-primary">-{offer.discountPct}%</span>}
      </div>
      <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
        <h3 className="title-lg text-text-primary">{name}</h3>
        {basketItems > 0 && <p className="body-sm text-text-secondary">Coș · {basketItems} produse</p>}
        <p className="flex items-baseline gap-2">
          <span className="display-sm text-text-primary">{formatRon(offer.currentUnitPrice)}</span>
          {offer.discountPct > 0 && <s className="body-sm text-text-secondary">{formatRon(offer.baseUnitPrice)}</s>}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate body-sm text-text-secondary">{nextTierText(offer)}</span>
          <DealCountdown closesAt={new Date(closesAt).toISOString()} />
        </div>
      </div>
    </Link>
  );
}
