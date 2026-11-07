"use client";

import { useRouter } from "next/navigation";
import { use, useState, useTransition } from "react";
import { Countdown } from "@/components/ds/countdown";
import { OtpInput } from "@/components/ds/otp-input";
import { OnboardingScreen, ScreenLead, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { verifyPhoneCodeAction } from "@/server/actions/onboarding";

const RESEND_SECONDS = 60;

/** "712345678" → "+40 712 ••• 678" */
function maskPhone(tel: string | undefined): string {
  const d = /^\d{9}$/.test(tel ?? "") ? tel! : "712345678";
  return `+40 ${d.slice(0, 3)} ••• ${d.slice(6)}`;
}

export function CodeForm({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = use(searchParams);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendKey, setResendKey] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [pending, startTransition] = useTransition();

  const verify = (value: string) =>
    startTransition(async () => {
      setError(null);
      const result = await verifyPhoneCodeAction({ code: value });
      if (result.ok) router.push("/onboarding/nume");
      else setError(result.reason === "DEMO_USERS_MISSING" ? "Contul demo nu există încă în baza de date." : "Codul nu a putut fi verificat. Încearcă din nou.");
    });

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding/telefon", step: stepNumber("cod"), totalSteps: TOTAL_STEPS }}
    >
      <ScreenTitle>Verifică numărul</ScreenTitle>
      <ScreenLead>Introdu codul trimis la {maskPhone(typeof params.tel === "string" ? params.tel : undefined)}</ScreenLead>
      <div aria-busy={pending}>
        <OtpInput value={code} onValueChange={setCode} onComplete={verify} />
      </div>
      {error && (
        <p role="alert" className="text-center title-sm text-text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="link"
          size="md"
          disabled={!canResend}
          onClick={() => {
            setCanResend(false);
            setResendKey((k) => k + 1);
          }}
        >
          Nu ai primit codul?
        </Button>
        {!canResend && <Countdown key={resendKey} seconds={RESEND_SECONDS} onDone={() => setCanResend(true)} />}
      </div>
    </OnboardingScreen>
  );
}
