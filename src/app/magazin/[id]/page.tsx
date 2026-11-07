import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StoreDeals } from "@/components/buyer/store-deals";
import { BuyerScreen } from "@/components/buyer/buyer-screen";
import { Icon } from "@/components/ds/icon";
import { dayLabel } from "@/lib/format";
import { CATEGORIES } from "@/lib/onboarding";
import { storePageData } from "@/server/buyer-queries";

/** B3.6 Supermarket page: one pickup location and its open groups. */
export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<BuyerScreen>{null}</BuyerScreen>}>
      <Store params={params} />
    </Suspense>
  );
}

async function Store({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const data = await storePageData(id, now);
  if (!data) notFound();
  const used = CATEGORIES.filter((c) => data.cards.some((card) => card.category === c.value));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg-canvas">
      <header className="relative flex h-navbar shrink-0 items-center justify-center px-1">
        <Link href="/" aria-label="Înapoi" className="absolute left-1 flex size-control-md items-center justify-center rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
          <Icon name="chevron-left-24" size={24} />
        </Link>
        <h1 className="title-md text-text-primary">{data.store.name.replace(/^Magazin partener /, "")}</h1>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-page pt-2 pb-8">
        <section className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-bg-brand-soft">
            <Icon name="bag-40-secondary" size={40} />
          </span>
          <div className="min-w-0">
            <p className="title-lg text-text-primary">{data.store.name}</p>
            <p className="body-sm text-text-secondary">{data.store.address}</p>
          </div>
        </section>
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-bg-subtle p-4">
          <div>
            <dt className="caption text-text-secondary">Grupuri active</dt>
            <dd className="title-md text-text-primary">{data.openGroupCount}</dd>
          </div>
          <div>
            <dt className="caption text-text-secondary">Ridicare</dt>
            <dd className="title-md text-text-primary">{data.nextClose ? dayLabel(data.nextClose, now) : "—"}</dd>
          </div>
          <div>
            <dt className="caption text-text-secondary">Program</dt>
            <dd className="title-sm text-text-primary">{data.store.openingHours}</dd>
          </div>
        </dl>
        <StoreDeals cards={data.cards} categories={used} />
      </main>
    </div>
  );
}
