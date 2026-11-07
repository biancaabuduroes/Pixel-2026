"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ds/checkbox";
import { TextField } from "@/components/ds/text-field";
import { OnboardingScreen, ScreenLead, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { savePreferencesAction } from "@/server/actions/onboarding";

// Figma B1.3a Personal details.
export default function NamePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showInitialOnly, setShowInitialOnly] = useState(true);
  const [pending, startTransition] = useTransition();

  const next = () =>
    startTransition(async () => {
      const result = await savePreferencesAction({ firstName, lastName, showInitialOnly });
      router.push(result.ok || result.reason !== "UNAUTHORIZED" ? "/onboarding/preferinte" : "/onboarding/telefon");
    });

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding/cod", step: stepNumber("nume"), totalSteps: TOTAL_STEPS }}
      footer={
        <Button className="w-full" disabled={!firstName.trim() || pending} onClick={next}>
          Continuă
        </Button>
      }
    >
      <ScreenTitle>Cum te numești?</ScreenTitle>
      <ScreenLead>Așa te vor vedea vecinii din grup.</ScreenLead>
      <TextField label="Prenume" placeholder="Prenume" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <TextField label="Nume" placeholder="Nume" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <Checkbox label="Arată doar prenumele și inițiala în grupuri" checked={showInitialOnly} onCheckedChange={setShowInitialOnly} />
    </OnboardingScreen>
  );
}
