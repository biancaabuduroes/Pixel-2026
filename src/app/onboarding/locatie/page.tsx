"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { InlineAlert } from "@/components/ds/inline-alert";
import { SearchBar } from "@/components/ds/search-bar";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { MapMock } from "@/components/onboarding/map-mock";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { DEMO_ADDRESS, NEARBY_MOCK, RADIUS_KM, stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { savePreferencesAction } from "@/server/actions/onboarding";

type Radius = (typeof RADIUS_KM)[number];
const RADII = RADIUS_KM.map((r) => ({ value: String(r) as `${Radius}`, label: `${r} km` }));

// Figma B1.4 Location and radius (empty + address found). Address search and location are mocked.
export default function LocationPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [radius, setRadius] = useState<Radius>(3);
  const [pending, startTransition] = useTransition();
  const nearby = NEARBY_MOCK[radius];

  const confirm = (value: string) => {
    setQuery(value);
    setAddress(value.trim() ? value.trim() : null);
  };
  const next = () =>
    startTransition(async () => {
      if (!address) return;
      await savePreferencesAction({ address, radiusKm: radius });
      router.push("/onboarding/incarca");
    });

  return (
    <OnboardingScreen
      gap="gap-3"
      nav={{ backHref: "/onboarding/buget", step: stepNumber("locatie"), totalSteps: TOTAL_STEPS }}
      footer={
        <Button className="w-full" disabled={!address || pending} onClick={next}>
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
          if (value !== address) setAddress(null);
        }}
        onSubmit={() => confirm(query)}
      />
      {address ? (
        <>
          <MapMock radiusKm={radius} />
          <SegmentedControl label="Raza de căutare" options={RADII} value={`${radius}`} onValueChange={(v) => setRadius(Number(v) as Radius)} />
          <InlineAlert tone="deal" icon="users-20-deal">
            {nearby.groups} grupuri active și {nearby.stores} {nearby.stores === 1 ? "magazin partener" : "magazine partenere"} în {radius} km de tine
          </InlineAlert>
        </>
      ) : (
        <div className="flex w-full flex-col items-center gap-3 rounded-lg bg-bg-subtle py-4">
          <EmptyState icon="location-32-brand" title="Unde locuiești?" body="Caută adresa ca să vezi magazinele partenere din jurul tău." />
          <Button variant="secondary" size="md" onClick={() => confirm(DEMO_ADDRESS)}>
            <Icon name="compass-20" size={20} />
            Folosește locația mea
          </Button>
        </div>
      )}
    </OnboardingScreen>
  );
}
