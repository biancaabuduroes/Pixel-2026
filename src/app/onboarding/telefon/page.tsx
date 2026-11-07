"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { TextField } from "@/components/ds/text-field";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { stepNumber, TOTAL_STEPS } from "@/lib/onboarding";

// Figma B1.2a Sign up · phone. Mock: no SMS is sent (decision 2026-11-07).
export default function PhonePage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const valid = /^7\d{8}$/.test(digits); // Romanian mobile, without the leading 0

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding", step: stepNumber("telefon"), totalSteps: TOTAL_STEPS }}
      footer={
        <>
          <Link href="/autentificare" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
            <Icon name="mail-20" size={20} />
            Continuă cu email
          </Link>
          <Button className="w-full" disabled={!valid} onClick={() => router.push(`/onboarding/cod?tel=${digits}`)}>
            Continuă
          </Button>
          <p className="text-center caption text-text-secondary">Continuând, accepți Termenii și Politica de confidențialitate.</p>
        </>
      }
    >
      <ScreenTitle>Introdu numărul de telefon</ScreenTitle>
      <TextField
        aria-label="Număr de telefon"
        prefix="+40"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="712 345 678"
        maxLength={11}
        value={digits.replace(/(\d{3})(?=\d)/g, "$1 ")}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
      />
      <p className="caption text-text-secondary">Îți trimitem un cod de verificare prin SMS. Dacă ai deja cont, te autentificăm direct.</p>
    </OnboardingScreen>
  );
}
