import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HomeDeals } from "@/components/buyer/home-deals";
import { BuyerScreen, SectionTitle } from "@/components/buyer/buyer-screen";
import { Icon } from "@/components/ds/icon";
import { Tag } from "@/components/ds/tag";
import { formatRon } from "@/domain/money";
import { CATEGORIES } from "@/lib/onboarding";
import { dayLabel, units } from "@/lib/format";
import { homeData } from "@/server/buyer-queries";
import { currentProfile } from "@/server/session";

/** B3.1 Home: product list as group deal cards. src/proxy.ts sends new visitors to /onboarding first. */
export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<BuyerScreen>{null}</BuyerScreen>}>
      <HomeContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [profile, params] = await Promise.all([currentProfile(), searchParams]);
  if (profile?.role === "SELLER") redirect("/seller");
  const category = typeof params.categorie === "string" && CATEGORIES.some((c) => c.value === params.categorie) ? params.categorie : null;
  const now = new Date();
  const { cards, myGroups, totalSavings, stores, preferences } = await homeData(profile?.role === "BUYER" ? profile.id : null, now);

  const usedCategories = CATEGORIES.filter((c) => cards.some((card) => card.category === c.value));

  return (
    <BuyerScreen className="pb-24">
      <header className="flex items-center justify-between gap-3 pt-2">
        <Link href="/onboarding/locatie" className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
          <span className="flex size-control-md shrink-0 items-center justify-center rounded-md bg-bg-brand-soft">
            <Icon name="location-20-brand" size={20} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="body-sm text-text-secondary">Ridici din zona</span>
            <span className="flex items-center gap-1 title-md text-text-primary">
              <span className="truncate">
                {preferences.address ?? "Alege zona"}
                {preferences.radiusKm ? ` · ${preferences.radiusKm} km` : ""}
              </span>
              <Icon name="chevron-down-16" size={16} />
            </span>
          </span>
        </Link>
        <Link
          href={profile ? "/profil" : "/autentificare"}
          aria-label={profile ? "Profil" : "Intră în cont"}
          className="flex size-control-md shrink-0 items-center justify-center rounded-pill bg-bg-muted outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
        >
          <Icon name="user-24" size={24} />
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-lg bg-bg-success p-4 text-text-inverse" aria-label="Economiile tale">
        <Icon name="promo-shape-back" size={90} className="absolute top-[65px] right-[60px]" />
        <Icon name="promo-shape" size={150} className="absolute top-[86px] -right-[30px]" />
        <div className="relative flex max-w-[190px] flex-col items-start gap-2">
          <Tag tone="deal" className="bg-bg-deal text-text-primary">
            Economiile tale
          </Tag>
          <p className="display-md">{formatRon(totalSavings)} economisiți</p>
          <p className="body-compact">
            {totalSavings > 0 ? "Față de prețul întreg, în grupurile încheiate." : "Intră în primul tău grup. La închidere vezi aici cât ai economisit față de prețul întreg."}
          </p>
        </div>
      </section>

      {myGroups.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Grupurile mele</SectionTitle>
          {myGroups.map((g) => (
            <Link
              key={g.productId}
              href={`/produs/${g.productId}`}
              className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-surface p-4 outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate title-md text-text-primary">{g.name}</span>
                <span className="body-sm text-text-secondary">
                  {g.offer.next ? (
                    <>
                      Încă {units(g.offer.next.unitsMissing)} și scade la <b className="text-text-primary">{formatRon(g.offer.next.unitPrice)}</b>
                    </>
                  ) : (
                    "Cel mai bun preț e atins"
                  )}{" "}
                  · {dayLabel(g.closesAt, now)}
                </span>
              </span>
              <Icon name="chevron-right-20" size={20} />
            </Link>
          ))}
        </section>
      )}

      {stores.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Supermarketuri</SectionTitle>
          <div className="-mx-page flex gap-3 overflow-x-auto px-page pb-1 [scrollbar-width:none]">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/magazin/${s.id}`}
                className="flex w-[220px] shrink-0 flex-col gap-1 rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-card outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
              >
                <span className="flex size-10 items-center justify-center rounded-md bg-bg-brand-soft">
                  <Icon name="store-20-success" size={20} />
                </span>
                <span className="truncate title-md text-text-primary">{s.name}</span>
                <span className="line-clamp-2 body-sm text-text-secondary">{s.address}</span>
                <span className="label-sm text-text-secondary">{s.openGroupCount} grupuri active</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <HomeDeals cards={cards} categories={usedCategories} initialCategory={category} />
    </BuyerScreen>
  );
}
