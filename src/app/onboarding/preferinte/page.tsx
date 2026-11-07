"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChipGroup } from "@/components/ds/chip-group";
import { InlineAlert } from "@/components/ds/inline-alert";
import { RadioGroup } from "@/components/ds/radio-group";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { CATEGORIES, LOCAL_PREFERENCE, stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { savePreferencesAction } from "@/server/actions/onboarding";

type Local = (typeof LOCAL_PREFERENCE)[number]["value"];
type Category = (typeof CATEGORIES)[number]["value"];

// Figma B1.3b Shopping preferences (+ "no category selected" state).
export default function PreferencesPage() {
  const router = useRouter();
  const [localPreference, setLocalPreference] = useState<Local>("local");
  const [categories, setCategories] = useState<Category[]>([]);
  const [pending, startTransition] = useTransition();

  const next = () =>
    startTransition(async () => {
      await savePreferencesAction({ localPreference, categories });
      router.push("/onboarding/buget");
    });

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding/nume", step: stepNumber("preferinte"), totalSteps: TOTAL_STEPS }}
      footer={
        <>
          <Button className="w-full" disabled={categories.length === 0 || pending} onClick={next}>
            {categories.length === 0 ? "Alege cel puțin o categorie" : "Continuă"}
          </Button>
          <div className="flex justify-center">
            <Link href="/onboarding/buget" className={buttonVariants({ variant: "link", size: "md" })}>
              Sari peste
            </Link>
          </div>
        </>
      }
    >
      <ScreenTitle>Ce fel de cumpărături faci?</ScreenTitle>
      <h2 className="pt-2 title-lg text-text-primary">Preferi producători locali și români?</h2>
      <RadioGroup label="Preferi producători locali și români?" options={LOCAL_PREFERENCE} value={localPreference} onValueChange={setLocalPreference} />
      {localPreference === "local" && (
        <InlineAlert tone="success" icon="store-20-success">
          Îți arătăm mai întâi grupurile de la producători locali și români.
        </InlineAlert>
      )}
      <h2 className="pt-2 title-lg text-text-primary">Ce cumperi des?</h2>
      <ChipGroup label="Ce cumperi des?" options={CATEGORIES} value={categories} onValueChange={setCategories} />
    </OnboardingScreen>
  );
}
