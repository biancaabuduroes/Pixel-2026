"use client";

import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { Tag } from "@/components/ds/tag";
import { Button } from "@/components/ui/button";
import { formatRon } from "@/domain/money";
import { dayLabel } from "@/lib/format";
import type { CompareRow } from "@/server/buyer-queries";

/** B3.4 Compare sellers: same-category open groups, cheapest marked as the AI pick. */
export function CompareSellersSheet({
  open,
  onOpenChange,
  rows,
  currentProductId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: CompareRow[];
  currentProductId: string;
}) {
  const router = useRouter();
  const recommended = rows.find((r) => r.recommended) ?? null;
  const others = rows.filter((r) => r !== recommended);
  const now = new Date();

  function choose(productId: string) {
    onOpenChange(false);
    if (productId !== currentProductId) router.push(`/produs/${productId}`);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Compară vânzătorii" header="left">
      {rows.length === 0 ? (
        <p className="body-md text-text-secondary">Nu sunt alte grupuri deschise în această categorie.</p>
      ) : (
        <>
          {recommended && (
            <section className="flex flex-col gap-3 rounded-xl bg-bg-info-soft p-4">
              <Tag tone="info">Recomandat de AI</Tag>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="title-md text-text-primary">{recommended.storeName}</p>
                  <p className="body-sm text-text-secondary">{recommended.name}</p>
                </div>
                <p className="shrink-0 title-md text-text-primary">{formatRon(recommended.currentUnitPrice)}</p>
              </div>
              <p className="body-sm text-text-secondary">
                Cel mai mic preț curent din categorie · gata {dayLabel(new Date(recommended.closesAt), now)}.
              </p>
              <Button className="w-full" onClick={() => choose(recommended.productId)}>
                Alege
              </Button>
            </section>
          )}
          {others.length > 0 && (
            <section className="flex flex-col gap-1">
              <h3 className="title-md text-text-primary">Alte opțiuni</h3>
              <ul>
                {others.map((r) => (
                  <li key={r.productId}>
                    <button
                      type="button"
                      onClick={() => choose(r.productId)}
                      className="flex w-full items-start justify-between gap-3 border-b border-border-subtle py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
                    >
                      <span className="min-w-0">
                        <span className="block title-md text-text-primary">{r.storeName}</span>
                        <span className="block body-sm text-text-secondary">
                          {r.name} · gata {dayLabel(new Date(r.closesAt), now)}
                        </span>
                      </span>
                      <span className="shrink-0 title-md text-text-primary">{formatRon(r.currentUnitPrice)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="caption text-text-secondary">Prețurile sunt estimate pentru momentul închiderii și se ridică de la magazinul ales.</p>
        </>
      )}
    </BottomSheet>
  );
}
