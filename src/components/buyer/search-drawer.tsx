"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { Icon } from "@/components/ds/icon";
import { formatRon } from "@/domain/money";
import type { DealCard } from "@/server/buyer-queries";

const RECENT_KEY = "bd_recent_search";
const RECENT_COUNT = 3;
const SUGGESTED_COUNT = 6;

/** "Căutate recent" = products opened from search, kept in this browser only (decision 2026-11-07). */
export function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
function rememberOpened(productId: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([productId, ...readRecent().filter((id) => id !== productId)].slice(0, RECENT_COUNT)));
  } catch {
    // Storage blocked (private mode): recent searches are a convenience only.
  }
}

/** Case- and diacritic-insensitive: "servetele" finds "Șervețele". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Figma B3.2 Search drawer (85:4587): recent rows, "Propuse pentru tine" rail, search field at the bottom. */
export function SearchDrawer({ open, onOpenChange, cards, recentIds }: { open: boolean; onOpenChange: (open: boolean) => void; cards: DealCard[]; recentIds: string[] }) {
  const [query, setQuery] = useState("");

  function change(next: boolean) {
    if (!next) setQuery("");
    onOpenChange(next);
  }

  const term = fold(query.trim());
  const results = term ? cards.filter((c) => fold(c.name).includes(term)) : [];
  const recent = recentIds.map((id) => cards.find((c) => c.productId === id)).filter((c): c is DealCard => !!c);
  // Suggested: the biggest discounts right now (server-computed offers).
  const suggested = [...cards].sort((a, b) => b.offer.discountPct - a.offer.discountPct).slice(0, SUGGESTED_COUNT);

  return (
    <BottomSheet open={open} onOpenChange={change} title="Caută" header="nav">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-28">
        {term ? (
          <Section title={results.length ? "Rezultate" : `Niciun rezultat pentru „${query.trim()}”`}>
            {results.map((c) => (
              <Row key={c.productId} card={c} />
            ))}
          </Section>
        ) : (
          <>
            {recent.length > 0 && (
              <Section title="Căutate recent">
                {recent.map((c) => (
                  <Row key={c.productId} card={c} />
                ))}
              </Section>
            )}
            <Section title="Propuse pentru tine">
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                {suggested.map((c) => (
                  <Link key={c.productId} href={`/produs/${c.productId}`} onClick={() => rememberOpened(c.productId)} className="flex w-39 shrink-0 flex-col gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                    <span className="relative size-39 overflow-hidden rounded-lg bg-bg-brand-soft">
                      <Icon name="card-ellipse-brand" size={88} className="absolute top-[92px] -left-6" />
                      <Icon name="bag-56-brand" size={56} className="absolute top-[50px] left-[50px]" />
                      {c.offer.discountPct > 0 && <span className="absolute top-2 left-2 rounded-pill bg-bg-deal px-2 py-0.5 label-sm text-text-primary">-{c.offer.discountPct}%</span>}
                    </span>
                    <span className="truncate title-sm text-text-primary">{c.name}</span>
                    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                      <span className="title-lg text-text-primary">{formatRon(c.offer.currentUnitPrice)}</span>
                      {c.offer.discountPct > 0 && <s className="body-sm text-text-secondary">{formatRon(c.offer.baseUnitPrice)}</s>}
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>

      {/* SearchDock · Rest: white 60px pill, above the keyboard. */}
      <div className="absolute inset-x-4 bottom-6">
        <label className="flex h-15 items-center gap-3 rounded-pill bg-bg-canvas pr-4 pl-5 shadow-raised">
          <Icon name="search-24" size={24} />
          <span className="sr-only">Caută produse</span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent body-lg text-text-primary outline-none placeholder:text-text-primary placeholder:opacity-70 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query.length > 0 && (
            <button type="button" aria-label="Șterge căutarea" onClick={() => setQuery("")} className="flex size-6 items-center justify-center rounded-pill bg-bg-muted">
              <Icon name="close-12" size={12} />
            </button>
          )}
        </label>
      </div>
    </BottomSheet>
  );

}

function Row({ card }: { card: DealCard }) {
  return (
    <Link href={`/produs/${card.productId}`} onClick={() => rememberOpened(card.productId)} className="flex min-h-16 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
      <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-bg-deal-soft">
        <Icon name="bag-24-deal" size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate title-sm text-text-primary">{card.name}</span>
        <span className="truncate body-sm text-text-secondary">
          {card.groupCount} {card.groupCount === 1 ? "grup" : "grupuri"} · {card.buyers} în grup · de la {formatRon(card.fromUnitPrice)}
        </span>
      </span>
      <Icon name="chevron-right-20" size={20} />
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 py-4">
      <h3 className="title-lg text-text-primary">{title}</h3>
      {children}
    </section>
  );
}
