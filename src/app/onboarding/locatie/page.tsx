"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { InlineAlert } from "@/components/ds/inline-alert";
import { SearchBar } from "@/components/ds/search-bar";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { RealMap, type LatLng } from "@/components/onboarding/real-map";
import { Button } from "@/components/ui/button";
import { findAddress } from "@/lib/geocode";
import { DEMO_ADDRESS, DEMO_POSITION, NEARBY_MOCK, RADIUS_KM, stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { savePreferencesAction } from "@/server/actions/onboarding";

type Radius = (typeof RADIUS_KM)[number];
type Place = { label: string; position: LatLng };
const RADII = RADIUS_KM.map((r) => ({ value: String(r) as `${Radius}`, label: `${r} km` }));

// Figma B1.4 Location and radius (empty + address found), with a real map.
export default function LocationPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [radius, setRadius] = useState<Radius>(3);
  const [notice, setNotice] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [pending, startTransition] = useTransition();
  const nearby = NEARBY_MOCK[radius];

  const show = (found: Place) => {
    setPlace(found);
    setQuery(found.label);
  };
  const search = () =>
    startSearch(async () => {
      if (!query.trim()) return;
      setNotice(null);
      const found = await findAddress(query.trim()).catch(() => null);
      if (found) show(found);
      else setNotice("Nu am găsit adresa. Încearcă strada, numărul și orașul.");
    });
  // Demo: "my location" is always the fixed demo address (no browser permission prompt).
  const useMyLocation = () => {
    setNotice(null);
    show({ label: DEMO_ADDRESS, position: DEMO_POSITION });
  };
  const next = () =>
    startTransition(async () => {
      if (!place) return;
      await savePreferencesAction({ address: place.label, lat: place.position.lat, lng: place.position.lng, radiusKm: radius });
      router.push("/onboarding/incarca");
    });

  return (
    <OnboardingScreen
      gap="gap-3"
      nav={{ backHref: "/onboarding/buget", step: stepNumber("locatie"), totalSteps: TOTAL_STEPS }}
      footer={
        <Button className="w-full" disabled={!place || pending} onClick={next}>
          Continuă
        </Button>
      }
    >
      <ScreenTitle>De unde ridici comenzile?</ScreenTitle>
      <SearchBar
        label="Adresa ta"
        placeholder="Caută adresa ta"
        value={query}
        onValueChange={(value) => {
          setQuery(value);
          if (place && value !== place.label) setPlace(null);
        }}
        onSubmit={search}
      />
      {notice && (
        <p role="status" className="body-sm text-text-secondary">
          {notice}
        </p>
      )}
      {place ? (
        <>
          <RealMap center={place.position} radiusKm={radius} />
          <SegmentedControl label="Raza de căutare" options={RADII} value={`${radius}`} onValueChange={(v) => setRadius(Number(v) as Radius)} />
          <InlineAlert tone="deal" icon="users-20-deal">
            {nearby.groups} grupuri active și {nearby.stores} {nearby.stores === 1 ? "magazin partener" : "magazine partenere"} în {radius} km de tine
          </InlineAlert>
        </>
      ) : (
        <div className="flex w-full flex-col items-center gap-3 rounded-lg bg-bg-subtle py-4" aria-busy={searching}>
          <EmptyState icon="location-32-brand" title="Unde locuiești?" body="Caută adresa ca să vezi magazinele partenere din jurul tău." />
          <Button variant="secondary" size="md" onClick={useMyLocation}>
            <Icon name="compass-20" size={20} />
            Folosește locația mea
          </Button>
        </div>
      )}
    </OnboardingScreen>
  );
}
