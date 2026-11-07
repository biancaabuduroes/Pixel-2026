import Link from "next/link";
import { Suspense } from "react";
import { OnboardingScreen, ScreenLead, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/onboarding";
import { currentProfile } from "@/server/session";

// Home placeholder (decision 2026-11-07) until the buyer flow is built. src/proxy.ts sends
// visitors who haven't finished onboarding to /onboarding first.
export default function Home() {
  return (
    <Suspense fallback={<OnboardingScreen>{null}</OnboardingScreen>}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  const profile = await currentProfile();
  if (!profile) {
    return (
      <OnboardingScreen
        footer={
          <Link href="/autentificare" className={buttonVariants({ className: "w-full" })}>
            Intră în cont
          </Link>
        }
      >
        <ScreenTitle>BunDeals</ScreenTitle>
        <ScreenLead>Cumpără împreună, plătește mai puțin.</ScreenLead>
      </OnboardingScreen>
    );
  }
  const prefs = (profile.preferences ?? {}) as { firstName?: string };
  const name = prefs.firstName || profile.name.split(" ")[0];
  return (
    <OnboardingScreen
      footer={
        <>
          <Link
            href={profile.role === "SELLER" ? "/seller/pickup" : "/purchases"}
            className={buttonVariants({ variant: "secondary", className: "w-full" })}
          >
            {profile.role === "SELLER" ? "Confirmă ridicări" : "Achizițiile mele"}
          </Link>
          <form action={logoutAction} className="flex justify-center">
            <Button type="submit" variant="link" size="md">
              Ieși din cont
            </Button>
          </form>
        </>
      }
    >
      <ScreenTitle>Bun venit, {name}!</ScreenTitle>
      <ScreenLead>Grupurile din zona ta apar aici în curând.</ScreenLead>
    </OnboardingScreen>
  );
}
