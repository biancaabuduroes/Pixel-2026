"use client";

import { useState, useTransition } from "react";
import { InlineAlert } from "@/components/ds/inline-alert";
import { TextField } from "@/components/ds/text-field";
import { OnboardingScreen, ScreenLead, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { DEMO_BUYER_EMAIL, DEMO_PASSWORD, DEMO_SELLER_EMAIL } from "@/lib/onboarding";
import { loginAction } from "@/server/actions/onboarding";

// Not in Figma (approved 2026-11-07): demo login for the 2 predefined users, built from the
// same components and layout as B1.2a.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await loginAction({ email, password }); // redirects home on success
      if (result && !result.ok) setError(result.reason === "WRONG_CREDENTIALS" ? "Email sau parolă greșită." : "Autentificarea nu este disponibilă acum.");
    });
  };

  return (
    <OnboardingScreen nav={{ backHref: "/onboarding", step: 0, totalSteps: 1 }}>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <ScreenTitle>Intră în cont</ScreenTitle>
        <ScreenLead>Folosește unul dintre conturile demo.</ScreenLead>
        <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Parolă" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} required />
        <InlineAlert tone="info" icon="info-24" title="Conturi demo">
          Cumpărător: {DEMO_BUYER_EMAIL} · Vânzător: {DEMO_SELLER_EMAIL} · Parolă: {DEMO_PASSWORD}
        </InlineAlert>
        <div className="mt-auto pt-4">
          <Button type="submit" className="w-full" disabled={!email || !password || pending}>
            Intră în cont
          </Button>
        </div>
      </form>
    </OnboardingScreen>
  );
}
