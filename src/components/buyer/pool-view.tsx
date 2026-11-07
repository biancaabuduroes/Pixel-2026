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
import { Tag } from "@/components/ds/tag";
import { Button, buttonVariants } from "@/components/ui/button";
import { tierLadder, type Segment } from "@/domain/ai";
import { formatRon, multiplyBani } from "@/domain/money";
import { dayLabel, formatToken, inDuration, priceNumber, timeLabel } from "@/lib/format";
import { joinGroupAction } from "@/server/actions/buyer";
import type { PoolGroup } from "@/server/buyer-queries";
import { DealCountdown } from "./deal-countdown";
import { GroupProgressBar } from "./group-progress-bar";
import { JoinedSheet, type Joined } from "./joined-sheet";
import { useGroupProgress } from "./use-group-progress";

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
  const headline = group?.offer ?? null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg-canvas pb-44">
      <Hero name={product.name} imageUrl={product.imageUrl} description={product.description} store={product.pickupLocation.name} discountPct={headline?.discountPct ?? 0} />
      <main className="flex flex-col gap-6 px-page pt-4">
        {group ? (
          <GroupSection key={group.id} {...props} group={group} onSelect={setGroupId} />
        ) : (
          <EmptyState icon="users-96-brand" title="Niciun grup deschis" body="Grupurile pentru acest produs s-au închis. Un grup nou se deschide automat cât timp există stoc." />
        )}
      </main>
    </div>
  );
}

