"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "cn";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { InlineAlert } from "@/components/ds/inline-alert";
import { ListRow } from "@/components/ds/list-row";
import { ProductImage } from "@/components/ds/product-image";
import { QuantityStepper } from "@/components/ds/quantity-stepper";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { Button, buttonVariants } from "@/components/ui/button";
import { tierLadder, type Segment } from "@/domain/ai";
import { formatRon, multiplyBani } from "@/domain/money";
import { isFirstDiscountUnlocked } from "@/domain/pricing";
import { dayLabel, formatToken, inDuration, priceNumber, timeLabel, units } from "@/lib/format";
import { joinGroupAction } from "@/server/actions/buyer";
import type { PoolGroup } from "@/server/buyer-queries";
import { DealCountdown } from "./deal-countdown";
import { ConfirmJoinSheet } from "./confirm-join-sheet";
import { JoinedSheet, type Joined } from "./joined-sheet";
import { useGroupProgress, type GroupProgressJson } from "./use-group-progress";

const SEGMENT_LABEL: Record<Segment, string> = { RAPID: "Rapid", ECHILIBRAT: "Echilibrat", CEL_MAI_IEFTIN: "Cel mai ieftin" };
const CHANCE = { LIKELY: "mari", POSSIBLE: "medii", UNLIKELY: "mici" } as const;

const JOIN_ERRORS: Record<string, string> = {
  GROUP_NOT_OPEN: "Grupul s-a închis între timp. Alege alt grup.",
  ALREADY_COMMITTED: "Ești deja într-un grup pentru acest produs.",
  INVALID_QUANTITY: "Cantitatea nu e permisă pentru acest produs.",
  INSUFFICIENT_STOCK: "Nu mai e destul stoc pentru cantitatea aleasă.",
  INSUFFICIENT_BALANCE: "Nu ai destui bunToken disponibili. Încarcă portofelul și încearcă din nou.",
  NOT_FOUND: "Grupul nu mai există.",
  UNAUTHORIZED: "Intră în cont ca să te alături grupului.",
  INVALID_INPUT: "Ceva n-a mers. Încearcă din nou.",
};

type Props = {
  product: {
    id: string;
    name: string;
    description: string;
    perBuyerCap: number;
    kind: "ITEM" | "BASKET";
    imageUrl: string | null;
    basketItems: { name: string; quantity: number }[];
    priceTiers: { minQty: number; unitPrice: number }[];
    pickupLocation: { name: string; address: string; openingHours: string };
  };
  groups: PoolGroup[];
  recommendedGroupId: string | null;
  availableBalance: number;
  activeCommitment: { id: string; groupId: string; quantity: number; reservedAmount: number } | null;
  stockRemaining: number;
  signedIn: boolean;
};

export function PoolView(props: Props) {
  const { product, groups } = props;
  const [groupId, setGroupId] = useState(props.activeCommitment?.groupId ?? props.recommendedGroupId ?? groups[0]?.id ?? null);
  const group = groups.find((g) => g.id === groupId) ?? groups[0] ?? null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg-canvas pb-44">
      {group ? (
        <ActivePool key={group.id} {...props} group={group} onSelect={setGroupId} />
      ) : (
        <>
          <Hero name={product.name} productId={product.id} imageUrl={product.imageUrl} discountPct={0} closesAt={null} />
          <main className="flex flex-col gap-6 px-page pt-5">
            <EmptyState icon="users-96-brand" title="Niciun grup deschis" body="Grupurile pentru acest produs s-au închis. Un grup nou se deschide automat cât timp există stoc." />
          </main>
        </>
      )}
    </div>
  );
}

function ActivePool({ group, onSelect, ...props }: Props & { group: PoolGroup; onSelect: (id: string) => void }) {
  const live = useGroupProgress(group.id, { status: "OPEN", buyers: group.buyers, offer: group.offer });
  return (
    <>
      <Hero name={props.product.name} productId={props.product.id} imageUrl={props.product.imageUrl} discountPct={live.offer.discountPct} closesAt={new Date(group.closesAt).toISOString()} />
      <main className="flex flex-col gap-6 px-page pt-5">
        <GroupSection {...props} group={group} live={live} onSelect={onSelect} />
      </main>
    </>
  );
}

