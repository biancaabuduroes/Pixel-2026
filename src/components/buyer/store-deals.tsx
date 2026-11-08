"use client";

import { useState } from "react";
import { cn } from "cn";
import { EmptyState } from "@/components/ds/empty-state";
import type { DealCard } from "@/server/buyer-queries";
import { SectionTitle } from "./buyer-screen";
import { GroupDealCard } from "./group-deal-card";

/** Category chips + product list for one store (B3.6). Filtering stays in the browser. */
export function StoreDeals({ cards, categories }: { cards: DealCard[]; categories: readonly { value: string; label: string }[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const visible = category ? cards.filter((c) => c.category === category) : cards;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label="Categorii magazin" className="-mx-page flex gap-2 overflow-x-auto px-page [scrollbar-width:none]">
          {[{ value: null, label: "Toate" }, ...categories].map((c) => {
            const selected = c.value === category;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(c.value)}
                aria-pressed={selected}
                className={cn(
                  "flex h-control-sm shrink-0 items-center rounded-pill px-4 label-md outline-none focus-visible:ring-2 focus-visible:ring-border-strong",
                  selected ? "bg-bg-action text-text-inverse" : "bg-bg-muted text-text-primary",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </nav>
      )}
      <section className="flex flex-col gap-3">
        <SectionTitle>
          {category ? categories.find((c) => c.value === category)?.label : "Toate produsele"} · {visible.length}
        </SectionTitle>
        {visible.length === 0 ? (
          <EmptyState icon="users-96-brand" title="Niciun grup deschis" body="Acest magazin nu are grupuri deschise pe filtrul ales." />
        ) : (
          visible.map((c) => (
            <GroupDealCard key={c.productId} productId={c.productId} name={c.name} closesAt={c.closesAt} offer={c.offer} basketItems={c.itemCount} imageUrl={c.imageUrl} />
          ))
        )}
      </section>
    </>
  );
}
