import { Suspense } from "react";
import { PickupCodeForm } from "@/components/seller/pickup-code-form";
import { formatRon } from "@/domain/money";
import { sellerOrdersAwaitingPickup } from "@/server/queries";
import { currentUser } from "@/server/session";

/** Opened by scanning the buyer's QR (?order=…&code=…), or directly to type a code. */
export default function SellerPickupPage({ searchParams }: PageProps<"/seller/pickup">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Confirm pickup</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Orders({ searchParams }: { searchParams: PageProps<"/seller/pickup">["searchParams"] }) {
  const params = await searchParams;
  const scanned = typeof params.order === "string" ? params.order : undefined;
  const code = typeof params.code === "string" && /^\d{6}$/.test(params.code) ? params.code : undefined;

  const seller = await currentUser("SELLER");
  if (!seller) return <p className="text-muted-foreground">Switch to the seller account to confirm pickups.</p>;
  const orders = await sellerOrdersAwaitingPickup(seller.id);
  if (orders.length === 0) return <p className="text-muted-foreground">No orders are waiting for pickup.</p>;

  // The scanned order first.
  const sorted = [...orders].sort((a, b) => Number(b.id === scanned) - Number(a.id === scanned));
  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((o) => (
        <li key={o.id} className={`flex flex-col gap-3 rounded-2xl border p-4 ${o.id === scanned ? "border-primary" : ""}`}>
          <div>
            <p className="font-medium">
              {o.buyer.name} · {o.quantity} × {o.product.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {o.amountCharged === null ? "–" : formatRon(o.amountCharged)}
              {o.pickupDeadline && ` · collect by ${o.pickupDeadline.toLocaleDateString("ro-RO")}`}
            </p>
          </div>
          <PickupCodeForm commitmentId={o.id} defaultCode={o.id === scanned ? code : undefined} />
        </li>
      ))}
    </ul>
  );
}