function Hero({ name, productId, imageUrl, discountPct, closesAt }: { name: string; productId: string; imageUrl: string | null; discountPct: number; closesAt: string | null }) {
  return (
    <section className="relative h-[280px] overflow-hidden bg-bg-brand-soft">
      {imageUrl ? (
        // Product photo (#FFF1EC treatment, docs/PRODUCT_IMAGES.md); the bag icon stays as the fallback.
        <ProductImage src={imageUrl} alt={name} priority className="absolute inset-x-0 top-6 bottom-8" />
      ) : (
        <Icon name="bag-150-brand" size={96} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}
      <Link
        href="/"
        aria-label="Înapoi"
        className="absolute top-14 left-page flex size-11 items-center justify-center rounded-pill bg-bg-surface shadow-raised outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
      >
        <Icon name="chevron-left-22" size={22} />
      </Link>
      <button
        type="button"
        aria-label="Distribuie"
        onClick={() => {
          const url = `${window.location.origin}/produs/${productId}`;
          if (navigator.share) void navigator.share({ title: name, url }).catch(() => undefined);
          else void navigator.clipboard.writeText(url);
        }}
        className="absolute top-14 right-page flex size-11 items-center justify-center rounded-pill bg-bg-surface shadow-raised outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
      >
        <ShareIcon />
      </button>
      {closesAt && (
        <div className="absolute inset-x-page bottom-4 z-10 flex items-center justify-between gap-3">
          {discountPct > 0 ? (
            <span className="rounded-pill bg-bg-deal px-2.5 py-1 label-sm text-text-primary shadow-raised">−{discountPct}%</span>
          ) : (
            <span />
          )}
          <span className="rounded-pill bg-bg-surface px-2.5 py-1 shadow-raised">
            <DealCountdown closesAt={closesAt} />
          </span>
        </div>
      )}
      <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
        <span className="size-2 rounded-pill bg-text-primary" />
        <span className="size-2 rounded-pill bg-bg-strong" />
        <span className="size-2 rounded-pill bg-bg-strong" />
      </div>
    </section>
  );
}

function Fact({ icon, label }: { icon: "users-20-deal" | "lock-20" | "store-20-success"; label: string }) {
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <Icon name={icon} size={22} />
      <span className="body-sm text-text-secondary">{label}</span>
    </li>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M7.5 8.5 12.2 6M7.5 11.5l4.7 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="5.5" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14.2" cy="5.2" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14.2" cy="14.8" r="2.1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function GroupSection({ product, groups, recommendedGroupId, availableBalance, activeCommitment, stockRemaining, signedIn, group, live, onSelect }: Props & { group: PoolGroup; live: GroupProgressJson; onSelect: (id: string) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const offer = live.offer;
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<Joined | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const maxQty = Math.max(1, Math.min(product.perBuyerCap, stockRemaining));
  const lockAmount = multiplyBani(quantity, offer.currentUnitPrice); // preview; the server recalculates on join
  const soldOut = stockRemaining < 1;
  const closed = live.status !== "OPEN" || new Date(group.closesAt).getTime() <= now;
  const short = signedIn && !activeCommitment && availableBalance < lockAmount;
  const segments = groups.filter((g) => g.segment);
  const closesAt = new Date(group.closesAt);
  const pickupDay = dayLabel(closesAt, new Date(now));
  const tierTarget = offer.next?.minQty ?? offer.totalQty;
  const tierPct = tierTarget > 0 ? Math.min(100, Math.round((offer.totalQty * 100) / tierTarget)) : 100;

  function join() {
    setError(null);
    startTransition(async () => {
      const result = await joinGroupAction({ groupId: group.id, quantity });
      if (!result.ok) {
        setError(JOIN_ERRORS[result.reason] ?? JOIN_ERRORS.INVALID_INPUT);
        return;
      }
      setConfirmOpen(false);
      setJoined({ quantity, committedUnitPrice: result.committedUnitPrice, reservedAmount: result.reservedAmount });
      await queryClient.invalidateQueries({ queryKey: ["group-progress", group.id] });
    });
  }

  return (
    <>
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="title-xl text-text-primary">{product.name}</h1>
          <p className="flex items-center gap-1.5 body-sm text-text-secondary">
            <Icon name="store-14" size={14} />
            {product.pickupLocation.name}
            {group.id === recommendedGroupId && groups.length > 1 ? " · recomandat" : ""}
          </p>
        </div>
        <p className="flex items-baseline gap-2">
          <span className="display-lg text-text-primary">{formatRon(offer.currentUnitPrice)}</span>
          {offer.discountPct > 0 && <s className="body-md text-text-secondary">{formatRon(offer.baseUnitPrice)}</s>}
        </p>
        <p className="body-md text-text-secondary">{product.description}</p>
      </header>

      <ul className="grid grid-cols-3 gap-2 py-1">
        <Fact icon="users-20-deal" label="Preț de grup" />
        <Fact icon="lock-20" label="Plătești la final" />
        <Fact icon="store-20-success" label={`Ridici ${pickupDay}`} />
      </ul>

      {segments.length > 1 && (
        <SegmentedControl
          label="Alege grupul"
          options={segments.map((g) => ({ value: g.id, label: SEGMENT_LABEL[g.segment!] }))}
          value={group.id}
          onValueChange={onSelect}
        />
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4" aria-label="Prețul grupului">
        <h2 className="title-xl text-text-primary">Prețul grupului</h2>
        <div className="flex items-start justify-between gap-3">
          <p className="body-md text-text-primary">
            {offer.next ? (
              <>
                Încă <b>{units(offer.next.unitsMissing)}</b> și scade la <b>{formatRon(offer.next.unitPrice)}</b>
              </>
            ) : (
              "Cel mai bun preț e atins"
            )}
          </p>
          <span className="shrink-0 label-sm text-text-secondary">
            {offer.totalQty} / {tierTarget}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-muted" role="progressbar" aria-label="Progres grup" aria-valuemin={0} aria-valuemax={tierTarget} aria-valuenow={offer.totalQty}>
          <div className="h-full rounded-pill bg-bg-deal" style={{ width: `${tierPct}%` }} />
        </div>
        <ol className="grid grid-cols-3 gap-2">
          {tierLadder(product.priceTiers, offer).map((t) => (
            <li
              key={t.minQty}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-3 text-center",
                t.state === "current" ? "bg-bg-deal text-text-primary" : "bg-bg-subtle text-text-secondary",
              )}
            >
              <span className="body-sm">{t.maxQty === null ? `${t.minQty}+` : `${t.minQty}–${t.maxQty}`}</span>
              <span className="title-md text-text-primary">{priceNumber(t.unitPrice)}</span>
            </li>
          ))}
        </ol>
        <p className="caption text-text-secondary">
          Probabil plătești {formatRon(offer.probableUnitPrice)} (estimare). Niciodată peste {formatRon(offer.currentUnitPrice)}.
          {offer.next && offer.forecast ? ` Șanse ${CHANCE[offer.forecast]} să ajungă la pragul următor.` : ""} Se închide {inDuration(closesAt.getTime() - now)}.
        </p>
      </section>

      {product.kind === "BASKET" && product.basketItems.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="title-xl text-text-primary">Ce conține coșul</h2>
          <ul className="flex flex-col">
            {product.basketItems.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3 border-b border-border-subtle py-3 body-md">
                <span className="text-text-primary">{item.name}</span>
                <span className="shrink-0 text-text-secondary">× {item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="caption text-text-secondary">Coșul e definit de vânzător și se cumpără ca o singură unitate; pragurile de preț sunt în coșuri.</p>
        </section>
      )}

      <ListRow
        icon="calendar-24"
        title={`Ridici ${dayLabel(closesAt, new Date(now))}, după ${timeLabel(closesAt)}`}
        subtitle={`${product.pickupLocation.name}, ${product.pickupLocation.address}`}
        onClick={() => setPickupOpen(true)}
      />

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[430px] flex-col gap-2 border-t border-border-subtle bg-bg-surface px-page pt-3 pb-6">
        {error && <InlineAlert tone="danger" icon="info-24">{error}</InlineAlert>}
        {activeCommitment ? (
          <>
            <InlineAlert tone="success" icon="check-circle-20-success" title="Ești în grup">
              Ai blocat {formatToken(activeCommitment.reservedAmount)} pentru {activeCommitment.quantity} {activeCommitment.quantity === 1 ? "bucată" : "bucăți"}.
            </InlineAlert>
            <Link href="/profil" className={buttonVariants({ className: "w-full" })}>
              Vezi comanda în Profil
            </Link>
          </>
        ) : !signedIn ? (
          <Link href="/autentificare" className={buttonVariants({ className: "w-full" })}>
            Intră în cont ca să te alături
          </Link>
        ) : (
          <>
            {soldOut ? (
              <InlineAlert tone="neutral" icon="info-24" title="Stoc epuizat">
                Vânzătorul nu mai are stoc pentru acest produs.
              </InlineAlert>
            ) : closed ? (
              <InlineAlert tone="neutral" icon="clock-16-danger" title="Grup închis">
                Grupul s-a închis. Reîncarcă pagina pentru grupul următor.
              </InlineAlert>
            ) : short ? (
              <InlineAlert tone="danger" icon="wallet-20-secondary" title="Fonduri insuficiente">
                Ai {formatToken(availableBalance)} disponibili.{" "}
                <Link href="/onboarding/incarca" className="underline underline-offset-4">
                  Încarcă portofelul
                </Link>
              </InlineAlert>
            ) : null}
            <div className="flex items-center gap-3">
              <QuantityStepper label="Cantitate" value={quantity} max={maxQty} onChange={setQuantity} />
              <Button className="min-w-0 flex-1" disabled={pending || soldOut || closed || short} onClick={() => setConfirmOpen(true)}>
                {pending ? "Se blochează…" : `Intră în grup · ${priceNumber(offer.currentUnitPrice)}`}
              </Button>
            </div>
            <p className="text-center caption text-text-secondary">
              Blochezi max {formatToken(lockAmount)}. Toți plătesc prețul final; diferența îți revine automat.
            </p>
          </>
        )}
      </div>

      <BottomSheet open={pickupOpen} onOpenChange={setPickupOpen} title="Ridicare">
        <p className="title-md text-text-primary">{product.pickupLocation.name}</p>
        <p className="body-md text-text-secondary">{product.pickupLocation.address}</p>
        <p className="body-md text-text-primary">Program: {product.pickupLocation.openingHours}</p>
        <p className="body-sm text-text-secondary">Comanda e gata de ridicare după închiderea grupului. Primești codul de ridicare în Profil.</p>
      </BottomSheet>

      <ConfirmJoinSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        productName={product.name}
        storeName={product.pickupLocation.name}
        quantity={quantity}
        unitPrice={offer.currentUnitPrice}
        lockAmount={lockAmount}
        tierUnlocked={isFirstDiscountUnlocked(product.priceTiers, offer.totalQty)}
        joinUnlocksTier={!isFirstDiscountUnlocked(product.priceTiers, offer.totalQty) && isFirstDiscountUnlocked(product.priceTiers, offer.totalQty + quantity)}
        pending={pending}
        error={error}
        onConfirm={join}
      />

      {joined && (
        <JoinedSheet
          joined={joined}
          productId={product.id}
          productName={product.name}
          storeName={product.pickupLocation.name}
          closesAt={closesAt}
          offer={offer}
          onDone={() => {
            setJoined(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
