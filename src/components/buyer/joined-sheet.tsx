"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { Icon } from "@/components/ds/icon";
import { SummaryRow } from "@/components/ds/summary-row";
import { Timeline } from "@/components/ds/timeline";
import { Button, buttonVariants } from "@/components/ui/button";
import type { GroupOffer } from "@/domain/ai";
import { formatRon, multiplyBani } from "@/domain/money";
import { dayLabel, formatToken, timeLabel } from "@/lib/format";
import { GroupProgressBar } from "./group-progress-bar";

/** What the join server action returned (server-computed). */
export type Joined = { quantity: number; committedUnitPrice: number; reservedAmount: number };

/** Figma B4.1 "Joined" sheet: confirmation, funds lock card, live progress, what happens next. */
export function JoinedSheet({
  joined,
  productName,
  storeName,
  closesAt,
  offer,
  onDone,
}: {
  joined: Joined;
  productName: string;
  storeName: string;
  closesAt: Date;
  offer: GroupOffer;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(true);
  // Estimate only (BL §11): never above the locked price.
  const estimatedUnit = Math.min(offer.probableUnitPrice, joined.committedUnitPrice);
  const estimatedBack = joined.reservedAmount - multiplyBani(joined.quantity, estimatedUnit);
  const close = () => {
    setOpen(false);
    onDone();
  };

  return (
    <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Ești în grup!" header="left">
      <p className="flex items-center gap-2 body-sm text-text-secondary">
        <Icon name="check-circle-20-success" size={16} />
        {productName} · {storeName}
      </p>

      <section className="flex flex-col rounded-lg border border-border-default p-4">
        <div className="flex items-start gap-3 pb-2">
          <span className="flex size-control-md shrink-0 items-center justify-center rounded-pill bg-bg-inverse">
            <Icon name="lock-20-inverse" size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="title-md text-text-primary">Ai blocat {formatToken(joined.reservedAmount)}</p>
            <p className="body-sm text-text-secondary">La închidere plătești prețul final. Diferența îți revine automat în portofel.</p>
          </div>
          <p className="shrink-0 display-sm text-text-primary">{formatToken(joined.reservedAmount)}</p>
        </div>
        <SummaryRow label={`Preț maxim (blocat acum)${joined.quantity > 1 ? ` · ${joined.quantity} buc` : ""}`} value={formatRon(joined.committedUnitPrice)} />
        <SummaryRow label="Preț final estimat" value={formatRon(estimatedUnit)} />
        <SummaryRow label="Diferența îți revine automat" value={`+${formatRon(estimatedBack)}`} emphasis divider={false} />
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-border-default p-4">
        <p className="title-md text-text-primary">Ai adus grupul mai aproape</p>
        <GroupProgressBar offer={offer} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="title-lg text-text-primary">Ce urmează</h3>
        <Timeline
          steps={[
            { label: "Grupul se închide", caption: `${dayLabel(closesAt, new Date())}, la ${timeLabel(closesAt)}`, state: "current" },
            { label: "Plătești prețul final", caption: "Diferența revine automat în portofel", state: "upcoming" },
            { label: "Ridici comanda", caption: `${storeName} · cu codul din Profil`, state: "upcoming" },
          ]}
        />
      </section>

      <Button className="w-full" onClick={close}>
        Am înțeles
      </Button>
      <Link href="/" className={buttonVariants({ variant: "link", size: "md", className: "self-center" })}>
        Înapoi la Acasă
      </Link>
    </BottomSheet>
  );
}
