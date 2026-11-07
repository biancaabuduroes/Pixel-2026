"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { InlineAlert } from "@/components/ds/inline-alert";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { SummaryRow } from "@/components/ds/summary-row";
import { Tag } from "@/components/ds/tag";
import { Timeline } from "@/components/ds/timeline";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatRon } from "@/domain/money";
import { dayLabel, formatToken, initials, orderRef, timeLabel, units } from "@/lib/format";
import { cancelCommitmentAction } from "@/server/actions/buyer";
import { logoutAction } from "@/server/actions/onboarding";
import type { ProfileOrder } from "@/server/buyer-queries";

type Props = {
  user: { name: string; email: string; preferences: { firstName?: string; lastName?: string } };
  wallet: { available: number; reserved: number };
  history: { id: string; amount: number; type: string; createdAt: Date; productName: string | null }[];
  orders: ProfileOrder[];
};

const CURRENT = new Set(["ACTIVE", "AWAITING_PICKUP"]);
const STATUS: Record<string, { label: string; tone: "success" | "deal" | "neutral" | "danger" | "info" }> = {
  ACTIVE: { label: "În grup", tone: "deal" },
  AWAITING_PICKUP: { label: "Gata de ridicare", tone: "success" },
  COLLECTED: { label: "Ridicată", tone: "neutral" },
  EXPIRED_PAID: { label: "Neridicată", tone: "danger" },
  DISPUTED: { label: "În verificare", tone: "info" },
  REFUNDED: { label: "Rambursată", tone: "neutral" },
};
const HISTORY_LABEL: Record<string, string> = {
  TOPUP: "Încărcare",
  RESERVE: "Blocat în grup",
  RELEASE: "Deblocat (ai renunțat)",
  SETTLE: "Diferență returnată",
  REFUND: "Rambursare",
};
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ProfileView({ user, wallet, history, orders }: Props) {
  const [tab, setTab] = useState<"active" | "past">("active");
  const [howOpen, setHowOpen] = useState(false);
  const [codeFor, setCodeFor] = useState<ProfileOrder | null>(null);
  const name = [user.preferences.firstName, user.preferences.lastName].filter(Boolean).join(" ") || user.name;
  const active = orders.filter((o) => CURRENT.has(o.status));
  const past = orders.filter((o) => !CURRENT.has(o.status));
  const shown = tab === "active" ? active : past;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg-canvas">
      <header className="relative flex h-navbar shrink-0 items-center justify-center px-1">
        <Link href="/" aria-label="Înapoi" className="absolute left-1 flex size-control-md items-center justify-center rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
          <Icon name="chevron-left-24" size={24} />
        </Link>
        <h1 className="title-md text-text-primary">Profil</h1>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-page pt-2 pb-8">
        <section className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-bg-brand-soft title-lg text-text-brand" aria-hidden>
            {initials(name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="truncate title-lg text-text-primary">{name}</p>
            <p className="truncate body-sm text-text-secondary">{user.email}</p>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-lg bg-bg-subtle p-4" aria-label="Portofel">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 label-md text-text-secondary">
              <Icon name="wallet-14" size={14} />
              Portofel
            </span>
            <Tag tone="deal">1 bunToken = 1 RON</Tag>
          </div>
          <div>
            <p className="display-md text-text-primary">{formatToken(wallet.available)}</p>
            <p className="body-sm text-text-secondary">disponibili · {formatToken(wallet.reserved)} blocați în grupuri</p>
          </div>
          <div className="flex gap-2">
            <Link href="/onboarding/incarca" className={buttonVariants({ variant: "brand", size: "md", className: "flex-1 text-text-inverse" })}>
              Încarcă
            </Link>
            <Button variant="inverse" size="md" className="flex-1" onClick={() => setHowOpen(true)}>
              Cum funcționează
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="title-xl text-text-primary">Comenzile mele</h2>
          <SegmentedControl
            label="Comenzi"
            options={[
              { value: "active", label: `Active · ${active.length}` },
              { value: "past", label: "Anterioare" },
            ]}
            value={tab}
            onValueChange={setTab}
          />
          {shown.length === 0 ? (
            <EmptyState
              icon="users-96-brand"
              title={tab === "active" ? "Nicio comandă activă" : "Nicio comandă anterioară"}
              body={tab === "active" ? "Intră într-un grup de pe Acasă. Comanda apare aici." : "Comenzile ridicate apar aici."}
            />
          ) : (
            shown.map((o) => <OrderCard key={o.id} order={o} onShowCode={() => setCodeFor(o)} />)
          )}
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="title-xl text-text-primary">Istoric portofel</h2>
          {history.length === 0 ? (
            <p className="py-3 body-md text-text-secondary">Nicio mișcare încă.</p>
          ) : (
            <ul className="flex flex-col">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 border-b border-border-subtle py-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate label-md text-text-primary">
                      {HISTORY_LABEL[h.type] ?? h.type}
                      {h.productName ? ` · ${h.productName}` : ""}
                    </span>
                    <span className="body-sm text-text-secondary">
                      {capital(dayLabel(new Date(h.createdAt), new Date()))}, {timeLabel(new Date(h.createdAt))}
                    </span>
                  </span>
                  <span className={h.amount > 0 ? "shrink-0 title-sm text-text-success" : "shrink-0 title-sm text-text-primary"}>
                    {h.amount > 0 ? "+" : "−"}
                    {formatToken(Math.abs(h.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form action={logoutAction} className="flex justify-center">
          <Button type="submit" variant="link" size="md">
            Deconectează-te
          </Button>
        </form>
      </main>

      <BottomSheet open={howOpen} onOpenChange={setHowOpen} title="Cum funcționează">
        <Timeline
          steps={[
            { label: "Încarci bunToken", caption: "1 bunToken = 1 RON, bani demo", state: "current" },
            { label: "Blochezi prețul maxim", caption: "Când intri într-un grup", state: "upcoming" },
            { label: "Plătești prețul final", caption: "La închiderea grupului", state: "upcoming" },
            { label: "Diferența revine automat", caption: "Înapoi în portofel, disponibilă imediat", state: "upcoming" },
          ]}
        />
      </BottomSheet>

      {codeFor?.pickup && <PickupSheet order={codeFor} onClose={() => setCodeFor(null)} />}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="body-sm text-text-secondary">{label}</span>
      <span className="text-right title-sm text-text-primary">{value}</span>
    </div>
  );
}

function OrderCard({ order, onShowCode }: { order: ProfileOrder; onShowCode: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[order.status] ?? { label: order.status, tone: "neutral" as const };
  const inGroup = order.status === "ACTIVE";
  const now = new Date();
  const closesAt = new Date(order.closesAt);
  const deadline = order.pickupDeadline ? new Date(order.pickupDeadline) : null;

  function cancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelCommitmentAction({ commitmentId: order.id });
      if (r.ok) router.refresh();
      else setError(r.reason === "TIER_UNLOCKED" ? "Grupul a deblocat deja o reducere, așa că nu mai poți renunța." : "Nu mai poți renunța la acest grup.");
    });
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className={inGroup ? "flex size-12 shrink-0 items-center justify-center rounded-md bg-bg-deal-soft" : "flex size-12 shrink-0 items-center justify-center rounded-md bg-bg-brand-soft"}>
          <Icon name={inGroup ? "bag-24-deal" : "bag-24-brand"} size={24} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="title-sm text-text-primary">
            {order.product.name}
            {order.quantity > 1 ? ` × ${order.quantity}` : ""}
          </h3>
          <p className="body-sm text-text-secondary">Comanda {orderRef(order.id)}</p>
        </div>
        <Tag tone={status.tone}>{status.label}</Tag>
      </div>
      <div className="flex flex-col gap-2">
        <Detail label="Ridicare" value={order.product.pickupLocation.name} />
        {inGroup ? (
          <>
            <Detail label="Când" value={`După închidere: ${dayLabel(closesAt, now)}, ${timeLabel(closesAt)}`} />
            <Detail label="Blocat (preț maxim)" value={formatRon(order.reservedAmount)} />
            {order.offer?.next && <Detail label="Progres" value={`Încă ${units(order.offer.next.unitsMissing)} → ${formatRon(order.offer.next.unitPrice)}`} />}
          </>
        ) : (
          <>
            {deadline && order.status === "AWAITING_PICKUP" && <Detail label="Când" value={`${capital(dayLabel(deadline, now))}, până la ${timeLabel(deadline)}`} />}
            {order.amountCharged !== null && <Detail label="Plătit (preț final)" value={formatRon(order.amountCharged)} />}
          </>
        )}
      </div>
      {order.pickup && (
        <Button size="md" className="w-full" onClick={onShowCode}>
          <Icon name="scan-20-inverse" size={20} />
          Arată codul de ridicare
        </Button>
      )}
      {inGroup &&
        (order.cancelLockedBy === null ? (
          <Button variant="secondary" size="sm" className="self-start" disabled={pending} onClick={cancel}>
            {pending ? "Se deblochează…" : "Renunță la grup"}
          </Button>
        ) : (
          <InlineAlert tone="neutral" icon="lock-20">
            {order.cancelLockedBy === "TIER_UNLOCKED" ? "Grupul a deblocat o reducere: nu mai poți renunța, iar prețul nu mai poate crește." : "Grupul se închide: nu mai poți renunța."}
          </InlineAlert>
        ))}
      {error && <InlineAlert tone="danger" icon="info-24">{error}</InlineAlert>}
    </article>
  );
}

function PickupSheet({ order, onClose }: { order: ProfileOrder; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const pickup = order.pickup!;
  const deadline = order.pickupDeadline ? new Date(order.pickupDeadline) : null;
  const close = () => {
    setOpen(false);
    onClose();
  };
  return (
    <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Codul de ridicare" header="left">
      <p className="body-md text-text-secondary">Arată codul la casă. Angajatul îl scanează și primești comanda.</p>
      <div className="flex flex-col items-center gap-3">
        <div className="w-60 rounded-lg bg-bg-surface p-3 shadow-card" role="img" aria-label="Cod QR de ridicare" dangerouslySetInnerHTML={{ __html: pickup.qrSvg }} />
        <p className="title-lg text-text-primary">{orderRef(order.id)}</p>
      </div>
      <div className="flex flex-col">
        <SummaryRow label="Cod manual" value={<span className="title-md tracking-[0.2em]">{pickup.code}</span>} />
        <SummaryRow label="Produs" value={order.product.name} />
        <SummaryRow label="Magazin" value={order.product.pickupLocation.name} />
        {deadline && <SummaryRow label="Ridicare" value={`${capital(dayLabel(deadline, new Date()))}, până la ${timeLabel(deadline)}`} />}
        {order.amountCharged !== null && <SummaryRow label="Plătit (preț final)" value={formatRon(order.amountCharged)} emphasis divider={false} />}
      </div>
      <Button className="w-full" onClick={close}>
        Gata
      </Button>
      {/* Demo convenience: lets the presenter "scan" on the same laptop. */}
      <a href={pickup.url} className="self-center body-sm text-text-secondary underline underline-offset-4">
        Deschide pagina de confirmare a vânzătorului
      </a>
    </BottomSheet>
  );
}
