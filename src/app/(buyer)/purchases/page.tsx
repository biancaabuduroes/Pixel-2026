import { Suspense } from "react";
import { PickupCode } from "@/components/buyer/pickup-code";
import { formatRon } from "@/domain/money";
import { pickupCodeFor } from "@/server/pickup-code";
import { buyerOrdersAwaitingPickup, requestOrigin } from "@/server/queries";
import { currentUser } from "@/server/session";

export default function PurchasesPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="display-lg">Achizițiile mele</h1>
      {/* Reads the session cookie, so it renders at request time (Next.js Cache Components). */}
      <Suspense fallback={<p className="text-muted-foreground">Se încarcă…</p>}>
        <ReadyForPickup />
      </Suspense>
    </main>
  );
}

async function ReadyForPickup() {
  const buyer = await currentUser("BUYER");
  if (!buyer) return <p className="text-muted-foreground">Intră în contul de cumpărător ca să-ți vezi achizițiile.</p>;
  const [orders, origin] = await Promise.all([buyerOrdersAwaitingPickup(buyer.id), requestOrigin()]);
  if (orders.length === 0) return <p className="text-muted-foreground">Nimic nu e gata de ridicare încă.</p>;

  return (
    <section className="flex flex-col gap-4" aria-label="Gata de ridicare">
      <h2 className="title-lg">Gata de ridicare</h2>
      {orders.map((o) => {
        const code = pickupCodeFor(o.id);
        const url = `${origin}/seller/pickup?order=${encodeURIComponent(o.id)}&code=${code}`;
        const location = o.product.pickupLocation;
        return (
          <article key={o.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div>
              <h3 className="title-md">
                {o.quantity} × {o.product.name}
              </h3>
              <p className="body-sm text-muted-foreground">Plătit {o.amountCharged === null ? "–" : formatRon(o.amountCharged)}</p>
              <p className="body-sm">
                {location.name}, {location.address} · {location.openingHours}
              </p>
              {o.pickupDeadline && <p className="body-sm text-muted-foreground">Ridică până pe {o.pickupDeadline.toLocaleDateString("ro-RO")}</p>}
            </div>
            <PickupCode code={code} url={url} />
          </article>
        );
      })}
    </section>
  );
}