function Hero({ name, imageUrl, description, store, discountPct }: { name: string; imageUrl: string | null; description: string; store: string; discountPct: number }) {
  return (
    <section className="relative flex h-110 flex-col justify-end overflow-hidden bg-bg-brand-soft px-page pb-6">
      {imageUrl ? (
        // Product photo above the title; the gradient below keeps the white title readable.
        <ProductImage src={imageUrl} alt={name} priority className="absolute inset-x-0 top-0 h-[300px]" />
      ) : (
        <>
          <Icon name="hero-ellipse-1" size={260} className="absolute top-[170px] -left-[70px] opacity-60" />
          <Icon name="hero-ellipse-2" size={140} className="absolute top-[68px] -right-[40px]" />
          <Icon name="bag-150-brand" size={150} className="absolute top-[50px] left-1/2 -translate-x-1/2" />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-b from-transparent to-bg-inverse/70" aria-hidden />
      <Link
        href="/"
        aria-label="Înapoi"
        className="absolute top-14 left-page flex size-control-md items-center justify-center rounded-pill bg-bg-surface shadow-raised outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
      >
        <Icon name="chevron-left-22" size={22} />
      </Link>
      <div className="relative flex flex-col items-start gap-2 text-text-inverse">
        {discountPct > 0 && <span className="rounded-pill bg-bg-deal px-2 py-0.5 label-sm text-text-primary">-{discountPct}%</span>}
        <h1 className="display-lg">{name}</h1>
        <p className="body-lg">{description}</p>
        <p className="flex items-center gap-2 body-md">
          <Icon name="store-16-inverse" size={16} />
          {store}
        </p>
      </div>
    </section>
  );
}

function GroupSection({ product, groups, recommendedGroupId, availableBalance, activeCommitment, stockRemaining, signedIn, group, onSelect }: Props & { group: PoolGroup; onSelect: (id: string) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const live = useGroupProgress(group.id, { status: "OPEN", buyers: group.buyers, offer: group.offer });
  const offer = live.offer;
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<Joined | null>(null);
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

  function join() {
    setError(null);
    startTransition(async () => {
      const result = await joinGroupAction({ groupId: group.id, quantity });
      if (!result.ok) {
        setError(JOIN_ERRORS[result.reason] ?? JOIN_ERRORS.INVALID_INPUT);
        return;
      }
      setJoined({ quantity, committedUnitPrice: result.committedUnitPrice, reservedAmount: result.reservedAmount });
      await queryClient.invalidateQueries({ queryKey: ["group-progress", group.id] });
    });
  }

  return (
    <>
      {segments.length > 1 && (
        <SegmentedControl
          label="Alege grupul"
          options={segments.map((g) => ({ value: g.id, label: SEGMENT_LABEL[g.segment!] }))}
          value={group.id}
          onValueChange={onSelect}
        />
      )}

      <section className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-4" aria-label="Prețul grupului">
        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="display-xl text-text-primary">{formatRon(offer.currentUnitPrice)}</span>
            {offer.discountPct > 0 && <s className="body-sm text-text-secondary">{formatRon(offer.baseUnitPrice)}</s>}
          </p>
          <p className="body-md text-text-secondary">
            Probabil plătești {formatRon(offer.probableUnitPrice)} (estimare). Niciodată peste {formatRon(offer.currentUnitPrice)}.
          </p>
        </div>
        <GroupProgressBar offer={offer} />
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          <div className="flex items-center justify-between gap-2 body-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Icon name="users-14" size={14} />
              {live.buyers} {live.buyers === 1 ? "cumpărător" : "cumpărători"} în grup
            </span>
            <DealCountdown closesAt={closesAt.toISOString()} />
          </div>
          <p className="flex items-center gap-1.5 body-sm text-text-secondary">
            <Icon name="store-14" size={14} />
            Se închide {inDuration(closesAt.getTime() - now)}.{group.id === recommendedGroupId && groups.length > 1 ? " Recomandat pentru tine." : ""}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="title-xl text-text-primary">Prețuri pe trepte</h2>
        <ol className="grid grid-cols-3 gap-2">
          {tierLadder(product.priceTiers, offer).map((t) => (
            <li
              key={t.minQty}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border px-2 py-3 text-center",
                t.state === "passed" && "border-border-default bg-bg-subtle text-text-secondary",
                t.state === "current" && "border-bg-deal bg-bg-deal text-text-primary",
                (t.state === "probable" || t.state === "upcoming") && "border-border-default bg-bg-surface text-text-primary",
              )}
            >
              <span className="title-md">{t.maxQty === null ? `${t.minQty}+` : `${t.minQty}–${t.maxQty}`}</span>
              <span className="body-sm text-text-secondary">unități</span>
              {t.state === "passed" ? <s className="title-md">{priceNumber(t.unitPrice)}</s> : <span className="title-md">{priceNumber(t.unitPrice)}</span>}
              {t.state === "current" && <span className="mt-0.5 rounded-pill bg-bg-inverse px-2 label-sm text-text-inverse">Acum</span>}
              {t.state === "probable" && <Tag tone="deal" className="mt-0.5">Probabil</Tag>}
            </li>
          ))}
        </ol>
        {offer.next && offer.forecast && (
          <p className="caption text-text-secondary">
            Estimare AI: șanse {CHANCE[offer.forecast]} ca grupul să ajungă la {formatRon(offer.next.unitPrice)} până la închidere. Nu e o garanție.
          </p>
        )}
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

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[430px] flex-col gap-3 bg-bg-surface px-page pt-3 pb-6 shadow-sheet">
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
            {product.perBuyerCap > 1 && !soldOut && (
              <div className="flex items-center justify-between">
                <span className="label-md text-text-primary">Cantitate</span>
                <QuantityStepper label="Cantitate" value={quantity} max={maxQty} onChange={setQuantity} />
              </div>
            )}
            <Button className="w-full" disabled={pending || soldOut || closed || short} onClick={join}>
              {pending ? "Se blochează…" : `Intră în grup · max ${formatToken(lockAmount)}`}
            </Button>
            <p className="text-center caption text-text-secondary">Toți plătesc prețul final. Diferența îți revine automat.</p>
          </>
        )}
      </div>

      <BottomSheet open={pickupOpen} onOpenChange={setPickupOpen} title="Ridicare">
        <p className="title-md text-text-primary">{product.pickupLocation.name}</p>
        <p className="body-md text-text-secondary">{product.pickupLocation.address}</p>
        <p className="body-md text-text-primary">Program: {product.pickupLocation.openingHours}</p>
        <p className="body-sm text-text-secondary">Comanda e gata de ridicare după închiderea grupului. Primești codul de ridicare în Profil.</p>
      </BottomSheet>

      {joined && (
        <JoinedSheet
          joined={joined}
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
