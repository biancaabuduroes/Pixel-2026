"use client";

import { useState } from "react";
import { cn } from "cn";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import type { DealCard } from "@/server/buyer-queries";
import { SectionTitle } from "./buyer-screen";
import { GroupDealCard } from "./group-deal-card";
import { readRecent, SearchDrawer } from "./search-drawer";

const SOON_COUNT = 5;

/**
 * Home lists (B3.1). Filtering by category happens in the browser on data the server already
 * loaded, so tapping a chip is instant; the URL (?categorie=) is updated without a reload.
 * Each category splits into "Coșuri de cumpărături" (seller-defined baskets) and "Produse individuale".
 */
export function HomeDeals({ cards, categories, initialCategory }: { cards: DealCard[]; categories: readonly { value: string; label: string }[]; initialCategory: string | null }) {
  const [category, setCategory] = useState(initialCategory);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  function select(value: string | null) {
    setCategory(value);
    window.history.replaceState(null, "", value ? `/?categorie=${value}` : "/");
  }

  const visible = category ? cards.filter((c) => c.category === category) : cards;
  const soon = [...visible].sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()).slice(0, SOON_COUNT);
  const baskets = visible.filter((c) => c.kind === "BASKET");
  const items = visible.filter((c) => c.kind === "ITEM");
  const card = (c: DealCard, className?: string) => (
    <GroupDealCard key={c.productId} productId={c.productId} name={c.name} closesAt={c.closesAt} offer={c.offer} basketItems={c.itemCount} imageUrl={c.imageUrl} className={className} />
  );

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label="Categorii" className="-mx-page flex gap-2 overflow-x-auto px-page [scrollbar-width:none]">
          {[{ value: null, label: "Toate" }, ...categories].map((c) => {
            const selected = c.value === category;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => select(c.value)}
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

      {visible.length === 0 ? (
        <EmptyState icon="users-96-brand" title="Niciun grup deschis" body="Revino curând: grupurile noi apar aici imediat ce se deschid." />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <SectionTitle>Se închid curând</SectionTitle>
            <div className="-mx-page flex gap-3 overflow-x-auto px-page pb-1 [scrollbar-width:none]">{soon.map((c) => card(c, "w-[300px] shrink-0"))}</div>
          </section>
          {baskets.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Coșuri de cumpărături</SectionTitle>
              {baskets.map((c) => card(c))}
            </section>
          )}
          {items.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Produse individuale</SectionTitle>
              {items.map((c) => card(c))}
            </section>
          )}
        </>
      )}

      {/* Figma SearchDock · compact (85:4519): opens the Search drawer (B3.2, 85:4587). */}
      <button
        type="button"
        onClick={() => {
          setRecentIds(readRecent());
          setSearchOpen(true);
        }}
        className="fixed bottom-6 left-1/2 z-10 flex h-10 w-35 -translate-x-1/2 items-center gap-2 rounded-pill bg-bg-inverse pr-4 pl-3 text-left body-md text-text-inverse shadow-raised outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2"
      >
        <Icon name="search-20-inverse" size={20} />
        Caută
      </button>
      <SearchDrawer open={searchOpen} onOpenChange={setSearchOpen} cards={cards} recentIds={recentIds} />
    </>
  );
}
