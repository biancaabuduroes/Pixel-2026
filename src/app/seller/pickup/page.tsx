import { Suspense } from "react";
import Link from "next/link";
import { PickupCodeForm } from "@/components/seller/pickup-code-form";
import { formatRon } from "@/domain/money";
import { sellerOrdersAwaitingPickup } from "@/server/queries";
import { currentUser } from "@/server/session";

/** Opened by scanning the buyer's QR (?order=…&code=…), or filtered by ?group= from group details. */
export default function SellerPickupPage({ searchParams }: PageProps<"/seller/pickup">) {
  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="body-sm text-text-secondary">
          <Link href="/seller" className="underline-offset-4 hover:underline">
            Dashboard
          </Link>{" "}
          / Ridicări
        </p>
        <h1 className="display-lg text-text-primary">Confirmă ridicarea</h1>
      </div>
      <Suspense fallback={<p className="body-md text-text-secondary">Se încarcă…</p>}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Orders({ searchParams }: { searchParams: PageProps<"/seller/pickup">["searchParams"] }) {
  const params = await searchParams;
  const scanned = typeof params.order === "string" ? params.order : undefined;
  const code = typeof params.code === "string" && /^\d{6}$/.test(params.code) ? params.code : undefined;
  const groupId = typeof params.group === "string" ? params.group : undefined;

  const seller = await currentUser("SELLER");
  if (!seller) return <p className="body-md text-text-secondary">Intră în contul de vânzător ca să confirmi ridicări.</p>;
  const orders = await sellerOrdersAwaitingPickup(seller.id, groupId);

  if (orders.length === 0) {
    return (
      <p className="body-md text-text-secondary">
        Nicio comandă nu așteaptă ridicarea{groupId ? " pentru acest grup" : ""}.{" "}
        <Link href="/seller/grupuri" className="text-text-brand underline-offset-4 hover:underline">
          Înapoi la grupuri
        </Link>
      </p>
    );
  }

  const sorted = [...orders].sort((a, b) => Number(b.id === scanned) - Number(a.id === scanned));
  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((o) => (
        <li key={o.id} className={`flex flex-col gap-3 rounded-lg border bg-bg-surface p-4 shadow-card ${o.id === scanned ? "border-border-brand" : "border-border-default"}`}>
          <div>
            <p className="title-md text-text-primary">
              {o.buyer.name} · {o.quantity} × {o.product.name}
            </p>
            <p className="body-sm text-text-secondary">
              {o.amountCharged === null ? "–" : formatRon(o.amountCharged)}
              {o.pickupDeadline && ` · de ridicat până pe ${o.pickupDeadline.toLocaleDateString("ro-RO")}`}
            </p>
          </div>
          <PickupCodeForm commitmentId={o.id} defaultCode={o.id === scanned ? code : undefined} />
        </li>
      ))}
    </ul>
  );
}
