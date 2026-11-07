import { Suspense } from "react";
import { PickupCode } from "@/components/buyer/pickup-code";
import { formatRon } from "@/domain/money";
import { pickupCodeFor } from "@/server/pickup-code";
import { buyerOrdersAwaitingPickup, requestOrigin } from "@/server/queries";
import { currentUser } from "@/server/session";

export default function PurchasesPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">My purchases</h1>
      {/* Reads the session cookie, so it renders at request time (Next.js Cache Components). */}
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <ReadyForPickup />
      </Suspense>
    </main>
  );
}

async function ReadyForPickup() {
  const buyer = await currentUser("BUYER");
  if (!buyer) return <p className="text-muted-foreground">Choose a buyer account to see your purchases.</p>;
  const [orders, origin] = await Promise.all([buyerOrdersAwaitingPickup(buyer.id), requestOrigin()]);
  if (orders.length === 0) return <p className="text-muted-foreground">Nothing is ready for pickup yet.</p>;

  return (
    <section className="flex flex-col gap-4" aria-label="Ready for pickup">
      <h2 className="text-lg font-medium">Ready for pickup</h2>
      {orders.map((o) => {
        const code = pickupCodeFor(o.id);
        const url = `${origin}/seller/pickup?order=${encodeURIComponent(o.id)}&code=${code}`;
        const location = o.product.pickupLocation;
        return (
          <article key={o.id} className="flex flex-col gap-3 rounded-2xl border p-4">
            <div>
              <h3 className="font-medium">
                {o.quantity} × {o.product.name}
              </h3>
              <p className="text-sm text-muted-foreground">Paid {o.amountCharged === null ? "–" : formatRon(o.amountCharged)}</p>
              <p className="text-sm">
                {location.name}, {location.address} · {location.openingHours}
              </p>
              {o.pickupDeadline && <p className="text-sm text-muted-foreground">Collect by {o.pickupDeadline.toLocaleDateString("ro-RO")}</p>}
            </div>
            <PickupCode code={code} url={url} />
          </article>
        );
      })}
    </section>
  );
}
