"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { TextField } from "@/components/ds/text-field";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { nationalNumber, stepNumber, TOTAL_STEPS } from "@/lib/onboarding";

// Figma B1.2a Sign up · phone. Mock: no SMS is sent (decision 2026-11-07).
// `initialPhone`: prefilled in DEMO_MODE so demos move fast (decision 2026-11-08); still editable.
export function PhoneForm({ initialPhone = "" }: { initialPhone?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const digits = nationalNumber(phone);
  const valid = digits.length === 9; // mock: any 9-digit Romanian number

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding/bun-venit", step: stepNumber("telefon"), totalSteps: TOTAL_STEPS }}
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
        maxLength={16}
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d +]/g, ""))}
      />
      <p className="caption text-text-secondary">Îți trimitem un cod de verificare prin SMS. Dacă ai deja cont, te autentificăm direct.</p>
    </OnboardingScreen>
  );
}
