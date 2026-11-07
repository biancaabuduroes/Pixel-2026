"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, type FigmaIconName } from "@/components/ds/icon";
import { PageDots } from "@/components/ds/page-dots";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button, buttonVariants } from "@/components/ui/button";

// Figma B1.1a–c Welcome slides.
const SLIDES: { icon: FigmaIconName; title: string; lead: string }[] = [
  {
    icon: "users-96-brand",
    title: "Cumpără împreună, plătește mai puțin",
    lead: "De la scutece la ulei și detergent: intri în grup cu alții și, cu cât sunteți mai mulți, cu atât scade prețul.",
  },
  {
    icon: "lock-96-brand",
    title: "Plătești doar prețul final",
    lead: "Plătești cu bunToken din portofel, 1 bunToken = 1 RON. Blocăm prețul maxim când intri, iar diferența îți revine automat la închidere.",
  },
  {
    icon: "compass-96-brand",
    title: "Intră în grupurile din zona ta",
    lead: "Vecinii tăi cumpără deja împreună. Intră în grupurile lor și scade prețul pentru toți. Nu găsești ce cauți? Abia atunci pornești tu unul.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <OnboardingScreen
      footer={
        <>
          <PageDots count={SLIDES.length} active={index} />
          <Button className="w-full" onClick={() => (last ? router.push("/onboarding/telefon") : setIndex(index + 1))}>
            {last ? "Începe" : "Continuă"}
          </Button>
          <div className="flex justify-center">
            <Link href="/autentificare" className={buttonVariants({ variant: "link", size: "md" })}>
              Am deja cont
            </Link>
          </div>
        </>
      }
    >
      <div className="flex flex-1 items-center justify-center">
        <div className="flex size-60 items-center justify-center rounded-pill bg-bg-brand-soft">
          <Icon name={slide.icon} size={96} />
        </div>
      </div>
      <section aria-live="polite" className="flex flex-col gap-4">
        <h1 className="text-center display-lg text-text-primary">{slide.title}</h1>
        <p className="text-center body-lg text-text-secondary">{slide.lead}</p>
      </section>
    </OnboardingScreen>
  );
}
